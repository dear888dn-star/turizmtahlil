// Amaliy mashg'ulot variantlarini tekshirish: node scripts/check-variants.mjs
// 1) Asl raqamlar (base) practice.js dagi javoblarni aynan qaytarishi kerak — formulalar to'g'riligining isboti.
// 2) Ko'p tasodifiy variantlarda javoblar son, shart matnida "NaN/undefined" yo'q, mantiqiy chegaralar buzilmaydi.
// 3) Har bir variant asl masaladan va boshqa talabanikidan farq qiladi.
import { PRACTICE, checkField } from "../public/data/practice.js";
import { VARIANT_TOPICS, baseValues, baseTexts, practiceFor } from "../public/data/practice-variants.js";

let errors = 0;
const err = (m) => (errors++, console.log("❌", m));

for (const [num, pr] of Object.entries(PRACTICE)) {
  const def = VARIANT_TOPICS[num];
  if (!def) {
    if (pr.tasks.length) err(`${num}-mavzu: variant ta'rifi yo'q`);
    continue;
  }
  const base = baseValues(num);
  const texts = baseTexts(num);
  const norm = (x) => String(x).replace(/[\s\u00a0]+/g, " ").replace(/−/g, "-").trim();
  for (const t of pr.tasks) if (def.tasks[t.id] && norm(texts[t.id]) !== norm(t.text)) console.log(`⚠️  ${t.id} matni asldan farq qiladi:\n   asl:    ${norm(t.text)}\n   shablon: ${norm(texts[t.id])}`);
  for (const t of pr.tasks) {
    if (!def.tasks[t.id]) {
      err(`${t.id}: variant shabloni yo'q`);
      continue;
    }
    const vals = base[t.id];
    if (vals.length !== t.fields.length) err(`${t.id}: maydonlar soni ${t.fields.length}, formulada ${vals.length}`);
    t.fields.forEach((f, i) => {
      if (!checkField(f, String(vals[i]))) err(`${t.id} “${f.label}”: asl javob ${f.value}, formula ${vals[i]}`);
    });
  }
}

const SEEDS = 2000;
const seen = {};
for (let s = 0; s < SEEDS; s++) {
  const seed = `test-${s}-${(s * 2654435761) % 1e9}`;
  for (const num of Object.keys(VARIANT_TOPICS)) {
    const pr = practiceFor(num, seed);
    for (const t of pr.tasks) {
      if (/NaN|undefined|Infinity/.test(t.text + t.solution)) err(`${t.id} (${seed}): matnda NaN/undefined`);
      for (const f of t.fields) {
        if (!Number.isFinite(f.value)) err(`${t.id} (${seed}) “${f.label}”: ${f.value}`);
        // Mantiqiy chegaralar: soni, ulush, koeffitsiyent manfiy bo'lmasligi (ta'sir/farq/oqim maydonlaridan tashqari)
        const signed = /ta'siri|farq|Farq|Investitsion|Moliyaviy|Operatsion|Jami|Ulush ta'siri|O'sish|Sof pul|Foyda$/.test(f.label);
        if (!signed && f.value < 0) err(`${t.id} (${seed}) “${f.label}”: manfiy qiymat ${f.value}`);
        // Talaba kiritgan aniq javob o'zi qabul qilinadimi (yaxlitlangan holda ham)
        if (!checkField(f, String(Math.round(f.value * 100) / 100)) && Math.abs(f.value) > 1) err(`${t.id} (${seed}) “${f.label}”: 2 xonagacha yaxlitlangan javob qabul qilinmaydi (${f.value}, tol ${f.tol})`);
      }
      const key = t.fields.map((f) => f.value).join("|");
      seen[t.id] ||= new Map();
      seen[t.id].set(key, (seen[t.id].get(key) || 0) + 1);
    }
  }
}
// Mantiqiy shartlar (alohida)
for (let s = 0; s < SEEDS; s++) {
  const seed = `logic-${s}`;
  const v = (n, id) => practiceFor(n, seed).tasks.find((t) => t.id === id).fields.map((f) => f.value);
  const [pos] = v(2, "p2-2");
  if (pos <= 0) err(`p2-2 (${seed}): davr oxiri qoldig'i ${pos}`);
  const [, maj] = v(4, "p4-1");
  if (maj <= 0) err(`p4-1 (${seed}): majburiyatlar ${maj}`);
  const [oam] = v(8, "p8-4");
  if (oam <= 0) err(`p8-4 (${seed}): o'z aylanma mablag'i ${oam}`);
  const [, profit] = v(16, "p16-1");
  if (profit <= 0) err(`p16-1 (${seed}): foyda ${profit}`);
  const [share] = v(14, "p14-2");
  if (share <= 0 || share >= 100) err(`p14-2 (${seed}): ulush ${share}`);
  const [, , ext] = v(17, "p17-3").concat([0]);
  const [ext17] = v(17, "p17-3");
  if (ext17 <= 0) err(`p17-3 (${seed}): tashqi mablag' ${ext17}`);
  const [opo] = v(3, "p3-1");
  if (opo <= 0 && s < 50) console.log(`ℹ️  p3-1 (${seed}): operatsion pul oqimi manfiy (${opo}) — bunday holat ham real, xato emas`);
}
// Ko'chirish: A talaba B talabaning javoblarini yozsa, ular to'g'ri chiqish ehtimoli.
// Har bir masala uchun ≤ 2%, butun amaliy mashg'ulot (barcha masalalar birga) uchun ≤ 0,1% bo'lishi kerak.
const pairP = {};
for (const [id, counts] of Object.entries(seen)) {
  let same = 0;
  for (const n of counts.values()) same += n * (n - 1);
  pairP[id] = same / (SEEDS * (SEEDS - 1));
  if (pairP[id] > 0.02) err(`${id}: ikki talabaning javobi mos kelish ehtimoli ${(pairP[id] * 100).toFixed(2)}% (${counts.size} xil javob)`);
}
const worst = [];
for (const [num, pr] of Object.entries(PRACTICE)) {
  if (!pr.tasks.length) continue;
  // Mavzu bo'yicha: masalalar parametrlari bog'liq bo'lgani uchun to'g'ridan-to'g'ri o'lchanadi
  const m = new Map();
  for (let s = 0; s < SEEDS; s++) {
    const key = practiceFor(num, `test-${s}-${(s * 2654435761) % 1e9}`).tasks.map((t) => t.fields.map((f) => f.value).join(",")).join("|");
    m.set(key, (m.get(key) || 0) + 1);
  }
  let same = 0;
  for (const n of m.values()) same += n * (n - 1);
  const p = same / (SEEDS * (SEEDS - 1));
  worst.push([num, p]);
  if (p > 0.001) err(`${num}-mavzu: butun mashg'ulot javoblari mos kelish ehtimoli ${(p * 100).toFixed(3)}%`);
}
const maxTask = Object.entries(pairP).sort((a, b) => b[1] - a[1])[0];
console.log(`ℹ️  Eng "zaif" masala: ${maxTask[0]} — ${(maxTask[1] * 100).toFixed(2)}%; mavzular bo'yicha eng yuqori: ${Math.max(...worst.map((w) => w[1])) * 100}%`);

console.log(errors ? `\n${errors} ta xato.` : `\n✅ Barcha variantlar to'g'ri: ${Object.keys(VARIANT_TOPICS).length} mavzu, ${SEEDS} ta tasodifiy talaba.`);
process.exit(errors ? 1 : 0);
