// Savollar bankini tekshirish: node scripts/check-bank.mjs
import { TOPICS } from "../public/data/topics.js";
let errors = 0;
const err = (m) => (errors++, console.log("❌", m));
for (const t of TOPICS) {
  const kinds = {};
  for (const q of t.bank) {
    kinds[q.kind] = (kinds[q.kind] || 0) + 1;
    if (!q.q || q.options.length < 4) err(`${t.num}: variantlar kam — ${q.q.slice(0, 60)}`);
    if (!(q.correct >= 0 && q.correct < q.options.length)) err(`${t.num}: to'g'ri javob indeksi noto'g'ri — ${q.q.slice(0, 60)}`);
    if (new Set(q.options).size !== q.options.length) err(`${t.num}: takroriy variant — ${q.q.slice(0, 60)}`);
    if (/NaN|undefined/.test(q.q + q.options.join())) err(`${t.num}: NaN/undefined — ${q.q.slice(0, 60)}`);
  }
  if (t.bank.length < 30) err(`${t.num}-mavzu: ${t.bank.length} ta savol (< 30)`);
  console.log(`${String(t.num).padStart(2)}. ${String(t.bank.length).padStart(2)} ta savol · ${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(", ")}`);
}
const ex = {};
for (const t of TOPICS) for (const q of t.bank.filter((x) => x.kind === "extra")) ex[q.correct] = (ex[q.correct] || 0) + 1;
console.log("Qo'shimcha savollarda to'g'ri javob o'rni:", JSON.stringify(ex));
console.log(errors ? `\n${errors} ta xato.` : `\n✅ Jami ${TOPICS.reduce((s, t) => s + t.bank.length, 0)} ta savol, har mavzuda ≥ 30.`);
process.exit(errors ? 1 : 0);
