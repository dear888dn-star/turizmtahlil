// "AI Ustoz": o'quv qo'llanma mavzusi matniga tayangan savol-javob yordamchisi.
// AI kaliti bo'lmasa, savolga eng mos qo'llanma parchalari topilib ko'rsatiladi (qidiruv rejimi).
import { TOPICS } from "../../public/data/topics.js";

const strip = (html) =>
  String(html || "")
    .replace(/<(br|\/p|\/li|\/h\d|\/tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();

export function findTopic(id) {
  return TOPICS.find((t) => t.id === id);
}

export function tutorSystem(topic) {
  let text = "";
  for (const s of topic.sections) {
    const chunk = `\n## ${s.title || "Kirish"}\n${strip(s.html)}`;
    if (text.length + chunk.length > 16000) break;
    text += chunk;
  }
  const glossary = topic.glossary.map((g) => `- ${g.term}: ${g.def}`).join("\n");
  const updates = (topic.updates || []).map((u) => `- ${u.area}: ${u.now}`).join("\n");
  const practice = topic.practice ? `\nAMALIY MASHG'ULOT FORMULALARI:\n${topic.practice.tasks.map((t) => `- ${t.title}${t.formula ? `: ${t.formula}` : ""}`).join("\n")}` : "";
  return `Sen "TurTahlil" platformasidagi "AI Ustoz"san — OTM talabalariga (61010400 – Turizm yo'nalishi) "Turistik korxonalar faoliyati tahlili" fanidan yordam beradigan mehribon, sabrli o'qituvchisan.

Hozirgi mavzu: ${topic.num}-mavzu. ${topic.title}
Mavzu maqsadi: ${topic.goal}

QOIDALAR:
1. Faqat o'zbek tilida (lotin yozuvida) javob ber. Aniq, tushunarli, bakalavr talabasi darajasida yoz; formulalarni oddiy matnda ko'rsat (masalan: ROA = Sof foyda / Aktivlar × 100).
2. Avvalo quyidagi o'quv qo'llanma matniga tayan. Qo'llanmadan olingan ma'lumotda bo'lim nomini qavs ichida ko'rsat, masalan: (2.3-bo'lim). Qo'llanmada yo'q umumiy bilim bersang, buni aytib o't.
3. Javob qisqa bo'lsin: 3–8 gap yoki 3–6 bandli ro'yxat. Kerak bo'lsa turizmdan aniq misol keltir (turoperator, mehmonxona, turagentlik, turpaket hisob-kitobi).
4. Talaba test yoki nazorat savolining tayyor javobini so'rasa, darhol aytma: yo'naltiruvchi savol va maslahat bilan o'zi topishiga yordam ber (Sokrat usuli), ikkinchi urinishdan keyin tushuntir.
5. Mavzuga aloqasi yo'q yoki nojo'ya so'rovlarga muloyimlik bilan rad javobini berib, mavzuga qaytar.
6. Markdown belgilari (*, #, **) ishlatma; ro'yxat uchun "–" yoki "1)" dan foydalan.
7. Qo'llanmadagi statistik raqamlar va me'yoriy hujjatlar eskirgan bo'lishi mumkin: "DOLZARB MA'LUMOTLAR" bo'limidagi yangi qiymatlarni ustun qo'y va buni aytib o't.
8. Oxirida, o'rinli bo'lsa, bitta qisqa savol bilan talabani o'ylashga undab qo'y.

O'QUV QO'LLANMA MATNI:
${text}

TAYANCH TUSHUNCHALAR:
${glossary}
${practice}
${updates ? `\nDOLZARB MA'LUMOTLAR (2026-yil oktabr holatiga tekshirilgan):\n${updates}` : ""}`;
}

const tokenize = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[ʻ'‘’`]/g, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 2);

/** AI bo'lmaganda: savolga eng mos qo'llanma parchalari. */
export function searchAnswer(topic, question) {
  const q = new Set(tokenize(question).map((w) => w.slice(0, 6)));
  const passages = [];
  for (const s of topic.sections) {
    for (const p of strip(s.html).split("\n")) {
      if (p.length < 60) continue;
      const words = tokenize(p).map((w) => w.slice(0, 6));
      const score = words.filter((w) => q.has(w)).length / Math.sqrt(words.length + 5);
      if (score > 0) passages.push({ title: s.title || "Kirish", text: p, score });
    }
  }
  for (const g of topic.glossary) {
    const words = tokenize(`${g.term} ${g.def}`).map((w) => w.slice(0, 6));
    const score = (words.filter((w) => q.has(w)).length / Math.sqrt(words.length + 5)) * 1.4;
    if (score > 0) passages.push({ title: "Tayanch tushuncha", text: `${g.term} — ${g.def}`, score });
  }
  passages.sort((a, b) => b.score - a.score);
  const top = passages.slice(0, 2);
  if (!top.length) return `Bu savol bo'yicha ${topic.num}-mavzu matnidan mos parcha topilmadi. Savolni mavzudagi tushunchalar yordamida boshqacha ifodalab ko'ring (masalan: "${topic.glossary[0]?.term || topic.title}" nima?).`;
  return `Qo'llanmadan topilgan eng mos parchalar (AI kaliti ulanmagan, shuning uchun qidiruv rejimida ishlayapman):\n\n${top.map((p) => `📖 ${p.title}\n${p.text.length > 700 ? `${p.text.slice(0, 700)}…` : p.text}`).join("\n\n")}`;
}
