// "Turistik korxonalar faoliyati tahlili" fani mavzulari.
// Nazariy matn, reja, mavzu bo'yicha savollar va tayanch iboralar o'quv qo'llanmadan olinadi (book.js — avtomatik import).
// Pedagogik qatlam: layer-a.js / layer-b.js (glossariy, metodlar, testlar, mustaqil ishlar),
// amaliy mashg'ulotlar: practice.js, dolzarb ma'lumotlar: updates.js.
import { BOOK } from "./book.js";
import { LAYER_A } from "./layer-a.js";
import { LAYER_B } from "./layer-b.js";
import { PRACTICE } from "./practice.js";
import { updatesFor } from "./updates.js";

export const COURSE = {
  title: "Turistik korxonalar faoliyati tahlili",
  audience: "61010400 – Turizm (faoliyat yo'nalishlari bo'yicha) bakalavriat talabalari uchun",
  source: "A.N. Xoliqulov. “Turistik korxonalar faoliyati tahlili”. O'quv qo'llanma. Samarqand: STEP-SEL, 2024.",
  program: "O'zMU Jizzax filiali, “Iqtisodiyot va turizm” kafedrasi. Fan kodi TKFT1706, VII semestr, 6 kredit: ma'ruza 44 soat, amaliy 46 soat, mustaqil ta'lim 90 soat.",
  description:
    "Fan turistik korxonalar faoliyatini iqtisodiy tahlil qilishning nazariy va amaliy asoslarini o'rgatadi: tahlil usullari, moliyaviy hisobotlar va balans, asosiy vositalar, nomoddiy va aylanma aktivlar, majburiyatlar, debitorlik va kreditorlik qarzlari, pul oqimlari, likvidlik, moliyaviy natijalar, foyda, rentabellik, zararsizlik nuqtasi, xarajatlar hamda mehnat unumdorligi tahlili.",
  // Fan dasturidagi ta'lim natijalari (TN)
  outcomes: [
    "Turistik korxonalar faoliyatining mazmuni, maqsadi, vazifalari va asosiy iqtisodiy ko'rsatkichlarini biladi.",
    "Daromadlar, xarajatlar, foyda va rentabellikni shakllantiruvchi omillarni anglaydi.",
    "Taqqoslash, guruhlash, indeks, dinamik qatorlar va koeffitsiyentlardan foydalanadi.",
    "Iqtisodiy ma'lumotlarni yig'adi, tizimlashtiradi va asosiy ko'rsatkichlar o'zgarish sabablarini aniqlaydi.",
    "Daromad, xarajat, foyda, rentabellik va mehnat unumdorligini hisoblaydi va tahlil qiladi.",
    "Omilli tahlil usullari bilan natijaviy ko'rsatkichlar o'zgarishini baholaydi.",
    "Jadval, diagramma va raqamli vositalar yordamida ko'rsatkichlarni ifodalaydi va xulosa shakllantiradi.",
    "Korxona faoliyatini kompleks tahlil qilib, samaradorlikni oshirish bo'yicha takliflar ishlab chiqadi.",
  ],
  grading: [
    ["Joriy nazorat (amaliy mashg'ulotdagi faollik)", 20, 12],
    ["Oraliq nazorat (yozma-og'zaki yoki test)", 10, 6],
    ["Mustaqil ish", 20, 12],
    ["Yakuniy nazorat (yozma ish yoki test)", 50, 30],
  ],
};

export const BOOK_INTRO = BOOK.intro;
export const LITERATURE = BOOK.literature;

const LAYER = { ...LAYER_A, ...LAYER_B };
const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];
const pad = (n) => String(n).padStart(2, "0");
// Dars taqdimotlari slaydlari soni (public/slides/NN.pdf)
const DECK_PAGES = { 1: 41, 2: 48, 3: 49, 4: 55, 5: 51, 6: 55, 7: 55, 8: 55, 9: 56, 10: 55, 11: 56, 12: 60, 13: 60, 14: 60, 15: 60, 16: 59, 17: 60, 18: 60 };

export const TOPICS = BOOK.topics.map((b) => {
  const layer = LAYER[b.num] || {};
  const practice = PRACTICE[b.num] || null;
  return {
    id: `t${b.num}`,
    num: b.num,
    chapter: b.chapter,
    icon: layer.icon || "📘",
    title: layer.title || b.title,
    bookTitle: b.title,
    goal: practice?.goal || "",
    image: null,
    plan: b.plan,
    sections: b.sections,
    questions: b.questions,
    keywords: b.keywords,
    glossary: layer.glossary || [],
    quiz: (layer.tests || []).map((t) => ({ q: t.q, options: t.options, correct: t.c, letters: OPTION_LETTERS })),
    methods: layer.methods || [],
    selfStudy: layer.selfStudy || [],
    resources: layer.resources || [],
    practice,
    updates: updatesFor(b.num),
    // Dars taqdimoti (manbalar/ dagi .pptx → PDF), o'qituvchi panelida almashtirilishi mumkin
    deck: `/slides/${pad(b.num)}.pdf`,
    deckPages: DECK_PAGES[b.num] || null,
    trainer: [],
  };
});

export const METHOD_INFO = {
  brainstorm: { name: "Aqliy hujum", icon: "💡", about: "G'oyalarni tanqidsiz, erkin va ko'p miqdorda yig'ish metodi." },
  cluster: { name: "Klaster", icon: "🕸️", about: "Tushunchalar o'rtasidagi bog'liqlikni grafik shaklda ifodalash metodi." },
  venn: { name: "Venn diagrammasi", icon: "⭕", about: "Ikki tushunchaning umumiy va farqli jihatlarini aniqlash metodi." },
  case: { name: "Keys-stadi", icon: "📁", about: "Real kasbiy vaziyatni tahlil qilib, yechim topish metodi." },
  fsmu: { name: "FSMU", icon: "🗣️", about: "Fikr → Sabab → Misol → Umumlashtirish: o'z fikrini asoslashga o'rgatuvchi texnika." },
  insert: { name: "INSERT", icon: "✍️", about: "Matnni belgilar yordamida faol, tanqidiy o'qish texnikasi." },
  matching: { name: "Moslashtirish", icon: "🔗", about: "Tushuncha va ta'riflarni o'zaro moslash mashqi." },
  tchart: { name: "T-jadval", icon: "⚖️", about: "Ikki qarama-qarshi jihatni (afzallik/kamchilik) taqqoslash grafik organayzeri." },
  ordering: { name: "Ketma-ketlik", icon: "🔢", about: "Jarayon bosqichlari yoki voqealarni to'g'ri tartibga keltirish mashqi." },
};
