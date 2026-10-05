// Amaliy mashg'ulotni sun'iy intellekt asosida tekshirish va feedback.
// Mezonlar amaliy mashg'ulotlar to'plamidagi tavsiya etilgan baholash mezoni asosida (jami 10 ball).
// AI kaliti bo'lmasa — hisob-kitoblar avtomatik tekshiriladi, ochiq javoblar uchun qoidaga asoslangan
// (kalit so'zlar, hajm, raqamlardan foydalanish) taxminiy baho va tavsiyalar beriladi.
import { TOPICS } from "../public/data/topics.js";
import { checkField, parseNum } from "../public/data/practice.js";

export const REVIEW_CRITERIA = [
  { key: "formulas", name: "Formulalar va ko'rsatkichlarni to'g'ri qo'llash", max: 3 },
  { key: "accuracy", name: "Hisob-kitoblarning aniqligi", max: 3 },
  { key: "analysis", name: "Iqtisodiy tahlil va xulosa", max: 2 },
  { key: "case", name: "Keys / amaliy vaziyat yechimi", max: 1 },
  { key: "independence", name: "Mustaqillik va asoslanganlik", max: 1 },
];

export const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    scores: { type: "object", properties: Object.fromEntries(REVIEW_CRITERIA.map((c) => [c.key, { type: "integer" }])), required: REVIEW_CRITERIA.map((c) => c.key), additionalProperties: false },
    summary: { type: "string" },
    tasks: { type: "array", items: { type: "object", properties: { id: { type: "string" }, comment: { type: "string" } }, required: ["id", "comment"], additionalProperties: false } },
    strengths: { type: "array", items: { type: "string" } },
    mistakes: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
  },
  required: ["scores", "summary", "tasks", "strengths", "mistakes", "recommendations"],
  additionalProperties: false,
};

const clip = (s, n) => String(s ?? "").slice(0, n);

/** Talaba yuborgan ma'lumotlarni tozalash va hisob-kitoblarni serverda qayta tekshirish. */
export function normalizeSubmission(topicId, raw = {}) {
  const topic = TOPICS.find((t) => t.id === topicId);
  if (!topic?.practice) return null;
  const tasks = topic.practice.tasks.map((task) => {
    const given = raw.tasks?.[task.id] || {};
    const fields = task.fields.map((f, i) => {
      const value = clip(given.values?.[i], 40);
      return { label: f.label, unit: f.unit, expected: f.value, given: value, ok: value !== "" && checkField(f, value) };
    });
    return { id: task.id, title: task.title, text: task.text, formula: task.formula, solution: task.solution, work: clip(given.work, 1500), fields, attempted: fields.some((f) => f.given !== ""), ok: fields.every((f) => f.ok) };
  });
  const open = (topic.practice.open || []).map((q, i) => ({ q, answer: clip(raw.open?.[i], 3000) }));
  return { topic, tasks, open, conclusion: clip(raw.conclusion, 3000) };
}

export function reviewPrompt(sub) {
  const { topic } = sub;
  const taskText = sub.tasks
    .map((t) => {
      const fields = t.fields.map((f) => `   - ${f.label}: talaba javobi = ${f.given === "" ? "(bo'sh)" : `${f.given} ${f.unit}`}; to'g'ri javob = ${f.expected} ${f.unit}; ${f.ok ? "TO'G'RI" : f.given === "" ? "BAJARILMAGAN" : "XATO"}`).join("\n");
      return `[${t.id}] ${t.title}\nShart: ${t.text}${t.formula ? `\nFormula: ${t.formula}` : ""}\nNamunaviy yechim: ${t.solution}\nTalabaning yechim yo'li: ${t.work || "(yozilmagan)"}\n${fields}`;
    })
    .join("\n\n");
  const openText = sub.open.map((o, i) => `${i + 1}) Topshiriq: ${o.q}\n   Talaba javobi: ${o.answer || "(bo'sh)"}`).join("\n");
  return `Sen "Turistik korxonalar faoliyati tahlili" fanidan amaliy mashg'ulotlarni tekshiruvchi tajribali o'qituvchisan (OTM, 61010400 – Turizm yo'nalishi, 4-kurs). Talabaning ${topic.num}-mavzu bo'yicha amaliy ishini tekshir va unga foydali, aniq feedback ber.

Mavzu: ${topic.num}. ${topic.title}
Mashg'ulot maqsadi: ${topic.practice.goal}
Tayanch tushunchalar: ${topic.practice.concepts.join(", ")}

HISOB-KITOB TOPSHIRIQLARI (sonli javoblar server tomonidan avtomatik tekshirilgan):
${taskText}

OCHIQ TOPSHIRIQLAR (keys, tahliliy savollar):
${openText || "(yo'q)"}

Talabaning umumiy xulosasi: ${sub.conclusion || "(yozilmagan)"}

BAHOLASH MEZONLARI (jami 10 ball):
${REVIEW_CRITERIA.map((c) => `- ${c.key}: ${c.name} — 0..${c.max} ball`).join("\n")}

QOIDALAR:
1. Sonli javoblarning to'g'ri/xatoligini yuqoridagi avtomatik tekshiruvga tayan; xato bo'lsa, talabaning yechim yo'lidan xato qayerda ekanini (formula, birlik, foiz/koeffitsiyent, yaxlitlash) aniqlashga harakat qil, lekin tayyor javobni to'liq yechib berma — yo'naltiruvchi maslahat ber.
2. Ochiq javoblarda iqtisodiy mazmun, ko'rsatkichlar o'rtasidagi bog'liqlik, raqamlarga tayanish va amaliy takliflarni bahola. Bo'sh javobga ball berma.
3. "tasks" massivida har bir hisob-kitob topshirig'i (id bo'yicha) va har bir ochiq topshiriq ("open-1", "open-2"...) uchun 1–2 gaplik izoh yoz.
4. strengths — 2–3 ta, mistakes — aniq xatolar (bo'lmasa bo'sh massiv), recommendations — 3–4 ta amaliy tavsiya (qaysi mavzu bo'limini qayta o'qish, qaysi formula).
5. Faqat o'zbek tilida (lotin yozuvida), hurmat bilan, "siz" deb murojaat qil. Markdown belgilarisiz yoz.
6. Javobni faqat JSON ko'rinishida qaytar.`;
}

export function parseReview(raw) {
  let obj = null;
  try {
    obj = JSON.parse(raw);
  } catch {
    const m = String(raw).match(/\{[\s\S]*\}/);
    if (m) {
      try {
        obj = JSON.parse(m[0]);
      } catch {}
    }
  }
  if (!obj || typeof obj !== "object") return null;
  const scores = {};
  let found = 0;
  for (const c of REVIEW_CRITERIA) {
    const v = Number(obj.scores?.[c.key]);
    if (Number.isFinite(v)) found++;
    scores[c.key] = Math.max(0, Math.min(c.max, Math.round(Number.isFinite(v) ? v : 0)));
  }
  if (!found) return null;
  const arr = (x) => (Array.isArray(x) ? x.map((s) => clip(s, 600)).filter(Boolean).slice(0, 8) : []);
  return {
    scores,
    summary: clip(obj.summary, 1500),
    tasks: Array.isArray(obj.tasks) ? obj.tasks.filter((t) => t && t.id).map((t) => ({ id: clip(t.id, 20), comment: clip(t.comment, 600) })).slice(0, 20) : [],
    strengths: arr(obj.strengths),
    mistakes: arr(obj.mistakes),
    recommendations: arr(obj.recommendations),
  };
}

/** AI ulanmaganda: qoidaga asoslangan baholash. */
export function demoReview(sub) {
  const calc = sub.tasks;
  const fields = calc.flatMap((t) => t.fields);
  const okShare = fields.length ? fields.filter((f) => f.ok).length / fields.length : 0;
  const attemptedShare = calc.length ? calc.filter((t) => t.attempted).length / calc.length : 0;
  const words = (s) => String(s || "").split(/\s+/).filter(Boolean).length;
  const concepts = sub.topic.practice.concepts.map((c) => c.toLowerCase().slice(0, 7));
  const openAnswers = sub.open.map((o) => o.answer).concat(sub.conclusion);
  const openWords = openAnswers.reduce((n, a) => n + words(a), 0);
  const conceptHits = concepts.filter((c) => openAnswers.join(" ").toLowerCase().includes(c)).length;
  const usesNumbers = /\d/.test(openAnswers.join(" "));
  const scores = {
    formulas: Math.round(3 * Math.min(1, okShare * 0.7 + attemptedShare * 0.3)),
    accuracy: Math.round(3 * okShare),
    analysis: openWords >= 80 && conceptHits >= 2 ? 2 : openWords >= 30 ? 1 : 0,
    case: sub.open.some((o) => words(o.answer) >= 40) ? 1 : 0,
    independence: calc.some((t) => words(t.work) >= 5) || usesNumbers ? 1 : 0,
  };
  const wrong = calc.filter((t) => t.attempted && !t.ok);
  const missing = calc.filter((t) => !t.attempted);
  return {
    scores,
    summary: `Hisob-kitoblarda ${fields.filter((f) => f.ok).length} / ${fields.length} ta javob to'g'ri. ${openWords ? `Ochiq javoblaringiz hajmi ~${openWords} so'z.` : "Ochiq topshiriqlarga javob yozilmagan."} (AI kaliti ulanmagan — baho avtomatik qoidalar asosida taxminiy hisoblandi.)`,
    tasks: [
      ...calc.map((t) => ({ id: t.id, comment: t.ok ? "To'g'ri hisoblangan." : t.attempted ? `Xato bor: ${t.fields.filter((f) => !f.ok).map((f) => f.label).join(", ")}. Formulani va o'lchov birligini (%, koeffitsiyent, mln so'm) qayta tekshiring.` : "Bajarilmagan." })),
      ...sub.open.map((o, i) => ({ id: `open-${i + 1}`, comment: words(o.answer) >= 40 ? "Javob yozilgan; raqamlar va tayanch tushunchalar bilan asoslashni kuchaytiring." : o.answer ? "Javob juda qisqa — kamida 4–6 gapda, raqamlarga tayanib yozing." : "Javob yozilmagan." })),
    ],
    strengths: [okShare >= 0.7 && "Hisob-kitoblarning ko'pchiligi to'g'ri bajarilgan.", conceptHits >= 2 && "Javoblarda mavzuning tayanch tushunchalari qo'llangan.", usesNumbers && "Xulosalar raqamlarga tayangan."].filter(Boolean),
    mistakes: [...wrong.map((t) => `${t.title}: natija to'g'ri javobdan farq qiladi.`), ...missing.map((t) => `${t.title}: bajarilmagan.`)],
    recommendations: [
      wrong.length ? "Xato chiqqan topshiriqlarda “Yechimni ko'rish” tugmasi orqali namunaviy yechim bilan solishtiring." : "Keyingi mavzuga o'tishingiz mumkin.",
      `Mavzu nazariyasidagi formulalarni qayta ko'rib chiqing (${sub.topic.practice.source}).`,
      "Xulosada har bir ko'rsatkich o'zgarishining sababi va rahbar uchun aniq chorani yozing.",
    ],
    estimated: true,
  };
}

export const totalOf = (scores) => REVIEW_CRITERIA.reduce((s, c) => s + (scores[c.key] || 0), 0);
export { parseNum };
