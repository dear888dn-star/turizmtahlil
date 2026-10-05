// "Tahlil laboratoriyasi": turistik korxona faoliyatining kompleks tahlili loyihasi —
// baholash rubrikasi (100 ball), darajalar va AI tekshiruv prompti.
import { analyze, NORMS, fmt, pct, LAB_SECTIONS } from "../public/js/finance.js";

export { LAB_SECTIONS };

export const LAB_RUBRIC = [
  { title: "Dastlabki ma'lumotlarning to'liqligi va balans tengligi", max: 10 },
  { title: "Gorizontal va vertikal tahlil, o'zgarishlar talqini", max: 10 },
  { title: "Likvidlik va to'lov qobiliyati tahlili", max: 15 },
  { title: "Moliyaviy barqarorlik (mustaqillik) tahlili", max: 10 },
  { title: "Ish faolligi: aylanish ko'rsatkichlari, debitorlik/kreditorlik", max: 10 },
  { title: "Moliyaviy natijalar va rentabellik (DuPont)", max: 15 },
  { title: "Zararsizlik nuqtasi va xavfsizlik zaxirasi", max: 10 },
  { title: "Xulosalarning raqamlar bilan asoslanganligi", max: 10 },
  { title: "Takliflarning aniqligi va amaliyligi (2026-yil sharoitida)", max: 10 },
];

export const LAB_LEVELS = [
  { min: 86, label: "A'lo (86–100)" },
  { min: 71, label: "Yaxshi (71–85)" },
  { min: 56, label: "Qoniqarli (56–70)" },
  { min: 0, label: "Qoniqarsiz (0–55)" },
];

export const labLevel = (total) => LAB_LEVELS.find((l) => total >= l.min)?.label || LAB_LEVELS.at(-1).label;

export const LAB_REVIEW_SCHEMA = {
  type: "object",
  properties: {
    scores: { type: "array", items: { type: "integer" } },
    summary: { type: "string" },
    sections: { type: "array", items: { type: "object", properties: { key: { type: "string" }, comment: { type: "string" } }, required: ["key", "comment"], additionalProperties: false } },
    strengths: { type: "array", items: { type: "string" } },
    mistakes: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
  },
  required: ["scores", "summary", "sections", "strengths", "mistakes", "recommendations"],
  additionalProperties: false,
};

const clip = (s, n) => String(s ?? "").slice(0, n);

function metricsText(p) {
  const a = analyze(p.data?.prev || {}, p.data?.cur || {});
  const rows = Object.entries(NORMS).map(([k, m]) => `- ${m.label}: ${["ownWcRatio", "current", "quick", "absolute", "autonomy"].includes(k) ? fmt(a.k[k]) : pct(a.k[k])} (me'yor ${m.norm})`);
  return [
    `Jami aktivlar: ${fmt(a.prev.assets, 0)} → ${fmt(a.cur.assets, 0)} mln so'm; balans tengligi: ${a.cur.balanced ? "bajarilgan" : "BAJARILMAGAN"}`,
    `Sof tushum o'sishi: ${pct(a.growth.revenue)}; sof foyda: ${fmt(a.prev.net, 0)} → ${fmt(a.cur.net, 0)} mln so'm`,
    `Debitorlik o'sishi: ${pct(a.growth.receivables)}; majburiyatlar o'sishi: ${pct(a.growth.liabilities)}; xususiy kapital o'sishi: ${pct(a.growth.equity)}`,
    ...rows,
    `Aktivlar rentabelligi (ROA): ${pct(a.k.roa)}; aktivlar aylanishi: ${fmt(a.k.assetTurnover)}; moliyaviy leverej: ${fmt(a.dupont.leverage)}`,
    `Debitorlik aylanish davri: ${fmt(a.k.recDays, 0)} kun; kreditorlik: ${fmt(a.k.payDays, 0)} kun`,
    `Zararsizlik tushumi: ${fmt(a.k.bep, 0)} mln so'm; bir xodim unumdorligi: ${fmt(a.k.productivity, 1)} mln so'm`,
    `Balans likvidligi: A1=${fmt(a.groups.A1, 0)} / P1=${fmt(a.groups.P1, 0)}; A2=${fmt(a.groups.A2, 0)} / P2=${fmt(a.groups.P2, 0)}; A3=${fmt(a.groups.A3, 0)} / P3=${fmt(a.groups.P3, 0)}; A4=${fmt(a.groups.A4, 0)} / P4=${fmt(a.groups.P4, 0)}`,
  ].join("\n");
}

export function labReviewPrompt(p) {
  const concl = LAB_SECTIONS.map(([k, t]) => `### ${t}\n${clip(p.conclusions?.[k], 2500) || "(yozilmagan)"}`).join("\n\n");
  return `Sen “Turistik korxonalar faoliyati tahlili” fanidan kurs loyihalarini tekshiruvchi tajribali o'qituvchisan. Talaba “Tahlil laboratoriyasi”da quyidagi korxonaning kompleks moliyaviy tahlilini bajardi. Ko'rsatkichlar platforma tomonidan to'g'ri hisoblangan — sen talabaning XULOSALARI shu raqamlarga mos kelishini, iqtisodiy mantiqini va takliflar sifatini baholaysan.

Korxona: ${clip(p.title, 200)} (${clip(p.company?.type, 80) || "turistik korxona"})
Tavsif: ${clip(p.company?.about, 800)}

HISOBLANGAN KO'RSATKICHLAR (mln so'm):
${metricsText(p)}

TALABA XULOSALARI:
${concl}

BAHOLASH RUBRIKASI (scores massivida aynan shu tartibda, butun son):
${LAB_RUBRIC.map((c, i) => `${i + 1}) ${c.title} — 0..${c.max}`).join("\n")}

QOIDALAR:
1. Talaba ko'rsatkichni noto'g'ri talqin qilgan bo'lsa (masalan, past likvidlikni “yaxshi” degan bo'lsa), buni mistakes ga aniq yoz.
2. Xulosa raqamlarsiz, umumiy gaplardan iborat bo'lsa, ball pasaytir. Bo'sh bo'limga ball berma.
3. Takliflar 2026-yil O'zbekiston sharoitiga mos bo'lishi kerak (asosiy stavka 14%, foyda solig'i 15%, QQS 12% yoki soddalashtirilgan 6%, turistik soliq, mehmonxonalar uchun imtiyozlar).
4. sections massivida har bir bo'lim kaliti (${LAB_SECTIONS.map(([k]) => k).join(", ")}) uchun 1–3 gaplik izoh ber.
5. Faqat o'zbek tilida (lotin), "siz" deb murojaat qil, markdownsiz. Javob faqat JSON.`;
}

export function parseLabReview(raw) {
  let obj = null;
  try {
    obj = JSON.parse(raw);
  } catch {
    const m = String(raw).match(/\{[\s\S]*\}/);
    if (m) try { obj = JSON.parse(m[0]); } catch {}
  }
  if (!obj || !Array.isArray(obj.scores) || obj.scores.length < LAB_RUBRIC.length) return null;
  const scores = LAB_RUBRIC.map((c, i) => Math.max(0, Math.min(c.max, Math.round(Number(obj.scores[i]) || 0))));
  const arr = (x) => (Array.isArray(x) ? x.map((s) => clip(s, 600)).filter(Boolean).slice(0, 8) : []);
  return {
    scores,
    total: scores.reduce((a, b) => a + b, 0),
    summary: clip(obj.summary, 1500),
    sections: Array.isArray(obj.sections) ? obj.sections.filter((x) => x?.key).map((x) => ({ key: clip(x.key, 30), comment: clip(x.comment, 800) })) : [],
    strengths: arr(obj.strengths),
    mistakes: arr(obj.mistakes),
    recommendations: arr(obj.recommendations),
  };
}

/** AI ulanmaganda: bo'limlar hajmi va raqamlardan foydalanishga qarab taxminiy baho. */
export function demoLabReview(p) {
  const a = analyze(p.data?.prev || {}, p.data?.cur || {});
  const words = (s) => String(s || "").split(/\s+/).filter(Boolean).length;
  const sec = Object.fromEntries(LAB_SECTIONS.map(([k]) => [k, String(p.conclusions?.[k] || "")]));
  const q = (k, max) => {
    const w = words(sec[k]);
    const nums = /\d/.test(sec[k]);
    return Math.round(max * Math.min(1, (w >= 60 ? 0.75 : w >= 25 ? 0.5 : w > 0 ? 0.25 : 0) + (nums ? 0.25 : 0)));
  };
  const scores = [
    a.cur.balanced && a.prev.balanced ? 10 : 5,
    q("structure", 10),
    q("liquidity", 15),
    q("stability", 10),
    q("activity", 10),
    q("profitability", 15),
    q("breakeven", 10),
    Math.round(10 * Math.min(1, Object.values(sec).filter((s) => /\d/.test(s)).length / 5)),
    q("recommendations", 10),
  ];
  return {
    scores,
    total: scores.reduce((x, y) => x + y, 0),
    summary: "AI kaliti ulanmagan — baho bo'limlar to'liqligi va raqamlardan foydalanishga qarab taxminiy hisoblandi. Yakuniy bahoni o'qituvchi qo'yadi.",
    sections: LAB_SECTIONS.map(([k, t]) => ({ key: k, comment: words(sec[k]) ? `${t}: ${words(sec[k])} so'z. Har bir xulosani hisoblangan ko'rsatkich va me'yor bilan asoslang.` : `${t}: bo'lim to'ldirilmagan.` })),
    strengths: [a.cur.balanced && "Balans tengligi ta'minlangan."].filter(Boolean),
    mistakes: LAB_SECTIONS.filter(([k]) => !words(sec[k])).map(([, t]) => `“${t}” bo'limi bo'sh.`),
    recommendations: ["Har bir bo'limda kamida 2–3 ta ko'rsatkichni raqam bilan keltiring va me'yor bilan solishtiring.", "Takliflarni aniq chora + kutilgan natija + muddat ko'rinishida yozing."],
    estimated: true,
  };
}
