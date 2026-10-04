// Platformaning yagona API funksiyasi: /api/* so'rovlarini marshrutlaydi.
import { db, getMany } from "../lib/store.mjs";
import { hashPassword, verifyPassword, createToken, readToken, newId, setGeneratedSecret } from "../lib/auth.mjs";
import crypto from "node:crypto";
import {
  SCENARIOS,
  CRITERIA,
  publicScenario,
  personaSystemPrompt,
  evaluationPrompt,
  hintPrompt,
  EVALUATION_SCHEMA,
} from "../lib/scenarios.mjs";
import { aiEnabled, streamText, completeText, modelName, provider, voiceEnabled, transcribeAudio } from "../lib/ai.mjs";
import { demoReply, demoEvaluation } from "../lib/demo.mjs";
import { computeGame, certificateStatus } from "../../public/js/gamification.js";
import { findTopic, tutorSystem, searchAnswer } from "../lib/tutor.mjs";
import { TOPICS } from "../../public/data/topics.js";
import { itemAnalysis } from "../lib/itemstats.mjs";
import { synthesize, ttsEnabled, ttsModels, ttsKey, VOICES, STYLES } from "../lib/tts.mjs";
import { LAB_RUBRIC, LAB_LEVELS, labLevel, labReviewPrompt, LAB_REVIEW_SCHEMA, parseLabReview, demoLabReview } from "../lib/lab-task.mjs";
import { normalizeSubmission, reviewPrompt, REVIEW_SCHEMA, REVIEW_CRITERIA, parseReview, demoReview as demoPracticeReview, totalOf } from "../lib/practice-review.mjs";
const MAX_TURNS = 40;
const MAX_MESSAGE_CHARS = 2000;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });

const textStream = (stream) =>
  new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-cache" } });

const emailKey = (email) => `user-email/${email.toLowerCase()}`;
const userKey = (id) => `user/${id}`;

function publicUser(u) {
  const { salt, hash, ...rest } = u;
  return rest;
}

async function body(req) {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "So'rov formati noto'g'ri");
  }
}

async function currentUser(req) {
  const auth = req.headers.get("authorization") || "";
  const data = readToken(auth.replace(/^Bearer\s+/i, ""));
  if (!data) return null;
  const user = await db().get(userKey(data.uid));
  // Parol tiklanganda eski kirishlar (boshqa qurilmalardagi) bekor bo'ladi.
  return user && (user.pwdV || 0) === (data.pv || 0) ? user : null;
}

async function requireUser(req) {
  const user = await currentUser(req);
  if (!user) throw new HttpError(401, "Tizimga kiring");
  return user;
}

async function requireTeacher(req) {
  const user = await requireUser(req);
  if (user.role !== "teacher") throw new HttpError(403, "Bu bo'lim faqat o'qituvchilar uchun");
  return user;
}

const str = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// ---------- Auth ----------

async function register(req) {
  const b = await body(req);
  const email = str(b.email, 120).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const name = str(b.name, 120);
  const role = b.role === "teacher" ? "teacher" : "student";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Email noto'g'ri kiritilgan");
  if (password.length < 6) throw new HttpError(400, "Parol kamida 6 belgidan iborat bo'lishi kerak");
  if (!name) throw new HttpError(400, "Ism-familiyani kiriting");
  if (role === "teacher") {
    const code = process.env.TEACHER_CODE;
    if (!code) throw new HttpError(403, "O'qituvchi ro'yxatdan o'tishi hali sozlanmagan (TEACHER_CODE)");
    if (str(b.teacherCode) !== code) throw new HttpError(403, "O'qituvchi kodi noto'g'ri");
  }
  const store = db();
  if (await store.get(emailKey(email))) throw new HttpError(409, "Bu email bilan foydalanuvchi allaqachon mavjud");

  const user = {
    id: newId(),
    email,
    name,
    role,
    group: str(b.group, 60),
    college: str(b.college, 160),
    cohort: role === "student" ? (["experimental", "control"].includes(b.cohort) ? b.cohort : "unassigned") : undefined,
    cohortSource: role === "student" && ["experimental", "control"].includes(b.cohort) ? "self" : undefined,
    createdAt: new Date().toISOString(),
    ...(await hashPassword(password)),
  };
  if (role === "student") user.code = await nextCode();
  await store.set(userKey(user.id), user);
  await store.set(emailKey(email), { id: user.id });
  return json({ token: createToken(user), user: publicUser(user) }, 201);
}

async function login(req) {
  const b = await body(req);
  const email = str(b.email, 120).toLowerCase();
  const ref = await db().get(emailKey(email));
  const user = ref && (await db().get(userKey(ref.id)));
  if (!user || !(await verifyPassword(String(b.password || ""), user.salt, user.hash))) {
    throw new HttpError(401, "Email yoki parol noto'g'ri");
  }
  return json({ token: createToken(user), user: publicUser(user) });
}

// ---------- Parolni tiklash ----------
// O'qituvchi: email + o'qituvchi kodi (TEACHER_CODE) orqali yangi parol o'rnatadi.
// Talaba: o'qituvchi panelidan vaqtinchalik parol oladi (adminResetPassword).
const RESET_LIMIT = 5;
const RESET_WINDOW_MS = 15 * 60_000;

async function resetPassword(req) {
  const b = await body(req);
  const email = str(b.email, 120).toLowerCase();
  const newPassword = typeof b.newPassword === "string" ? b.newPassword : "";
  const code = process.env.TEACHER_CODE;
  if (!code) throw new HttpError(403, "O'qituvchi kodi sozlanmagan (Netlify → Environment variables → TEACHER_CODE)");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Email noto'g'ri kiritilgan");
  if (newPassword.length < 6) throw new HttpError(400, "Yangi parol kamida 6 belgidan iborat bo'lishi kerak");
  const store = db();
  const rlKey = `ratelimit/reset/${crypto.createHash("sha256").update(email).digest("hex").slice(0, 32)}`;
  const rl = (await store.get(rlKey)) || { count: 0, since: Date.now() };
  if (Date.now() - rl.since > RESET_WINDOW_MS) Object.assign(rl, { count: 0, since: Date.now() });
  if (rl.count >= RESET_LIMIT) throw new HttpError(429, "Urinishlar ko'p bo'ldi. 15 daqiqadan keyin qayta urinib ko'ring.");
  if (str(b.teacherCode) !== code) {
    rl.count++;
    await store.set(rlKey, rl);
    await new Promise((r) => setTimeout(r, 700));
    throw new HttpError(403, `O'qituvchi kodi noto'g'ri (qolgan urinishlar: ${RESET_LIMIT - rl.count})`);
  }
  const ref = await store.get(emailKey(email));
  const user = ref && (await store.get(userKey(ref.id)));
  if (!user) throw new HttpError(404, "Bu email bilan profil topilmadi");
  // O'qituvchi kodi to'g'ri — bu email talaba profiliga tegishli bo'lsa (masalan, ro'yxatdan o'tishda
  // "O'qituvchi" tanlanmagan), uni o'qituvchi profiliga aylantirish yoki faqat parolini yangilash mumkin.
  if (user.role !== "teacher") {
    if (!["teacher", "student"].includes(b.as)) {
      return json({ needsChoice: true, name: user.name, error: "Bu email talaba profiliga tegishli. Uni o'qituvchi profiliga aylantirasizmi yoki faqat parolini yangilaysizmi?" }, 409);
    }
    if (b.as === "teacher") {
      user.role = "teacher";
      user.promotedAt = new Date().toISOString();
      delete user.cohort;
      delete user.cohortSource;
    }
  }
  Object.assign(user, await hashPassword(newPassword), { pwdV: (user.pwdV || 0) + 1, pwdResetAt: new Date().toISOString() });
  await store.set(userKey(user.id), user);
  await store.del(rlKey);
  return json({ token: createToken(user), user: publicUser(user) });
}

async function adminResetPassword(req, id) {
  await requireTeacher(req);
  const user = await db().get(userKey(id));
  if (!user) throw new HttpError(404, "Foydalanuvchi topilmadi");
  if (user.role !== "student") throw new HttpError(403, "Faqat talaba parolini tiklash mumkin");
  // Oson o'qiladigan vaqtinchalik parol (0/O, 1/l kabi chalkash belgilarsiz).
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const password = Array.from(crypto.randomBytes(8), (x) => alphabet[x % alphabet.length]).join("");
  Object.assign(user, await hashPassword(password), { pwdV: (user.pwdV || 0) + 1, pwdResetAt: new Date().toISOString() });
  await db().set(userKey(id), user);
  return json({ password });
}

async function updateMe(req) {
  const user = await requireUser(req);
  const b = await body(req);
  if (b.name !== undefined) user.name = str(b.name, 120) || user.name;
  if (b.group !== undefined) user.group = str(b.group, 60);
  if (b.college !== undefined) user.college = str(b.college, 160);
  if (b.hideFromRating !== undefined) user.hideFromRating = Boolean(b.hideFromRating);
  // Talaba guruhini faqat hali belgilanmagan bo'lsa o'zi tanlaydi; keyin uni o'qituvchi o'zgartiradi.
  if (user.role === "student" && (user.cohort || "unassigned") === "unassigned" && ["experimental", "control"].includes(b.cohort)) {
    user.cohort = b.cohort;
    user.cohortSource = "self";
  }
  if (b.newPassword) {
    if (!(await verifyPassword(String(b.password || ""), user.salt, user.hash))) throw new HttpError(400, "Joriy parol noto'g'ri");
    if (String(b.newPassword).length < 6) throw new HttpError(400, "Yangi parol kamida 6 belgi bo'lsin");
    Object.assign(user, await hashPassword(String(b.newPassword)));
  }
  await db().set(userKey(user.id), user);
  return json({ user: publicUser(user) });
}



// ---------- Teacher: students, results ----------

async function listStudents(req) {
  await requireTeacher(req);
  const all = await getMany("user/");
  for (const u of all) await ensureCode(u);
  const users = all.map(publicUser).sort((a, b) => a.name.localeCompare(b.name));
  return json(users);
}

async function updateStudent(req, id) {
  await requireTeacher(req);
  const user = await db().get(userKey(id));
  if (!user) throw new HttpError(404, "Foydalanuvchi topilmadi");
  const b = await body(req);
  if (["experimental", "control", "unassigned"].includes(b.cohort) && b.cohort !== user.cohort) {
    user.cohort = b.cohort;
    user.cohortSource = "teacher";
  }
  if (b.group !== undefined) user.group = str(b.group, 60);
  await db().set(userKey(id), user);
  return json(publicUser(user));
}

async function overview(req) {
  await requireTeacher(req);
  const [users, sessions, submissions, labsAll, reviews] = await Promise.all([getMany("user/"), getMany("trainer/"), getMany("selfstudy/"), getMany("lab/"), getMany("practicereview/")]);
  const students = users.filter((u) => u.role === "student");
  return json({
    students: students.length,
    teachers: users.length - students.length,
    trainerSessions: sessions.length,
    avgTrainerScore: sessions.length ? Math.round(sessions.reduce((s, x) => s + (x.total || 0), 0) / sessions.length) : null,
    selfStudySubmissions: submissions.length,
    ungraded: submissions.filter((s) => s.grade == null).length,
    practiceReviews: reviews.length,
    avgPracticeScore: reviews.length ? Math.round((reviews.reduce((s, x) => s + (x.total || 0), 0) / reviews.length) * 10) / 10 : null,
    aiEnabled: aiEnabled(),
    aiProvider: provider(),
    aiModel: modelName(),
    labs: {
      submitted: labsAll.filter((p) => p.status === "submitted").length,
      graded: labsAll.filter((p) => p.status === "graded").length,
    },
  });
}

// ---------- Progress & self-study ----------

async function getProgress(req) {
  const user = await requireUser(req);
  return json((await db().get(`progress/${user.id}`)) || { topics: {}, plan: [], notes: {} });
}

async function saveProgress(req) {
  const user = await requireUser(req);
  const b = await body(req);
  const obj = (v) => (typeof v === "object" && v && !Array.isArray(v) ? v : {});
  const activity = Object.fromEntries(
    Object.entries(obj(b.activity))
      .filter(([k, v]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && Number.isFinite(v))
      .sort(([a], [c]) => c.localeCompare(a))
      .slice(0, 400)
      .map(([k, v]) => [k, Math.max(0, Math.min(10000, Math.round(v)))])
  );
  const srs = Object.fromEntries(
    Object.entries(obj(b.srs))
      .slice(0, 3000)
      .filter(([k, v]) => k.length <= 120 && Number.isInteger(v?.box) && typeof v?.due === "string")
      .map(([k, v]) => [k, { box: Math.max(0, Math.min(5, v.box)), due: v.due.slice(0, 10) }])
  );
  const st = obj(b.srsStats);
  const progress = {
    topics: obj(b.topics),
    plan: Array.isArray(b.plan) ? b.plan.slice(0, 200) : [],
    notes: obj(b.notes),
    activity,
    srs,
    srsStats: { reviews: Math.max(0, Math.min(100000, Number(st.reviews) || 0)), lastReview: str(st.lastReview, 10) },
    updatedAt: new Date().toISOString(),
  };
  if (JSON.stringify(progress).length > 200_000) throw new HttpError(413, "Ma'lumot hajmi juda katta");
  await db().set(`progress/${user.id}`, progress);
  return json(progress);
}

async function mySelfStudy(req) {
  const user = await requireUser(req);
  return json(await getMany(`selfstudy/${user.id}/`));
}

async function submitSelfStudy(req, taskId) {
  const user = await requireUser(req);
  const b = await body(req);
  const text = str(b.text, 10000);
  const link = str(b.link, 500);
  if (!text && !link) throw new HttpError(400, "Javob matni yoki havolani kiriting");
  if (link && !/^https?:\/\//i.test(link)) throw new HttpError(400, "Havola http:// yoki https:// bilan boshlanishi kerak");
  const key = `selfstudy/${user.id}/${taskId}`;
  const prev = await db().get(key);
  const item = {
    taskId: str(taskId, 80),
    taskTitle: str(b.taskTitle, 300),
    topicTitle: str(b.topicTitle, 300),
    userId: user.id,
    user: { name: user.name, group: user.group, email: user.email },
    text,
    link,
    submittedAt: new Date().toISOString(),
    // Qayta topshirilganda oldingi baho saqlanadi, ammo "qayta ko'rib chiqish" belgisi qo'yiladi.
    grade: prev?.grade ?? null,
    feedback: prev?.feedback ?? "",
    resubmitted: Boolean(prev),
  };
  await db().set(key, item);
  return json(item);
}

async function allSelfStudy(req) {
  await requireTeacher(req);
  const items = await getMany("selfstudy/");
  return json(items.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)));
}

async function gradeSelfStudy(req, userId, taskId) {
  const teacher = await requireTeacher(req);
  const key = `selfstudy/${userId}/${taskId}`;
  const item = await db().get(key);
  if (!item) throw new HttpError(404, "Topshiriq topilmadi");
  const b = await body(req);
  const grade = Number(b.grade);
  if (!Number.isInteger(grade) || grade < 2 || grade > 5) throw new HttpError(400, "Baho 2 dan 5 gacha bo'lishi kerak");
  Object.assign(item, { grade, feedback: str(b.feedback, 3000), gradedBy: teacher.name, gradedAt: new Date().toISOString(), resubmitted: false });
  await db().set(key, item);
  return json(item);
}

// ---------- Trainer ----------

function findScenario(id) {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new HttpError(404, "Ssenariy topilmadi");
  return s;
}

function cleanHistory(raw) {
  if (!Array.isArray(raw)) throw new HttpError(400, "Suhbat tarixi noto'g'ri");
  if (raw.length > MAX_TURNS * 2) throw new HttpError(400, "Mashg'ulot juda uzun. Yakunlab, baholashga o'ting.");
  const msgs = raw.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: str(m.content, MAX_MESSAGE_CHARS) }));
  msgs.forEach((m, i) => {
    const expected = i % 2 === 0 ? "user" : "assistant";
    if (m.role !== expected || !m.content) throw new HttpError(400, "Suhbat tarixi ketma-ketligi buzilgan");
  });
  return msgs;
}

// Personaj suhbatni o'zi boshlaydi, shuning uchun tarix boshiga kirish xabari va ochilish replikasi qo'shiladi.
const withOpening = (s, history) => [
  { role: "user", content: "[Mashg'ulot boshlandi. Personaj sifatida birinchi bo'lib gapiring.]" },
  { role: "assistant", content: s.opening },
  ...history,
];

// ---------- AI baholash javobini ishonchli o'qish ----------
// Model ballarni turli shaklda qaytarishi mumkin: boshqa kalit nomi, "16/20" matni, {score: 16} obyekti,
// 0–1 yoki 0–100 shkala, ```json``` ichida. Avval bularning barchasi jimgina 0 ga aylanib qolardi.

const CRIT_ALIASES = {
  communication: ["communication", "muloqot", "nutq", "communic"],
  knowledge: ["knowledge", "bilim", "fakt", "kasbiy bilim"],
  problem: ["problem", "hisob", "raqam", "asos"],
  digital: ["digital", "qaror", "taklif", "boshqaruv"],
  service: ["service", "etika", "mas'uliyat", "professional"],
};

function toScore(v, max = 20) {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "object") return toScore(v.score ?? v.ball ?? v.value ?? v.points ?? v.baho, max);
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  const str2 = String(v).replace(",", ".");
  const frac = str2.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (frac) return (Number(frac[1]) / Number(frac[2])) * max;
  const n = str2.match(/-?\d+(?:\.\d+)?/);
  return n ? Number(n[0]) : undefined;
}

export function parseEvaluation(raw) {
  let text = String(raw || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  let obj = null;
  try {
    obj = JSON.parse(text);
  } catch {
    const a = text.indexOf("{");
    const b = text.lastIndexOf("}");
    if (a >= 0 && b > a) {
      try {
        obj = JSON.parse(text.slice(a, b + 1));
      } catch {}
    }
  }
  if (!obj || typeof obj !== "object") return { found: 0, complete: false, scores: {}, text: null };
  let src = obj.scores ?? obj.ballar ?? obj.baholar ?? obj.criteria ?? obj.mezonlar ?? obj;
  // Massiv ko'rinishi: [{key|criterion|name, score}]
  if (Array.isArray(src)) src = Object.fromEntries(src.map((x) => [String(x.key ?? x.criterion ?? x.name ?? x.mezon ?? ""), x]));
  const entries = Object.entries(src || {});
  const scores = {};
  for (const c of CRITERIA) {
    let v = src?.[c.key];
    if (v === undefined) {
      const hit = entries.find(([k]) => {
        const kk = k.toLowerCase();
        return kk.includes(c.title.toLowerCase().slice(0, 10)) || CRIT_ALIASES[c.key].some((a) => kk.includes(a));
      });
      v = hit?.[1];
    }
    scores[c.key] = toScore(v, c.max);
  }
  const vals = Object.values(scores).filter((v) => Number.isFinite(v));
  // Shkalani moslashtirish: 0–1 (ulush) yoki 0–100 (foiz) bo'lsa — 0–20 ga o'tkazamiz.
  if (vals.length && vals.every((v) => v <= 1) && vals.some((v) => v > 0)) for (const k in scores) if (Number.isFinite(scores[k])) scores[k] *= 20;
  if (vals.some((v) => v > 20) && vals.every((v) => v <= 100)) for (const k in scores) if (Number.isFinite(scores[k])) scores[k] = (scores[k] / 100) * 20;
  const found = Object.values(scores).filter((v) => Number.isFinite(v)).length;
  const pickArr = (...keys) => {
    for (const k of keys) if (obj[k] !== undefined) return Array.isArray(obj[k]) ? obj[k].map(String) : [String(obj[k])];
    return [];
  };
  return {
    found,
    complete: found === CRITERIA.length,
    scores,
    text: {
      summary: String(obj.summary ?? obj.xulosa ?? obj.umumiy ?? ""),
      standard: String(obj.standard ?? obj.standart ?? ""),
      strengths: pickArr("strengths", "kuchli_tomonlar"),
      improvements: pickArr("improvements", "kamchiliklar"),
      recommendations: pickArr("recommendations", "tavsiyalar"),
    },
  };
}

function transcriptOf(s, history) {
  return [`PERSONAJ: ${s.opening}`, ...history.map((m) => `${m.role === "user" ? "TAHLILCHI (talaba)" : "PERSONAJ"}: ${m.content}`)].join("\n\n");
}

// ---------- Ovozli rejim ----------

async function trainerTranscribe(req) {
  await requireUser(req);
  if (!voiceEnabled()) throw new HttpError(503, "Nutqni tanish sozlanmagan (GEMINI_API_KEY)");
  const b = await body(req);
  const s = findScenario(b.scenarioId);
  const audio = typeof b.audio === "string" ? b.audio : "";
  const mime = /^audio\/[\w.+-]+(;.*)?$/.test(String(b.mime)) ? String(b.mime).split(";")[0] : "audio/webm";
  if (!audio || audio.length > 4_000_000) throw new HttpError(400, "Audio yozuv bo'sh yoki juda uzun (eng ko'pi ~2 daqiqa)");
  try {
    return json({ text: await transcribeAudio(audio, mime, { language: s.language }) });
  } catch (err) {
    throw new HttpError(err.status === 429 ? 429 : 502, err.status === 429 ? "So'rovlar limiti tugadi, birozdan so'ng urinib ko'ring" : "Nutqni tanib bo'lmadi");
  }
}

async function trainerChat(req) {
  await requireUser(req);
  const b = await body(req);
  const s = findScenario(b.scenarioId);
  const history = cleanHistory(b.messages);
  if (!history.length || history[history.length - 1].role !== "user") throw new HttpError(400, "Oxirgi xabar talabaniki bo'lishi kerak");
  if (!aiEnabled()) {
    const encoder = new TextEncoder();
    const reply = demoReply(s, history);
    return textStream(new ReadableStream({ start(c) { c.enqueue(encoder.encode(reply)); c.close(); } }));
  }
  return textStream(streamText({ system: personaSystemPrompt(s), messages: withOpening(s, history), maxTokens: 1500, effort: "low" }));
}

async function trainerHint(req) {
  await requireUser(req);
  const b = await body(req);
  const s = findScenario(b.scenarioId);
  const history = Array.isArray(b.messages) && b.messages.length ? cleanHistory(b.messages) : [];
  if (!aiEnabled()) {
    const idx = Math.min(history.filter((m) => m.role === "user").length, s.objectives.length - 1);
    return json({ hint: `Maqsadga e'tibor bering: ${s.objectives[idx]}.`, demo: true });
  }
  const hint = await completeText({
    system: hintPrompt(s),
    messages: [{ role: "user", content: `Suhbat hozirgacha:\n\n${transcriptOf(s, history)}\n\nMenga keyingi qadam uchun maslahat bering.` }],
    maxTokens: 800,
  });
  return json({ hint: hint || "Maqsadlarni qayta ko'rib chiqing va turistning so'nggi savoliga aniq javob bering." });
}

async function trainerEvaluate(req) {
  const user = await requireUser(req);
  const b = await body(req);
  const s = findScenario(b.scenarioId);
  const history = cleanHistory(b.messages);
  const meta = {
    hintsUsed: Math.max(0, Math.min(50, Number(b.hintsUsed) || 0)),
    durationMin: Math.max(0, Math.round((Number(b.durationSec) || 0) / 60)),
  };
  if (history.filter((m) => m.role === "user").length < 2) throw new HttpError(400, "Baholash uchun kamida 2 ta javob yozing");

  let evaluation;
  let evalDebug;
  if (!aiEnabled()) {
    evaluation = demoEvaluation(s, history, meta);
  } else {
    const ask = (strict) =>
      completeText({
        system: "Sen pedagogik baholovchi ekspertsan. Javobni faqat berilgan JSON sxemasiga mos holda qaytar. Ballar butun son (0–20) bo'lsin.",
        messages: [{ role: "user", content: evaluationPrompt(s, transcriptOf(s, history), meta) + (strict ? `\n\nMUHIM: javob FAQAT JSON obyekt bo'lsin, hech qanday izohsiz. "scores" ichida aynan shu kalitlar bo'lsin: ${CRITERIA.map((c) => c.key).join(", ")} — har biri 0 dan 20 gacha butun son. Namuna: {"scores":{${CRITERIA.map((c) => `"${c.key}":14`).join(",")}},"summary":"...","standard":"...","strengths":["..."],"improvements":["..."],"recommendations":["..."]}` : "") }],
        maxTokens: 6000,
        effort: "low",
        format: { type: "json_schema", schema: EVALUATION_SCHEMA },
      });
    let raw = "";
    let parsed = null;
    let failures = 0;
    for (let attempt = 0; attempt < 2; attempt++) {
      let r;
      try {
        r = await ask(attempt > 0);
      } catch (e) {
        console.error("AI baholash xatosi:", e);
        failures++;
        continue;
      }
      raw = r;
      const p2 = parseEvaluation(r);
      if (!parsed || p2.found > parsed.found) parsed = p2;
      if (parsed.complete) break;
      console.error(`AI baholash: ballar to'liq emas (${attempt + 1}-urinish):`, String(r).slice(0, 800));
    }
    if (failures === 2) throw new HttpError(502, "AI baholash xizmati javob bermadi, qayta urinib ko'ring");
    if (!parsed || parsed.found === 0) {
      // AI ballarni umuman qaytarmadi — 0 qo'ymaymiz: taxminiy ball + AI matni (bo'lsa) va ochiq belgi.
      const demo = demoEvaluation(s, history, meta);
      const t = parsed?.text || {};
      const pick = (k) => (Array.isArray(t[k]) ? t[k].length : t[k]) ? t[k] : demo[k];
      evaluation = {
        scores: demo.scores,
        summary: `${pick("summary") === demo.summary ? "" : `${t.summary} `}(AI ballarni qaytarmadi — ballar javoblaringiz asosida taxminiy hisoblandi.)`.trim(),
        standard: pick("standard"),
        strengths: pick("strengths"),
        improvements: pick("improvements"),
        recommendations: pick("recommendations"),
        estimated: true,
      };
      evalDebug = String(raw).slice(0, 1500);
    } else {
      evaluation = { ...parsed.text, scores: parsed.scores };
      if (!parsed.complete) {
        // Yetishmagan mezonlar — mavjudlarining o'rtachasi bilan to'ldiriladi.
        const vals = Object.values(parsed.scores).filter((v) => Number.isFinite(v));
        const avgV = vals.reduce((a, b) => a + b, 0) / vals.length;
        for (const c of CRITERIA) if (!Number.isFinite(evaluation.scores[c.key])) evaluation.scores[c.key] = Math.round(avgV);
        evaluation.estimated = true;
        evalDebug = String(raw).slice(0, 1500);
      }
    }
  }
  for (const c of CRITERIA) evaluation.scores[c.key] = Math.max(0, Math.min(c.max, Math.round(Number(evaluation.scores[c.key]) || 0)));
  for (const k of ["strengths", "improvements", "recommendations"]) if (!Array.isArray(evaluation[k])) evaluation[k] = evaluation[k] ? [String(evaluation[k])] : [];
  const total = CRITERIA.reduce((sum, c) => sum + evaluation.scores[c.key], 0);

  const session = {
    id: newId(),
    userId: user.id,
    user: { name: user.name, group: user.group, cohort: user.cohort },
    scenarioId: s.id,
    scenarioTitle: s.title,
    messages: history,
    opening: s.opening,
    hintsUsed: meta.hintsUsed,
    durationSec: Number(b.durationSec) || 0,
    voice: b.voice === true,
    evaluation,
    total,
    ...(evalDebug ? { evalDebug } : {}),
    model: modelName(),
    createdAt: new Date().toISOString(),
  };
  await db().set(`trainer/${user.id}/${session.id}`, session);
  return json(session);
}

async function mySessions(req) {
  const user = await requireUser(req);
  const sessions = await getMany(`trainer/${user.id}/`);
  return json(sessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

async function allSessions(req) {
  await requireTeacher(req);
  const sessions = await getMany("trainer/");
  return json(sessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

// ---------- Anonim kod ----------

async function nextCode() {
  const store = db();
  const counter = (await store.get("meta/code-counter")) || { n: 0 };
  counter.n += 1;
  await store.set("meta/code-counter", counter);
  return `TM-${String(counter.n).padStart(3, "0")}`;
}

async function ensureCode(user) {
  if (user.role !== "student" || user.code) return user;
  user.code = await nextCode();
  await db().set(userKey(user.id), user);
  return user;
}



// ---------- Marshrut laboratoriyasi ----------



// ---------- Amaliy mashg'ulot: sun'iy intellekt asosida tekshirish ----------

const practiceReviewKey = (uid, topicId, id) => `practicereview/${uid}/${topicId}/${id}`;
const PRACTICE_DAILY = 30;

async function practiceReview(req, topicId) {
  const user = await requireUser(req);
  const b = await body(req);
  if (JSON.stringify(b).length > 60_000) throw new HttpError(413, "Javoblar hajmi juda katta");
  const sub = normalizeSubmission(topicId, b);
  if (!sub) throw new HttpError(404, "Bu mavzu uchun amaliy mashg'ulot topilmadi");
  const filled = sub.tasks.some((t) => t.attempted) || sub.open.some((o) => o.answer.trim().length >= 20) || sub.conclusion.trim().length >= 20;
  if (!filled) throw new HttpError(400, "Tekshirish uchun kamida bitta hisob-kitob yoki ochiq topshiriqni bajaring");

  const day = new Date().toISOString().slice(0, 10);
  const quotaKey = `practicequota/${user.id}/${day}`;
  const quota = (await db().get(quotaKey)) || { n: 0 };
  if (user.role !== "teacher" && quota.n >= PRACTICE_DAILY) throw new HttpError(429, `Bugungi AI tekshiruvlar limiti (${PRACTICE_DAILY} ta) tugadi — ertaga qayta urinib ko'ring`);

  let review = null;
  if (aiEnabled()) {
    for (let attempt = 0; attempt < 2 && !review; attempt++) {
      try {
        const raw = await completeText({
          system: "Sen OTM o'qituvchisi va moliyaviy tahlil bo'yicha ekspertsan. Javobni faqat berilgan JSON sxemasiga mos holda qaytar.",
          messages: [{ role: "user", content: reviewPrompt(sub) + (attempt ? `\n\nMUHIM: FAQAT JSON obyekt qaytar. "scores" kalitlari: ${REVIEW_CRITERIA.map((c) => `${c.key} (0–${c.max})`).join(", ")}.` : "") }],
          maxTokens: 4000,
          effort: "low",
          format: { type: "json_schema", schema: REVIEW_SCHEMA },
        });
        review = parseReview(raw);
      } catch (e) {
        console.error("AI amaliy tekshiruv xatosi:", e);
      }
    }
  }
  if (!review) review = { ...demoPracticeReview(sub), ...(aiEnabled() ? { summary: `${demoPracticeReview(sub).summary.replace(/\(AI kaliti ulanmagan[^)]*\)/, "")} (AI xizmati javob bermadi — baho avtomatik qoidalar asosida taxminiy.)` } : {}) };
  const calc = { correct: sub.tasks.filter((t) => t.ok).length, total: sub.tasks.length };
  const rec = {
    id: newId(),
    userId: user.id,
    user: { name: user.name, group: user.group },
    topicId,
    total: totalOf(review.scores),
    max: 10,
    calc,
    review,
    answers: { tasks: sub.tasks.map((t) => ({ id: t.id, values: t.fields.map((f) => f.given), work: t.work, ok: t.ok })), open: sub.open.map((o) => o.answer), conclusion: sub.conclusion },
    ai: !review.estimated,
    model: review.estimated ? null : modelName(),
    createdAt: new Date().toISOString(),
  };
  await db().set(practiceReviewKey(user.id, topicId, rec.id), rec);
  quota.n++;
  await db().set(quotaKey, quota);
  return json({ ...rec, criteria: REVIEW_CRITERIA });
}

async function myPracticeReviews(req) {
  const user = await requireUser(req);
  const items = await getMany(`practicereview/${user.id}/`);
  return json({ reviews: items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")), criteria: REVIEW_CRITERIA });
}

async function adminPracticeReviews(req) {
  await requireTeacher(req);
  const items = await getMany("practicereview/");
  return json({ reviews: items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 2000), criteria: REVIEW_CRITERIA });
}

async function teacherPracticeComment(req, userId, topicId, id) {
  const teacher = await requireTeacher(req);
  const key = practiceReviewKey(userId, topicId, id);
  const rec = await db().get(key);
  if (!rec) throw new HttpError(404, "Tekshiruv topilmadi");
  const b = await body(req);
  const grade = b.grade === null || b.grade === "" ? null : Number(b.grade);
  if (grade !== null && (!Number.isFinite(grade) || grade < 0 || grade > 10)) throw new HttpError(400, "Baho 0–10 oralig'ida bo'lsin");
  rec.teacher = { grade, comment: str(b.comment, 2000), by: teacher.name, at: new Date().toISOString() };
  await db().set(key, rec);
  return json(rec);
}

// ---------- Tahlil laboratoriyasi (kompleks moliyaviy tahlil loyihasi) ----------

const labKey = (uid, id) => `lab/${uid}/${id}`;

async function myLabs(req) {
  const user = await requireUser(req);
  const items = await getMany(`lab/${user.id}/`);
  return json({ projects: items.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")), rubric: LAB_RUBRIC, levels: LAB_LEVELS, aiEnabled: aiEnabled() });
}

async function saveLab(req, id) {
  const user = await requireUser(req);
  const b = await body(req);
  if (JSON.stringify(b).length > 200_000) throw new HttpError(413, "Loyiha hajmi juda katta");
  const key = labKey(user.id, id);
  const prev = await db().get(key);
  const project = {
    ...b,
    id,
    userId: user.id,
    user: { name: user.name, group: user.group, code: user.code },
    title: str(b.title, 200) || "Nomsiz tahlil",
    status: prev?.status === "graded" || prev?.status === "submitted" ? prev.status : "draft",
    grade: prev?.grade,
    aiReview: prev?.aiReview,
    submittedAt: prev?.submittedAt,
    createdAt: prev?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (prev?.status === "graded" || prev?.status === "submitted") project.changedAfterSubmit = true;
  await db().set(key, project);
  return json(project);
}

async function submitLab(req, id) {
  const user = await requireUser(req);
  const key = labKey(user.id, id);
  const p = await db().get(key);
  if (!p) throw new HttpError(404, "Loyiha topilmadi");
  const words = Object.values(p.conclusions || {}).join(" ").split(/\s+/).filter(Boolean).length;
  if (words < 60) throw new HttpError(400, "Xulosa va takliflar bo'limlarini to'ldiring (kamida 60 so'z)");
  Object.assign(p, { status: "submitted", submittedAt: new Date().toISOString(), changedAfterSubmit: false });
  await db().set(key, p);
  return json(p);
}

async function deleteLab(req, id) {
  const user = await requireUser(req);
  const p = await db().get(labKey(user.id, id));
  if (p && p.status !== "draft") throw new HttpError(409, "Topshirilgan loyihani o'chirib bo'lmaydi");
  await db().del(labKey(user.id, id));
  return json({ ok: true });
}

async function reviewLab(req, id) {
  const user = await requireUser(req);
  const key = labKey(user.id, id);
  const p = await db().get(key);
  if (!p) throw new HttpError(404, "Loyiha topilmadi — avval saqlang");
  let review = null;
  if (aiEnabled()) {
    for (let attempt = 0; attempt < 2 && !review; attempt++) {
      try {
        const raw = await completeText({
          system: "Sen moliyaviy tahlil bo'yicha ekspert va OTM o'qituvchisisan. Javobni faqat JSON sxemasiga mos qaytar.",
          messages: [{ role: "user", content: labReviewPrompt(p) }],
          maxTokens: 4000,
          effort: "low",
          format: { type: "json_schema", schema: LAB_REVIEW_SCHEMA },
        });
        review = parseLabReview(raw);
      } catch (e) {
        console.error("AI laboratoriya tekshiruvi xatosi:", e);
      }
    }
  }
  if (!review) review = demoLabReview(p);
  p.aiReview = { ...review, at: new Date().toISOString(), model: review.estimated ? null : modelName() };
  await db().set(key, p);
  return json(p);
}

async function adminLabs(req) {
  await requireTeacher(req);
  const items = await getMany("lab/");
  return json({ projects: items.filter((p) => p.status !== "draft").sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || "")), rubric: LAB_RUBRIC, levels: LAB_LEVELS });
}

async function gradeLab(req, userId, id) {
  const teacher = await requireTeacher(req);
  const key = labKey(userId, id);
  const p = await db().get(key);
  if (!p) throw new HttpError(404, "Loyiha topilmadi");
  const b = await body(req);
  const scores = LAB_RUBRIC.map((c, i) => {
    const v = Number(b.scores?.[i]);
    if (!Number.isFinite(v) || v < 0 || v > c.max) throw new HttpError(400, `"${c.title}" mezoni 0–${c.max} oralig'ida bo'lishi kerak`);
    return Math.round(v);
  });
  const total = scores.reduce((a, x) => a + x, 0);
  p.grade = { scores, total, level: labLevel(total), feedback: str(b.feedback, 3000), by: teacher.name, at: new Date().toISOString() };
  p.status = "graded";
  await db().set(key, p);
  return json(p);
}

// ---------- Talaba faoliyati dalillari (XP, reyting, sertifikat) ----------

async function evidenceFor(uid) {
  const [progress, selfStudy, trainer, labsList] = await Promise.all([db().get(`progress/${uid}`), getMany(`selfstudy/${uid}/`), getMany(`trainer/${uid}/`), getMany(`lab/${uid}/`)]);
  return {
    progress: progress || { topics: {} },
    selfStudy: selfStudy.map((x) => ({ taskId: x.taskId, grade: x.resubmitted ? null : x.grade })),
    trainer: trainer.map((x) => ({ scenarioId: x.scenarioId, total: x.total, createdAt: x.createdAt, voice: Boolean(x.voice) })),
    labs: labsList.filter((r) => r.grade).map((r) => ({ id: r.id, total: r.grade.total })),
  };
}

async function myEvidence(req) {
  const user = await requireUser(req);
  return json(await evidenceFor(user.id));
}

async function allEvidence(req) {
  await requireTeacher(req);
  const users = (await getMany("user/")).filter((u) => u.role === "student");
  const items = await Promise.all(users.map(async (u) => ({ user: publicUser(u), evidence: await evidenceFor(u.id) })));
  return json(items);
}

// ---------- AI ovozi (Gemini TTS) ----------
// Har bir (matn, ovoz, uslub) bir marta yaratiladi va MP3 sifatida keshlanadi; keyin hamma uchun keshdan beriladi.

const TTS_DAILY = { student: 300, teacher: 3000 };
const ttsMetaKey = (k) => `ttsmeta/${k}`;
const ttsBinKey = (k) => `ttsbin/${k}`;
const ttsUrl = (k) => `/api/tts/audio/${k}.mp3`;

async function ttsSpeak(req) {
  const b = await body(req);
  const style = STYLES[b.style] ? b.style : "narrator";
  let text = "";
  let dialogue = null;
  let voice = VOICES.some((v) => v.id === b.voice) ? b.voice : "Kore";
  if (Array.isArray(b.dialogue) && b.dialogue.length) {
    // Suhbat: bir nechta personaj — bitta so'rovda (limitni tejash uchun).
    dialogue = b.dialogue
      .slice(0, 12)
      .map((x) => ({ speaker: str(x?.speaker, 40) || "Turist", gender: x?.gender === "male" ? "male" : "female", text: str(x?.text, 1500).replace(/\s+/g, " ").trim() }))
      .filter((x) => x.text);
    if (!dialogue.length) throw new HttpError(400, "Matn bo'sh");
    if (dialogue.reduce((n, x) => n + x.text.length, 0) > 2400) throw new HttpError(400, "Matn juda uzun");
    text = JSON.stringify(dialogue.map((x) => [x.speaker, x.gender, x.text]));
    voice = "dialogue";
  } else {
    text = str(b.text, 1800).replace(/\s+/g, " ").trim();
    if (!text) throw new HttpError(400, "Matn bo'sh");
  }
  const key = ttsKey(text, voice, style);
  const meta = await db().get(ttsMetaKey(key));
  if (meta) return json({ url: ttsUrl(key), cached: true, seconds: meta.seconds });
  if (!ttsEnabled()) throw new HttpError(503, "AI ovozi sozlanmagan (GEMINI_API_KEY)");
  // Yangi ovoz yaratish faqat tizimga kirganlar uchun (bepul limitni himoya qilish).
  const user = await requireUser(req);
  const day = new Date().toISOString().slice(0, 10);
  const qKey = `ttsq/${day}/${user.id}`;
  const used = (await db().get(qKey))?.n || 0;
  if (used >= (TTS_DAILY[user.role] || 300)) throw new HttpError(429, "Bugungi AI ovozi limiti tugadi. Ertaga qayta urinib ko'ring.");
  try {
    const out = await synthesize(text, { voice, style, dialogue });
    await db().setBinary(ttsBinKey(key), out.audio);
    await db().set(ttsMetaKey(key), { seconds: Math.round(out.seconds * 10) / 10, model: out.model, voice, style, chars: text.length, bytes: out.audio.length, createdAt: new Date().toISOString() });
    await db().set(qKey, { n: used + 1 });
    return json({ url: ttsUrl(key), cached: false, seconds: out.seconds });
  } catch (err) {
    const status = err.status === 429 ? 429 : err.status === 503 ? 503 : 502;
    await db().set("meta/tts-last-error", { at: new Date().toISOString(), status, message: err.message, detail: err.detail || "", quotaId: err.quotaId || "", daily: Boolean(err.daily), model: err.model || "" }).catch(() => {});
    return json({ error: err.message || "AI ovozini yaratib bo'lmadi", retryAfter: err.retryAfter ?? null, daily: Boolean(err.daily) }, status);
  }
}

async function ttsAudio(req, key) {
  const data = await db().getBinary(ttsBinKey(key));
  if (!data) throw new HttpError(404, "Audio topilmadi");
  return new Response(data, { headers: { "content-type": "audio/mpeg", "cache-control": "public, max-age=31536000, immutable" } });
}

async function ttsSettings() {
  return (await db().get("meta/tts-settings")) || { voice: "Kore" };
}

async function ttsInfo() {
  const st = await ttsSettings();
  return json({ enabled: ttsEnabled(), voices: VOICES, defaultVoice: st.voice });
}

async function setTtsSettings(req) {
  await requireTeacher(req);
  const b = await body(req);
  if (!VOICES.some((v) => v.id === b.voice)) throw new HttpError(400, "Ovoz noto'g'ri");
  await db().set("meta/tts-settings", { voice: b.voice, updatedAt: new Date().toISOString() });
  return json({ voice: b.voice });
}

async function adminTts(req) {
  await requireTeacher(req);
  const metas = await getMany("ttsmeta/");
  let models = [];
  if (ttsEnabled()) models = await ttsModels();
  return json({
    enabled: ttsEnabled(),
    models,
    voices: VOICES,
    defaultVoice: (await ttsSettings()).voice,
    lastError: await db().get("meta/tts-last-error"),
    cached: metas.length,
    seconds: Math.round(metas.reduce((n, m) => n + (m.seconds || 0), 0)),
    bytes: metas.reduce((n, m) => n + (m.bytes || 0), 0),
  });
}

// ---------- Test tahlili (item-analiz) ----------

async function adminItems(req) {
  await requireTeacher(req);
  const url = new URL(req.url);
  const cohort = url.searchParams.get("cohort") || "all";
  const topicId = url.searchParams.get("topic");
  const users = (await getMany("user/")).filter((u) => u.role === "student" && (cohort === "all" || (u.cohort || "unassigned") === cohort));
  const progress = await Promise.all(users.map((u) => db().get(`progress/${u.id}`)));
  const responsesOf = (t) => progress.map((p) => p?.topics?.[t.id]?.quizFirst).filter((r) => Array.isArray(r) && r.length === t.quiz.length && r.every((x) => Number.isInteger(x)));
  if (topicId) {
    const t = TOPICS.find((x) => x.id === topicId);
    if (!t) throw new HttpError(404, "Mavzu topilmadi");
    return json({ topic: { id: t.id, num: t.num, title: t.title }, ...itemAnalysis(t.quiz, responsesOf(t)) });
  }
  return json({
    topics: TOPICS.map((t) => {
      const a = itemAnalysis(t.quiz, responsesOf(t));
      return { id: t.id, num: t.num, title: t.title, n: a.n, meanPct: a.meanPct, kr20: a.kr20, critical: a.items.filter((it) => it.flags.some((f) => f.level === "critical")).length, warn: a.items.filter((it) => it.flags.some((f) => f.level === "warn")).length };
    }),
  });
}

// ---------- Live: jonli sinf viktorinasi ----------
// O'yin hujjatiga faqat o'qituvchi yozadi; o'yinchilar va javoblar — alohida yozuvlar (bir vaqtda yozishda
// bir-birini o'chirmaslik uchun). Reyting javoblar ochilganda hisoblanib, o'yin hujjatiga saqlanadi.

const liveKey = (pin) => `live/${pin}`;
const livePlayerKey = (pin, pid) => `liveplayer/${pin}/${pid}`;
const liveAnsKey = (pin, pid, q) => `liveans/${pin}/${pid}/${q}`;
const AVATARS = ["🐪", "🦁", "🐯", "🦅", "🐬", "🦊", "🐼", "🐸", "🦉", "🐝", "🦄", "🐢", "🐧", "🐨", "🦋", "🐙"];
const liveCache = new Map(); // o'zgarmas yozuvlar (o'yinchi, javob) keshi

async function cachedDoc(key) {
  if (liveCache.has(key)) return liveCache.get(key);
  const d = await db().get(key);
  if (d) liveCache.set(key, d);
  if (liveCache.size > 5000) liveCache.clear();
  return d;
}

function shuffle(a) {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

async function loadGame(pin) {
  if (!/^\d{6}$/.test(pin)) throw new HttpError(404, "O'yin topilmadi");
  const g = await db().get(liveKey(pin));
  if (!g || Date.now() - Date.parse(g.createdAt) > 24 * 3600_000) throw new HttpError(404, "Bunday PIN bilan o'yin topilmadi");
  return g;
}

const timeLeftOf = (g) => (g.state === "question" ? Math.max(0, g.duration * 1000 - (Date.now() - Date.parse(g.qStartedAt))) : 0);

async function newLivePin() {
  let pin;
  for (let i = 0; i < 20; i++) {
    pin = String(Math.floor(100000 + Math.random() * 900000));
    if (!(await db().get(liveKey(pin)))) break;
  }
  return pin;
}

// "So'z buluti" (aqliy hujum): talabalar ochiq savolga 1–3 so'z yuboradi, proyektorda jonli bulut.
const cloudNorm = (w) => w.toLowerCase().replace(/[‘’`ʻʼ]/g, "'").replace(/^[\s"'«»“”.,!?;:()-]+|[\s"'«»“”.,!?;:()-]+$/g, "").replace(/\s+/g, " ");

async function cloudCreate(teacher, b) {
  const prompt = str(b.prompt, 160);
  if (prompt.length < 3) throw new HttpError(400, "Savolni yozing");
  const pin = await newLivePin();
  await db().set(liveKey(pin), {
    kind: "cloud", pin, hostId: teacher.id, hostName: teacher.name,
    title: prompt, prompt, maxWords: Math.max(1, Math.min(3, Number(b.maxWords) || 3)),
    state: "collect", qIndex: 0, questions: [], board: {}, hidden: [], createdAt: new Date().toISOString(),
  });
  return json({ pin }, 201);
}

async function cloudWords(pin, hidden = []) {
  const keys = await db().list(`liveans/${pin}/`);
  const docs = (await Promise.all(keys.map(cachedDoc))).filter(Boolean);
  const map = new Map();
  for (const d of docs) for (const w of d.words || []) {
    const k = cloudNorm(w);
    if (!k || hidden.includes(k)) continue;
    const e = map.get(k) || { key: k, count: 0, forms: {} };
    e.count++;
    e.forms[w] = (e.forms[w] || 0) + 1;
    map.set(k, e);
  }
  const words = [...map.values()].map((e) => ({ key: e.key, text: Object.entries(e.forms).sort((a, c) => c[1] - a[1])[0][0], count: e.count })).sort((a, c) => c.count - a.count).slice(0, 80);
  return { words, responses: docs.length };
}

async function liveCreate(req) {
  const teacher = await requireTeacher(req);
  const b = await body(req);
  if (b.kind === "cloud") return cloudCreate(teacher, b);
  const ids = Array.isArray(b.topicIds) && b.topicIds.length ? b.topicIds : TOPICS.map((t) => t.id);
  const pool = TOPICS.filter((t) => ids.includes(t.id)).flatMap((t) => t.quiz.map((q) => ({ ...q, topic: t.num })));
  if (!pool.length) throw new HttpError(400, "Tanlangan mavzularda test savollari yo'q");
  const count = Math.max(3, Math.min(30, Number(b.count) || 10));
  const questions = shuffle(pool)
    .slice(0, count)
    .map((q) => {
      const order = shuffle(q.options.map((_, i) => i)).slice(0, 4);
      if (!order.includes(q.correct)) order[0] = q.correct;
      const opts = shuffle(order);
      return { q: q.q, options: opts.map((i) => q.options[i]), correct: opts.indexOf(q.correct), topic: q.topic };
    });
  const pin = await newLivePin();
  const game = {
    pin, hostId: teacher.id, hostName: teacher.name,
    title: str(b.title, 100) || "Live viktorina",
    duration: Math.max(10, Math.min(90, Number(b.duration) || 20)),
    readAloud: Boolean(b.readAloud),
    questions, state: "lobby", qIndex: -1, qStartedAt: null, board: {}, dist: null, prevRanks: {},
    createdAt: new Date().toISOString(),
  };
  await db().set(liveKey(pin), game);
  return json({ pin }, 201);
}

async function livePlayers(pin) {
  const keys = await db().list(`liveplayer/${pin}/`);
  return (await Promise.all(keys.map(cachedDoc))).filter(Boolean).map(({ key, ...p }) => p);
}

async function liveHost(req, pin) {
  const user = await requireTeacher(req);
  const g = await loadGame(pin);
  if (g.hostId !== user.id) throw new HttpError(403, "Bu o'yin sizga tegishli emas");
  const players = await livePlayers(pin);
  if (g.kind === "cloud") return json({ ...g, players, ...(await cloudWords(pin, g.hidden)) });
  let answered = 0;
  if (g.state === "question") answered = (await db().list(`liveans/${pin}/`)).filter((k) => k.endsWith(`/${g.qIndex}`)).length;
  return json({ ...g, players, answered, timeLeft: timeLeftOf(g), serverNow: Date.now() });
}

async function liveControl(req, pin) {
  const user = await requireTeacher(req);
  const g = await loadGame(pin);
  if (g.hostId !== user.id) throw new HttpError(403, "Bu o'yin sizga tegishli emas");
  const { action, word } = await body(req);
  if (g.kind === "cloud") {
    if (action === "close") g.state = "closed";
    else if (action === "open") g.state = "collect";
    else if (action === "hide" && typeof word === "string") g.hidden = [...new Set([...(g.hidden || []), cloudNorm(word)])].slice(0, 200);
    else if (action === "unhide") g.hidden = [];
    else throw new HttpError(400, "Noma'lum amal");
    await db().set(liveKey(pin), g);
    return json({ ok: true, state: g.state });
  }
  if (action === "start" || action === "next") {
    if (g.state === "question") throw new HttpError(409, "Avval javoblarni oching");
    const nextQ = g.qIndex + 1;
    if (nextQ >= g.questions.length) g.state = "final";
    else Object.assign(g, { state: "question", qIndex: nextQ, qStartedAt: new Date().toISOString(), dist: null });
  } else if (action === "reveal") {
    if (g.state !== "question") return json(g);
    const players = await livePlayers(pin);
    const answers = (await Promise.all(players.map((p) => cachedDoc(liveAnsKey(pin, p.pid, g.qIndex))))).filter(Boolean);
    const dist = g.questions[g.qIndex].options.map(() => 0);
    const ranked = (b) => Object.entries(b).sort((a, c) => c[1].total - a[1].total).map(([pid], i) => [pid, i + 1]);
    g.prevRanks = Object.fromEntries(ranked(g.board));
    for (const p of players) {
      const prev = g.board[p.pid] || { name: p.name, avatar: p.avatar, total: 0, correct: 0, streak: 0 };
      const a = answers.find((x) => x.pid === p.pid);
      if (a) dist[a.choice] = (dist[a.choice] || 0) + 1;
      g.board[p.pid] = {
        name: p.name, avatar: p.avatar,
        total: prev.total + (a?.points || 0),
        last: a?.points || 0,
        correct: prev.correct + (a?.correct ? 1 : 0),
        streak: a?.correct ? prev.streak + 1 : 0,
        choice: a ? a.choice : null,
      };
    }
    Object.assign(g, { state: "reveal", dist });
  } else if (action === "end") {
    g.state = "final";
  } else throw new HttpError(400, "Noma'lum amal");
  await db().set(liveKey(pin), g);
  return json({ ok: true, state: g.state, qIndex: g.qIndex });
}

async function liveJoin(req, pin) {
  const g = await loadGame(pin);
  if (g.state === "final" || g.state === "closed") throw new HttpError(409, "O'yin allaqachon tugagan");
  const b = await body(req);
  const name = str(b.name, 24).replace(/\s+/g, " ").trim();
  if (name.length < 2) throw new HttpError(400, "Ismingizni kiriting");
  const players = await livePlayers(pin);
  if (players.length >= 120) throw new HttpError(409, "O'yinda joy qolmadi");
  if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) throw new HttpError(409, "Bu ism band — boshqasini tanlang");
  const pid = newId().slice(0, 12);
  const key = crypto.randomBytes(12).toString("hex");
  await db().set(livePlayerKey(pin, pid), { pid, key, name, avatar: AVATARS.includes(b.avatar) ? b.avatar : AVATARS[players.length % AVATARS.length], joinedAt: new Date().toISOString() });
  return json({ pid, key, title: g.title }, 201);
}

async function livePlayer(pin, pid, key) {
  const p = await cachedDoc(livePlayerKey(pin, pid));
  if (!p || p.key !== key) throw new HttpError(403, "O'yinchi topilmadi — qaytadan qo'shiling");
  return p;
}

async function liveAnswer(req, pin) {
  const b = await body(req);
  const g = await loadGame(pin);
  const p = await livePlayer(pin, str(b.pid, 40), str(b.key, 60));
  if (g.kind === "cloud") {
    if (g.state !== "collect") throw new HttpError(409, "Javoblar qabul qilish yopilgan");
    if (await db().get(liveAnsKey(pin, p.pid, 0))) throw new HttpError(409, "Javobingiz allaqachon qabul qilingan");
    const seen = new Set();
    const words = (Array.isArray(b.words) ? b.words : [])
      .map((w) => str(w, 30).replace(/\s+/g, " "))
      .filter((w) => cloudNorm(w) && !seen.has(cloudNorm(w)) && seen.add(cloudNorm(w)))
      .slice(0, g.maxWords);
    if (!words.length) throw new HttpError(400, "Kamida bitta so'z yozing");
    await db().set(liveAnsKey(pin, p.pid, 0), { pid: p.pid, words, at: new Date().toISOString() });
    return json({ ok: true, words });
  }
  const q = Number(b.q);
  if (g.state !== "question" || q !== g.qIndex) throw new HttpError(409, "Bu savol uchun vaqt tugagan");
  const elapsed = Date.now() - Date.parse(g.qStartedAt);
  if (elapsed > g.duration * 1000 + 1500) throw new HttpError(409, "Vaqt tugadi");
  if (await db().get(liveAnsKey(pin, p.pid, q))) throw new HttpError(409, "Javob allaqachon qabul qilingan");
  const choice = Number(b.choice);
  if (!Number.isInteger(choice) || choice < 0 || choice >= g.questions[q].options.length) throw new HttpError(400, "Variant noto'g'ri");
  const correct = choice === g.questions[q].correct;
  // Ball: to'g'ri javob 500 + tezlik uchun 500 gacha + seriya bonusi (ketma-ket to'g'ri javoblar)
  const prevStreak = g.board[p.pid]?.streak || 0;
  const speed = Math.max(0, 1 - elapsed / (g.duration * 1000));
  const points = correct ? Math.round(500 + 500 * speed + Math.min(prevStreak, 3) * 100) : 0;
  const ans = { pid: p.pid, q, choice, correct, points, ms: elapsed, at: new Date().toISOString() };
  await db().set(liveAnsKey(pin, p.pid, q), ans);
  return json({ ok: true });
}

async function livePlay(req, pin) {
  const url = new URL(req.url);
  const g = await loadGame(pin);
  const p = await livePlayer(pin, url.searchParams.get("pid") || "", url.searchParams.get("key") || "");
  if (g.kind === "cloud") {
    const mine = await cachedDoc(liveAnsKey(pin, p.pid, 0));
    return json({ kind: "cloud", title: g.title, prompt: g.prompt, maxWords: g.maxWords, state: g.state, qIndex: 0, me: { name: p.name, avatar: p.avatar }, submitted: Boolean(mine), mine: mine?.words || [] });
  }
  const out = { title: g.title, state: g.state, qIndex: g.qIndex, total: g.questions.length, me: { name: p.name, avatar: p.avatar }, duration: g.duration };
  const ranks = Object.entries(g.board).sort((a, b) => b[1].total - a[1].total);
  const rankOf = (pid) => ranks.findIndex(([x]) => x === pid) + 1;
  if (g.state === "question") {
    const cur = g.questions[g.qIndex];
    out.question = { q: cur.q, options: cur.options };
    out.timeLeft = timeLeftOf(g);
    out.answered = Boolean(await db().get(liveAnsKey(pin, p.pid, g.qIndex)));
  }
  if (g.state === "reveal" || g.state === "final") {
    const b2 = g.board[p.pid] || { total: 0, last: 0, streak: 0, correct: 0, choice: null };
    out.result = { total: b2.total, last: b2.last, streak: b2.streak, correctCount: b2.correct, rank: rankOf(p.pid) || ranks.length + 1, players: Math.max(ranks.length, 1) };
    if (g.state === "reveal") {
      const cur = g.questions[g.qIndex];
      out.question = { q: cur.q, options: cur.options };
      out.result.correctOption = cur.correct;
      out.result.myChoice = b2.choice;
    }
    if (g.state === "final") out.podium = ranks.slice(0, 3).map(([, v]) => ({ name: v.name, avatar: v.avatar, total: v.total }));
  }
  return json(out);
}



// ---------- AI Ustoz (mavzu bo'yicha yordamchi) ----------

async function topicAsk(req, topicId) {
  await requireUser(req);
  const topic = findTopic(topicId);
  if (!topic) throw new HttpError(404, "Mavzu topilmadi");
  const b = await body(req);
  let raw = Array.isArray(b.messages) ? b.messages.slice(-11) : [];
  if (raw[0]?.role === "assistant") raw = raw.slice(1);
  const history = cleanHistory(raw);
  if (!history.length || history[history.length - 1].role !== "user") throw new HttpError(400, "Savol bo'sh");
  if (!aiEnabled()) {
    return new Response(searchAnswer(topic, history[history.length - 1].content), { headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  const stream = streamText({ system: tutorSystem(topic), messages: history, maxTokens: 900, effort: "low" });
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}

// ---------- Reyting va sertifikat ----------

const shortName = (name) => {
  const [first, ...rest] = String(name || "").trim().split(/\s+/);
  return rest.length ? `${first} ${rest[0][0]}.` : first || "Talaba";
};
let ratingCache = { at: 0, rows: null };

async function ratingRows() {
  if (ratingCache.rows && Date.now() - ratingCache.at < 5 * 60_000) return ratingCache.rows;
  const users = (await getMany("user/")).filter((u) => u.role === "student");
  const rows = await Promise.all(
    users.map(async (u) => {
      const game = computeGame(await evidenceFor(u.id));
      return { id: u.id, name: shortName(u.name), group: u.group || "", college: u.college || "", collegeKey: normCollege(u.college), hidden: Boolean(u.hideFromRating), xp: game.xp, level: game.level.name, icon: game.level.icon, streak: game.stats.streak, badges: game.badges.filter((b) => b.earned).length };
    })
  );
  ratingCache = { at: Date.now(), rows };
  return rows;
}

async function leaderboard(req) {
  const user = await requireUser(req);
  const rows = await ratingRows();
  const pick = (filter) => {
    const list = rows.filter(filter).sort((a, b) => b.xp - a.xp);
    const meIdx = list.findIndex((r) => r.id === user.id);
    const view = list.map((r, i) => ({ rank: i + 1, me: r.id === user.id, name: r.hidden && r.id !== user.id ? "Yashirin ishtirokchi" : r.name, group: r.group, xp: r.xp, level: r.level, icon: r.icon, streak: r.streak, badges: r.badges }));
    return { total: list.length, top: view.slice(0, 20), me: meIdx >= 20 ? view[meIdx] : null };
  };
  const mine = rows.find((r) => r.id === user.id);
  return json({
    group: user.group ? pick((r) => r.group && r.group.toLowerCase() === String(user.group).toLowerCase() && r.collegeKey === normCollege(user.college)) : null,
    college: pick((r) => r.collegeKey === normCollege(user.college)),
    all: pick(() => true),
    myGroup: user.group || "",
    myCollege: user.college || "",
    hidden: Boolean(mine?.hidden),
  });
}

async function issueCertificate(req) {
  const user = await requireUser(req);
  if (user.role !== "student") throw new HttpError(403, "Sertifikat faqat talabalarga beriladi");
  const existing = await db().get(`certuser/${user.id}`);
  if (existing) return json(await db().get(`cert/${existing.code}`));
  const game = computeGame(await evidenceFor(user.id));
  const status = certificateStatus(game);
  if (!status.eligible) throw new HttpError(400, "Sertifikat shartlari hali bajarilmagan");
  const code = `TT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const cert = {
    code,
    name: user.name,
    college: user.college || "",
    group: user.group || "",
    course: "Turistik korxonalar faoliyati tahlili",
    issuedAt: new Date().toISOString(),
    stats: { xp: game.xp, level: game.level.name, levelIcon: game.level.icon, topicsDone: game.stats.topicsDone, bestTrainer: game.stats.bestTrainer, scenarios: game.stats.scenariosTried, solved: game.stats.solved, bestLab: game.stats.bestLab, badges: game.badges.filter((b) => b.earned).length },
  };
  await db().set(`cert/${code}`, cert);
  await db().set(`certuser/${user.id}`, { code });
  return json(cert, 201);
}

async function getCertificate(req, code) {
  const cert = await db().get(`cert/${String(code).toUpperCase()}`);
  if (!cert) throw new HttpError(404, "Bunday sertifikat topilmadi");
  return json(cert);
}

async function myCertificate(req) {
  const user = await requireUser(req);
  const ref = await db().get(`certuser/${user.id}`);
  return json(ref ? await db().get(`cert/${ref.code}`) : null);
}

// ---------- Sozlamalar va diagnostika ----------

let secretReady = false;
async function ensureSecret() {
  if (secretReady || process.env.JWT_SECRET || process.env.VGT_LOCAL_DATA) return;
  const store = db();
  let meta = await store.get("meta/secret");
  if (!meta?.value) {
    meta = { value: crypto.randomBytes(48).toString("base64url"), createdAt: new Date().toISOString() };
    await store.set("meta/secret", meta);
  }
  setGeneratedSecret(meta.value);
  secretReady = true;
}

function describeError(err) {
  const name = err?.name || "";
  const msg = String(err?.message || err);
  if (name === "MissingBlobsEnvironmentError" || /Netlify Blobs/i.test(msg)) return "Ma'lumotlar ombori (Netlify Blobs) ulanmagan. /api/health sahifasini tekshiring.";
  if (/JWT_SECRET/.test(msg)) return "JWT_SECRET sozlanmagan.";
  return `Serverda kutilmagan xatolik yuz berdi (${name || "Error"}: ${msg.slice(0, 160)})`;
}

async function health() {
  const checks = { blobs: "tekshirilmoqda", jwtSecret: process.env.JWT_SECRET ? "o'rnatilgan" : "avtomatik (omborda)", teacherCode: process.env.TEACHER_CODE ? "o'rnatilgan" : "o'rnatilmagan", ai: provider() ? `${provider()} (${modelName()})` : "demo-rejim", node: process.version };
  checks.tts = ttsEnabled() ? `gemini (${(await ttsModels().catch(() => []))[0] || "model topilmadi"})` : "o'chiq (brauzer ovozi)";
  try {
    await db().set("meta/health", { at: new Date().toISOString() });
    await db().get("meta/health");
    checks.blobs = "ishlayapti";
  } catch (err) {
    checks.blobs = `XATO: ${err?.name || ""} ${String(err?.message || err).slice(0, 200)}`;
  }
  return json(checks, checks.blobs === "ishlayapti" ? 200 : 500);
}

// ---------- Mavzu taqdimotlari (slaydlar) ----------
// Fayl 3 MB li bo'laklarda yuklanadi va saqlanadi: Netlify funksiyasining so'rov/javob chegarasi (6 MB) oshmaydi.

const SLIDE_CHUNK = 3 * 1024 * 1024;
const SLIDE_LIMITS = { pdf: 60 * 1024 * 1024, pptx: 20 * 1024 * 1024 };
const slideKey = (topicId) => `slides/${topicId}`;
const slideBin = (topicId, uploadId, i) => `slidebin/${topicId}/${uploadId}/${i}`;
const topicIdOk = (id) => /^[\w-]{1,40}$/.test(id);

function slideKind(name, mime) {
  if (/\.pdf$/i.test(name) || mime === "application/pdf") return "pdf";
  if (/\.pptx$/i.test(name) || mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation") return "pptx";
  return null;
}

/** Google Slides, Canva, OneDrive/PowerPoint Online havolalarini joylashtiriladigan ko'rinishga keltiradi. */
function embedUrlFor(url) {
  const u = new URL(url);
  const g = url.match(/docs\.google\.com\/presentation\/d\/(e\/)?([\w-]+)/);
  if (g) return g[1] ? `https://docs.google.com/presentation/d/e/${g[2]}/embed?start=false&loop=false&delayms=5000` : `https://docs.google.com/presentation/d/${g[2]}/embed?start=false&loop=false&delayms=5000`;
  if (/canva\.com$/.test(u.hostname) || u.hostname.endsWith(".canva.com")) {
    const m = url.match(/canva\.com\/design\/([\w-]+)\/([\w-]+)/);
    if (m) return `https://www.canva.com/design/${m[1]}/${m[2]}/view?embed`;
  }
  return url;
}

async function listSlides() {
  const items = await getMany("slides/");
  return json({ slides: items.map(({ by, ...rest }) => rest) });
}

async function getSlides(req, topicId) {
  const meta = await db().get(slideKey(topicId));
  if (!meta) throw new HttpError(404, "Bu mavzu uchun taqdimot joylanmagan");
  const { by, ...rest } = meta;
  return json(rest);
}

async function slideChunk(req, topicId, uploadId, i) {
  const meta = await db().get(slideKey(topicId));
  if (!meta || meta.uploadId !== uploadId || Number(i) >= meta.chunks) throw new HttpError(404, "Fayl topilmadi");
  const data = await db().getBinary(slideBin(topicId, uploadId, i));
  if (!data) throw new HttpError(404, "Fayl bo'lagi topilmadi");
  return new Response(data, { headers: { "content-type": "application/octet-stream", "cache-control": "public, max-age=31536000, immutable" } });
}

/** To'liq fayl (PowerPoint Online ko'ruvchisi va yuklab olish uchun) — oqim bilan uzatiladi. */
async function slideFile(req, topicId) {
  const meta = await db().get(slideKey(topicId));
  if (!meta || meta.kind === "link") throw new HttpError(404, "Fayl topilmadi");
  const store = db();
  let i = 0;
  const stream = new ReadableStream({
    async pull(controller) {
      if (i >= meta.chunks) return controller.close();
      const part = await store.getBinary(slideBin(topicId, meta.uploadId, i++));
      if (!part) return controller.error(new Error("Fayl bo'lagi topilmadi"));
      controller.enqueue(new Uint8Array(part));
    },
  });
  const type = meta.kind === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  const ascii = meta.name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return new Response(stream, {
    headers: {
      "content-type": type,
      "content-length": String(meta.size),
      "content-disposition": `${new URL(req.url).searchParams.has("download") ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(meta.name)}`,
      "cache-control": "public, max-age=300",
    },
  });
}

async function slidesInit(req, topicId) {
  await requireTeacher(req);
  if (!topicIdOk(topicId)) throw new HttpError(400, "Mavzu noto'g'ri");
  const b = await body(req);
  const name = str(b.name, 200);
  const size = Number(b.size);
  const kind = slideKind(name, b.mime);
  if (!kind) throw new HttpError(400, "Faqat PDF (.pdf) yoki PowerPoint (.pptx) fayl yuklash mumkin");
  if (!Number.isFinite(size) || size <= 0) throw new HttpError(400, "Fayl bo'sh");
  if (size > SLIDE_LIMITS[kind]) throw new HttpError(413, `Fayl juda katta: ${kind.toUpperCase()} uchun eng ko'pi ${SLIDE_LIMITS[kind] / 1024 / 1024} MB`);
  return json({ uploadId: newId(), chunkSize: SLIDE_CHUNK, chunks: Math.ceil(size / SLIDE_CHUNK), kind });
}

async function slidesPutChunk(req, topicId, uploadId, i) {
  await requireTeacher(req);
  if (!topicIdOk(topicId) || !/^[\w-]{6,64}$/.test(uploadId) || !/^\d{1,3}$/.test(i)) throw new HttpError(400, "So'rov noto'g'ri");
  const data = await req.arrayBuffer();
  if (!data.byteLength || data.byteLength > SLIDE_CHUNK) throw new HttpError(400, "Fayl bo'lagi hajmi noto'g'ri");
  await db().setBinary(slideBin(topicId, uploadId, i), data);
  return json({ ok: true, size: data.byteLength });
}

async function deleteSlideFiles(meta) {
  if (!meta?.uploadId) return;
  const keys = await db().list(`slidebin/${meta.topicId}/${meta.uploadId}/`);
  await Promise.all(keys.map((k) => db().del(k)));
}

async function slidesCommit(req, topicId) {
  const teacher = await requireTeacher(req);
  const b = await body(req);
  const name = str(b.name, 200);
  const size = Number(b.size);
  const kind = slideKind(name, b.mime);
  const uploadId = str(b.uploadId, 64);
  if (!topicIdOk(topicId) || !kind || !uploadId) throw new HttpError(400, "So'rov noto'g'ri");
  const chunks = Math.ceil(size / SLIDE_CHUNK);
  const keys = new Set(await db().list(`slidebin/${topicId}/${uploadId}/`));
  for (let i = 0; i < chunks; i++) if (!keys.has(slideBin(topicId, uploadId, i))) throw new HttpError(400, `Fayl to'liq yuklanmadi (${i + 1}-bo'lak yo'q). Qayta urinib ko'ring.`);
  const old = await db().get(slideKey(topicId));
  const meta = {
    topicId, kind, name, size, chunks, uploadId,
    title: str(b.title, 200) || name.replace(/\.(pdf|pptx)$/i, ""),
    pages: Number.isInteger(b.pages) && b.pages > 0 ? b.pages : undefined,
    uploadedAt: new Date().toISOString(),
    by: teacher.name,
  };
  await db().set(slideKey(topicId), meta);
  if (old && old.uploadId !== uploadId) await deleteSlideFiles(old);
  return json(meta);
}

async function slidesLink(req, topicId) {
  const teacher = await requireTeacher(req);
  if (!topicIdOk(topicId)) throw new HttpError(400, "Mavzu noto'g'ri");
  const b = await body(req);
  const url = str(b.url, 1000);
  if (!/^https:\/\//i.test(url)) throw new HttpError(400, "Havola https:// bilan boshlanishi kerak");
  let embed;
  try {
    embed = embedUrlFor(url);
  } catch {
    throw new HttpError(400, "Havola noto'g'ri");
  }
  const old = await db().get(slideKey(topicId));
  const meta = { topicId, kind: "link", url, embedUrl: embed, title: str(b.title, 200) || "Taqdimot", uploadedAt: new Date().toISOString(), by: teacher.name };
  await db().set(slideKey(topicId), meta);
  if (old) await deleteSlideFiles(old);
  return json(meta);
}

async function slidesDelete(req, topicId) {
  await requireTeacher(req);
  const old = await db().get(slideKey(topicId));
  if (old) {
    await deleteSlideFiles(old);
    await db().del(slideKey(topicId));
  }
  return json({ ok: true });
}

// ---------- Video darslar ----------
// O'qituvchi har bir mavzuga bir nechta video qo'shadi: YouTube/Vimeo havolasi yoki fayl (MP4/WebM, 80 MB gacha).

const VIDEO_LIMIT = 80 * 1024 * 1024;
const videoKey = (topicId, id) => `video/${topicId}/${id}`;
const videoBin = (topicId, uploadId, i) => `mediabin/${topicId}/${uploadId}/${i}`;

function videoLink(url) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { kind: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1`, thumb: `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg` };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { kind: "vimeo", embedUrl: `https://player.vimeo.com/video/${vm[1]}` };
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return { kind: "url", embedUrl: url };
  return { kind: "link", embedUrl: url };
}

async function listVideos() {
  const items = await getMany("video/");
  return json({ videos: items.map(({ by, ...rest }) => rest).sort((a, b) => a.createdAt.localeCompare(b.createdAt)) });
}

async function videoChunk(req, topicId, id, uploadId, i) {
  const meta = await db().get(videoKey(topicId, id));
  if (!meta || meta.uploadId !== uploadId || Number(i) >= meta.chunks) throw new HttpError(404, "Video topilmadi");
  const data = await db().getBinary(videoBin(topicId, uploadId, i));
  if (!data) throw new HttpError(404, "Video bo'lagi topilmadi");
  return new Response(data, { headers: { "content-type": "application/octet-stream", "cache-control": "public, max-age=31536000, immutable" } });
}

async function videoAddLink(req, topicId) {
  const teacher = await requireTeacher(req);
  if (!topicIdOk(topicId)) throw new HttpError(400, "Mavzu noto'g'ri");
  const b = await body(req);
  const url = str(b.url, 1000);
  if (!/^https:\/\//i.test(url)) throw new HttpError(400, "Havola https:// bilan boshlanishi kerak");
  const meta = { id: newId(), topicId, ...videoLink(url), url, title: str(b.title, 200) || "Video dars", description: str(b.description, 1000), createdAt: new Date().toISOString(), by: teacher.name };
  await db().set(videoKey(topicId, meta.id), meta);
  return json(meta, 201);
}

async function videoInit(req, topicId) {
  await requireTeacher(req);
  if (!topicIdOk(topicId)) throw new HttpError(400, "Mavzu noto'g'ri");
  const b = await body(req);
  const size = Number(b.size);
  if (!/^video\/(mp4|webm|ogg|quicktime)$/.test(String(b.mime)) && !/\.(mp4|webm|ogv|mov)$/i.test(String(b.name))) throw new HttpError(400, "Faqat video fayl (MP4, WebM) yuklash mumkin");
  if (!Number.isFinite(size) || size <= 0) throw new HttpError(400, "Fayl bo'sh");
  if (size > VIDEO_LIMIT) throw new HttpError(413, "Video juda katta: eng ko'pi 80 MB. Kattaroq videolarni YouTube'ga joylab, havolasini qo'shing.");
  return json({ uploadId: newId(), chunkSize: SLIDE_CHUNK, chunks: Math.ceil(size / SLIDE_CHUNK) });
}

async function videoPutChunk(req, topicId, uploadId, i) {
  await requireTeacher(req);
  if (!topicIdOk(topicId) || !/^[\w-]{6,64}$/.test(uploadId) || !/^\d{1,3}$/.test(i)) throw new HttpError(400, "So'rov noto'g'ri");
  const data = await req.arrayBuffer();
  if (!data.byteLength || data.byteLength > SLIDE_CHUNK) throw new HttpError(400, "Fayl bo'lagi hajmi noto'g'ri");
  await db().setBinary(videoBin(topicId, uploadId, i), data);
  return json({ ok: true });
}

async function videoCommit(req, topicId) {
  const teacher = await requireTeacher(req);
  if (!topicIdOk(topicId)) throw new HttpError(400, "Mavzu noto'g'ri");
  const b = await body(req);
  const uploadId = str(b.uploadId, 64);
  const size = Number(b.size);
  const chunks = Math.ceil(size / SLIDE_CHUNK);
  const keys = new Set(await db().list(`mediabin/${topicId}/${uploadId}/`));
  for (let i = 0; i < chunks; i++) if (!keys.has(videoBin(topicId, uploadId, i))) throw new HttpError(400, `Video to'liq yuklanmadi (${i + 1}-bo'lak yo'q)`);
  const poster = typeof b.poster === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(b.poster) && b.poster.length < 200_000 ? b.poster : undefined;
  const meta = {
    id: newId(), topicId, kind: "file", uploadId, chunks, size,
    mime: /^video\/[\w.+-]+$/.test(String(b.mime)) ? String(b.mime) : "video/mp4",
    name: str(b.name, 200),
    title: str(b.title, 200) || str(b.name, 200).replace(/\.\w+$/, ""),
    description: str(b.description, 1000),
    duration: Number.isFinite(b.duration) ? Math.round(b.duration) : undefined,
    poster,
    createdAt: new Date().toISOString(),
    by: teacher.name,
  };
  await db().set(videoKey(topicId, meta.id), meta);
  return json(meta, 201);
}

async function videoUpdate(req, topicId, id) {
  await requireTeacher(req);
  const meta = await db().get(videoKey(topicId, id));
  if (!meta) throw new HttpError(404, "Video topilmadi");
  const b = await body(req);
  if (b.title !== undefined) meta.title = str(b.title, 200) || meta.title;
  if (b.description !== undefined) meta.description = str(b.description, 1000);
  await db().set(videoKey(topicId, id), meta);
  return json(meta);
}

async function videoDelete(req, topicId, id) {
  await requireTeacher(req);
  const meta = await db().get(videoKey(topicId, id));
  if (meta?.uploadId) {
    const keys = await db().list(`mediabin/${topicId}/${meta.uploadId}/`);
    await Promise.all(keys.map((k) => db().del(k)));
  }
  await db().del(videoKey(topicId, id));
  return json({ ok: true });
}

// ---------- Yordamchi funksiyalar ----------

const normCollege = (name) => String(name || "").toLowerCase().replace(/[‘’ʻʼ`´]/g, "'").replace(/\s+/g, " ").trim();

/** Faqat umumlashtirilgan ko'rsatkichlar: shaxsiy ma'lumotlar chiqmaydi. 60 soniya keshlanadi. */
async function knownColleges() {
  try {
    const users = await getMany("user/");
    const names = users.map((u) => String(u.college || "").trim()).filter(Boolean);
    return [...new Map(names.map((n) => [normCollege(n), n])).values()].slice(0, 50);
  } catch {
    return [];
  }
}

// ---------- Router ----------

const routes = [
  ["POST", /^auth\/register$/, register],
  ["POST", /^auth\/login$/, login],
  ["POST", /^auth\/reset$/, resetPassword],
  ["GET", /^me$/, async (req) => json(publicUser(await requireUser(req)))],
  ["PUT", /^me$/, updateMe],
  ["GET", /^health$/, health],
  ["GET", /^config$/, async () => json({ aiEnabled: aiEnabled(), teacherSignup: Boolean(process.env.TEACHER_CODE), colleges: await knownColleges() })],

  ["GET", /^slides$/, listSlides],
  ["GET", /^slides\/([\w-]+)$/, getSlides],
  ["GET", /^slides\/([\w-]+)\/file$/, slideFile],
  ["GET", /^slides\/([\w-]+)\/chunk\/([\w-]+)\/(\d+)$/, slideChunk],
  ["POST", /^admin\/slides\/([\w-]+)\/init$/, slidesInit],
  ["PUT", /^admin\/slides\/([\w-]+)\/chunk\/([\w-]+)\/(\d+)$/, slidesPutChunk],
  ["POST", /^admin\/slides\/([\w-]+)\/commit$/, slidesCommit],
  ["PUT", /^admin\/slides\/([\w-]+)\/link$/, slidesLink],
  ["DELETE", /^admin\/slides\/([\w-]+)$/, slidesDelete],

  ["GET", /^videos$/, listVideos],
  ["GET", /^videos\/([\w-]+)\/([\w-]+)\/chunk\/([\w-]+)\/(\d+)$/, videoChunk],
  ["POST", /^admin\/videos\/([\w-]+)\/link$/, videoAddLink],
  ["POST", /^admin\/videos\/([\w-]+)\/init$/, videoInit],
  ["PUT", /^admin\/videos\/([\w-]+)\/chunk\/([\w-]+)\/(\d+)$/, videoPutChunk],
  ["POST", /^admin\/videos\/([\w-]+)\/commit$/, videoCommit],
  ["PUT", /^admin\/videos\/([\w-]+)\/([\w-]+)$/, videoUpdate],
  ["DELETE", /^admin\/videos\/([\w-]+)\/([\w-]+)$/, videoDelete],


  ["GET", /^progress$/, getProgress],
  ["PUT", /^progress$/, saveProgress],
  ["GET", /^self-study$/, mySelfStudy],
  ["POST", /^self-study\/([\w-]+)$/, submitSelfStudy],

  ["GET", /^trainer\/scenarios$/, async () => json({ scenarios: SCENARIOS.map(publicScenario), criteria: CRITERIA, aiEnabled: aiEnabled(), voiceAI: voiceEnabled() })],
  ["POST", /^trainer\/chat$/, trainerChat],
  ["POST", /^trainer\/transcribe$/, trainerTranscribe],
  ["POST", /^trainer\/hint$/, trainerHint],
  ["POST", /^trainer\/evaluate$/, trainerEvaluate],
  ["GET", /^trainer\/sessions$/, mySessions],



  ["POST", /^practice\/([\w-]+)\/review$/, practiceReview],
  ["GET", /^practice\/reviews$/, myPracticeReviews],
  ["GET", /^admin\/practice-reviews$/, adminPracticeReviews],
  ["PUT", /^admin\/practice-reviews\/([\w-]+)\/([\w-]+)\/([\w-]+)$/, teacherPracticeComment],
  ["GET", /^labs$/, myLabs],
  ["PUT", /^labs\/([\w-]+)$/, saveLab],
  ["POST", /^labs\/([\w-]+)\/submit$/, submitLab],
  ["POST", /^labs\/([\w-]+)\/review$/, reviewLab],
  ["DELETE", /^labs\/([\w-]+)$/, deleteLab],
  ["GET", /^admin\/labs$/, adminLabs],
  ["PUT", /^admin\/labs\/([\w-]+)\/([\w-]+)\/grade$/, gradeLab],
  ["GET", /^evidence$/, myEvidence],
  ["GET", /^leaderboard$/, leaderboard],
  ["GET", /^admin\/items$/, adminItems],
  ["POST", /^live$/, liveCreate],
  ["GET", /^live\/(\d{6})\/host$/, liveHost],
  ["POST", /^live\/(\d{6})\/control$/, liveControl],
  ["POST", /^live\/(\d{6})\/join$/, liveJoin],
  ["POST", /^live\/(\d{6})\/answer$/, liveAnswer],
  ["GET", /^live\/(\d{6})\/play$/, livePlay],
  ["POST", /^tts$/, ttsSpeak],
  ["GET", /^tts$/, ttsInfo],
  ["GET", /^tts\/audio\/([0-9a-f]{40})\.mp3$/, ttsAudio],
  ["GET", /^admin\/tts$/, adminTts],
  ["PUT", /^admin\/tts$/, setTtsSettings],
  ["POST", /^topics\/([\w-]+)\/ask$/, topicAsk],
  ["GET", /^certificate$/, myCertificate],
  ["POST", /^certificate$/, issueCertificate],
  ["GET", /^certificate\/((?:TT|SA)-[0-9A-Fa-f]{8})$/, getCertificate],
  ["GET", /^admin\/evidence$/, allEvidence],
  ["GET", /^admin\/overview$/, overview],
  ["GET", /^admin\/students$/, listStudents],
  ["PUT", /^admin\/students\/([\w-]+)$/, updateStudent],
  ["POST", /^admin\/students\/([\w-]+)\/password$/, adminResetPassword],
  ["GET", /^admin\/trainer-sessions$/, allSessions],
  ["GET", /^admin\/self-study$/, allSelfStudy],
  ["PUT", /^admin\/self-study\/([\w-]+)\/([\w-]+)$/, gradeSelfStudy],
];

export default async function handler(req) {
  const path = new URL(req.url).pathname.replace(/^\/(\.netlify\/functions\/api|api)\/?/, "").replace(/\/$/, "");
  try {
    if (path !== "health") await ensureSecret();
    for (const [method, pattern, fn] of routes) {
      const m = path.match(pattern);
      if (m && req.method === method) return await fn(req, ...m.slice(1).map(decodeURIComponent));
    }
    throw new HttpError(404, "Topilmadi");
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error(err);
    return json({ error: describeError(err) }, 500);
  }
}

export const config = { path: "/api/*" };
