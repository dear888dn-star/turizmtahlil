// Amaliy mashg'ulotlarning individual variantlari: har bir talabaga masala sharti bir xil, raqamlari esa boshqacha.
// Variant talaba identifikatoridan hosil qilinadi (seed) — u har doim bir xil bo'ladi, boshqa talabanikidan farq qiladi.
// practice.js dagi asl masala "namuna" sifatida (yechimi bilan) ko'rsatiladi.
//
// Har bir mavzu: { base: asl raqamlar, vary: (r) => yangi raqamlar, tasks: { id: { text, values, solution } } }
//   text(p) — shart, values(p) — practice.js dagi maydonlar tartibida to'g'ri javoblar, solution(p) — yechim yo'li.
// Tekshiruv: node scripts/check-variants.mjs — base raqamlar asl javoblarni aynan qaytarishi shart.
import { PRACTICE } from "./practice.js";

// ---------- Tasodifiy sonlar (seed bo'yicha takrorlanadigan) ----------
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const roundTo = (x, step) => {
  const v = Math.round(x / step) * step;
  const d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  return Number(v.toFixed(d));
};
function makeRng(seed) {
  const next = mulberry32(hash(seed));
  const r = {
    u: next,
    /** [a, b] oralig'idagi butun son */
    int: (a, b) => a + Math.floor(next() * (b - a + 1)),
    /** [a, b] oralig'idagi son, step ga yaxlitlangan */
    between: (a, b, step = 1) => roundTo(a + next() * (b - a), step),
    /** x ni ±pct oralig'ida o'zgartiradi (asl qiymatdan farqli bo'lishi kafolatlanadi) */
    vary: (x, pct, step) => {
      let v = roundTo(x * (1 + (next() * 2 - 1) * pct), step);
      if (v === x) v = roundTo(x + step * (next() < 0.5 ? -1 : 1) * r.int(1, 3), step);
      return v;
    },
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
  return r;
}

// ---------- Raqamlarni o'zbekcha yozish: 12 543,2 ----------
export function fmt(n, d = 2) {
  if (!Number.isFinite(n)) return "—";
  let s = (Math.round(n * 10 ** d) / 10 ** d).toFixed(d);
  if (s.includes(".")) s = s.replace(/\.?0+$/, ""); // faqat kasr qismidagi ortiqcha nollar
  const [i, f] = s.split(".");
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + (f ? `,${f}` : "");
}
const f0 = (n) => fmt(n, 0);
/** Kasr xonalari soni qat'iy: 0,720; 12,50 */
const fx = (n, d) => {
  const [i, f] = (Math.round(n * 10 ** d) / 10 ** d).toFixed(d).split(".");
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + (f ? `,${f}` : "");
};
const f1 = (n) => fmt(n, 1);
const f2 = (n) => fmt(n, 2);
const f3 = (n) => fmt(n, 3);
const pct = (a, b) => (a / b) * 100;
const sgn = (n, d = 2) => (n >= 0 ? `+${fmt(n, d)}` : `−${fmt(-n, d)}`);

// ---------- Mavzular ----------
const V = {
  1: {
    base: { T0: 4500, T1: 5040, F0: 625, F1: 575 },
    vary: (r) => {
      const T0 = r.vary(4500, 0.3, 50);
      const F0 = r.vary(625, 0.3, 5);
      return { T0, T1: roundTo(T0 * r.between(1.05, 1.22, 0.01), 10), F0, F1: roundTo(F0 * r.between(0.82, 0.97, 0.01), 5) };
    },
    tasks: {
      "p1-1": {
        text: (p) => `“Silk Road Travel” firmasida tushum ${f0(p.T0)} mln so'mdan ${f0(p.T1)} mln so'mga oshgan, sof foyda esa ${f0(p.F0)} mln so'mdan ${f0(p.F1)} mln so'mga kamaygan. Tushum va sof foydaning o'sish sur'atini (%) hisoblang.`,
        values: (p) => [pct(p.T1, p.T0), pct(p.F1, p.F0)],
        solution: (p) => `Tushum: ${f0(p.T1)} / ${f0(p.T0)} × 100 = ${f2(pct(p.T1, p.T0))}%. Sof foyda: ${f0(p.F1)} / ${f0(p.F0)} × 100 = ${f2(pct(p.F1, p.F0))}%. Tushum o'sib, foyda kamaygan — xarajatlar tushumdan tez o'sgan.`,
      },
    },
  },
  2: {
    base: { R: 5000, A: 5650, P: 4800, Q0: 120, In: 1480, Out: 1410, N0: 1200, P0: 1.5, N1: 1350, P1: 1.6, X0: 50, W0: 12, X1: 54, W1: 13 },
    vary: (r) => {
      const R = r.vary(5000, 0.3, 50);
      const A = roundTo(R * r.between(1.04, 1.18, 0.01), 10);
      const Q0 = r.vary(120, 0.4, 1);
      const In = r.vary(1480, 0.25, 1);
      const Out = roundTo(In - r.between(-0.5, 1.5, 0.001) * Q0, 1);
      const N0 = r.vary(1200, 0.3, 10);
      const P0 = r.vary(1.5, 0.3, 0.05);
      const X0 = r.int(30, 80);
      const W0 = r.vary(12, 0.3, 0.5);
      return {
        R, A, P: roundTo(A / r.between(1.08, 1.25, 0.01), 10), Q0, In, Out,
        N0, P0, N1: roundTo(N0 * r.between(1.04, 1.2, 0.01), 10), P1: roundTo(P0 + r.pick([-0.1, 0.05, 0.1, 0.15, 0.2, 0.25]), 0.05),
        X0, W0, X1: X0 + r.int(2, 8), W1: roundTo(W0 + r.pick([0.5, 1, 1.5, 2]), 0.5),
      };
    },
    tasks: {
      "p2-1": {
        text: (p) => `Firma rejada ${f0(p.R)} mln so'm tushum belgilagan, haqiqatda ${f0(p.A)} mln so'm oldi. O'tgan yili tushum ${f0(p.P)} mln so'm edi. Reja bajarilishi (%), o'tgan yilga nisbatan o'sish sur'ati (%) va rejadan mutlaq farqni toping.`,
        values: (p) => [pct(p.A, p.R), pct(p.A, p.P), p.A - p.R],
        solution: (p) => `${f0(p.A)} / ${f0(p.R)} × 100 = ${f1(pct(p.A, p.R))}%; ${f0(p.A)} / ${f0(p.P)} × 100 = ${f1(pct(p.A, p.P))}%; ${f0(p.A)} − ${f0(p.R)} = ${sgn(p.A - p.R, 0)} mln so'm.`,
      },
      "p2-2": {
        text: (p) => `Davr boshida pul ${f0(p.Q0)} mln so'm. Davr davomida ${f0(p.In)} mln so'm tushum kelib tushdi, ${f0(p.Out)} mln so'm sarflandi. Davr oxiridagi pul qoldig'ini toping.`,
        values: (p) => [p.Q0 + p.In - p.Out],
        solution: (p) => `Qoldiq = ${f0(p.Q0)} + ${f0(p.In)} − ${f0(p.Out)} = ${f0(p.Q0 + p.In - p.Out)} mln so'm.`,
      },
      "p2-3": {
        text: (p) => `Tushum T = turistlar soni (N) × bir turistga o'rtacha tushum (P). Reja: ${f0(p.N0)} turist × ${f2(p.P0)} mln so'm. Haqiqat: ${f0(p.N1)} turist × ${f2(p.P1)} mln so'm. Omillar ta'sirini toping.`,
        values: (p) => [(p.N1 - p.N0) * p.P0, p.N1 * (p.P1 - p.P0), p.N1 * p.P1 - p.N0 * p.P0],
        solution: (p) => `T0 = ${f0(p.N0)} × ${f2(p.P0)} = ${f1(p.N0 * p.P0)}; T* = ${f0(p.N1)} × ${f2(p.P0)} = ${f1(p.N1 * p.P0)} → N ta'siri ${sgn((p.N1 - p.N0) * p.P0, 1)}; T1 = ${f0(p.N1)} × ${f2(p.P1)} = ${f1(p.N1 * p.P1)} → P ta'siri ${sgn(p.N1 * (p.P1 - p.P0), 1)}; jami ${sgn(p.N1 * p.P1 - p.N0 * p.P0, 1)} mln so'm.`,
      },
      "p2-4": {
        text: (p) => `Bazis davrda ${f0(p.X0)} xodim, bir xodimga ${f1(p.W0)} mln so'm tushum; hisobot davrida ${f0(p.X1)} xodim, bir xodimga ${f1(p.W1)} mln so'm. Tushumning umumiy indeksini, xodimlar soni va unumdorlik indekslarini toping.`,
        values: (p) => [(p.X1 * p.W1) / (p.X0 * p.W0), p.X1 / p.X0, p.W1 / p.W0],
        solution: (p) => `T0 = ${f0(p.X0)} × ${f1(p.W0)} = ${f1(p.X0 * p.W0)}; T1 = ${f0(p.X1)} × ${f1(p.W1)} = ${f1(p.X1 * p.W1)}; I = ${f3((p.X1 * p.W1) / (p.X0 * p.W0))} = ${f3(p.X1 / p.X0)} × ${f3(p.W1 / p.W0)}.`,
      },
    },
  },
  3: {
    base: { NP: 400, dDeb: 260, dKr: 90, dZ: 30, Am: 70 },
    vary: (r) => {
      const NP = r.vary(400, 0.35, 0.1);
      return { NP, dDeb: r.vary(260, 0.4, 0.5), dKr: r.vary(90, 0.45, 0.5), dZ: r.vary(30, 0.5, 0.5), Am: r.vary(70, 0.4, 0.5) };
    },
    tasks: {
      "p3-1": {
        text: (p) => `Sof foyda ${f1(p.NP)} mln so'm. Yil davomida debitorlik qarzi ${f1(p.dDeb)} mln so'mga oshdi, kreditorlik qarzi ${f1(p.dKr)} mln so'mga oshdi, zaxiralar ${f1(p.dZ)} mln so'mga oshdi, amortizatsiya ${f1(p.Am)} mln so'm. Operatsion faoliyatdan sof pul oqimini bilvosita usulda toping.`,
        values: (p) => [p.NP + p.Am - p.dDeb + p.dKr - p.dZ],
        solution: (p) => `${f1(p.NP)} + ${f1(p.Am)} − ${f1(p.dDeb)} + ${f1(p.dKr)} − ${f1(p.dZ)} = ${f1(p.NP + p.Am - p.dDeb + p.dKr - p.dZ)} mln so'm.`,
      },
    },
  },
  4: {
    base: { LTA: 4200, CA: 5800, EQ: 6300, NP: 450, Div: 150 },
    vary: (r) => {
      const LTA = r.vary(4200, 0.3, 10);
      const CA = r.vary(5800, 0.3, 10);
      const NP = r.vary(450, 0.3, 1);
      return { LTA, CA, EQ: roundTo((LTA + CA) * r.between(0.5, 0.75, 0.001), 10), NP, Div: roundTo(NP * r.between(0.2, 0.5, 0.001), 1) };
    },
    tasks: {
      "p4-1": {
        text: (p) => `Uzoq muddatli aktivlar ${f0(p.LTA)} mln, joriy aktivlar ${f0(p.CA)} mln, o'z kapitali ${f0(p.EQ)} mln so'm. Jami aktivlar va majburiyatlarni toping.`,
        values: (p) => [p.LTA + p.CA, p.LTA + p.CA - p.EQ],
        solution: (p) => `Aktivlar = ${f0(p.LTA)} + ${f0(p.CA)} = ${f0(p.LTA + p.CA)}; Majburiyatlar = ${f0(p.LTA + p.CA)} − ${f0(p.EQ)} = ${f0(p.LTA + p.CA - p.EQ)} mln so'm.`,
      },
      "p4-2": {
        text: (p) => `Sof foyda ${f0(p.NP)} mln so'm, yil davomida ${f0(p.Div)} mln so'm dividend to'langan. Taqsimlanmagan foyda qanchaga oshishi kerak?`,
        values: (p) => [p.NP - p.Div],
        solution: (p) => `${f0(p.NP)} − ${f0(p.Div)} = ${f0(p.NP - p.Div)} mln so'm — xususiy kapital hisobotidagi o'zgarish bilan mos kelishi kerak.`,
      },
    },
  },
  5: {
    base: { AV0: 3500, AV1: 3850, AA0: 4600, AA1: 5200, D0: 800, D1: 1150, EQ0: 5000, EQ1: 5400, A0: 2400, A1: 2760, d0: 320, d1: 510, c0: 180, c1: 130 },
    vary: (r) => {
      const AV0 = r.vary(3500, 0.3, 50);
      const AA0 = r.vary(4600, 0.3, 50);
      const EQ0 = roundTo((AV0 + AA0) * r.between(0.55, 0.68, 0.01), 50);
      const D0 = roundTo(AA0 * r.between(0.14, 0.22, 0.01), 10);
      const A0 = r.vary(2400, 0.3, 20);
      const d0 = r.vary(320, 0.3, 10);
      const c0 = r.vary(180, 0.3, 10);
      return {
        AV0, AV1: roundTo(AV0 * r.between(1.04, 1.15, 0.01), 50), AA0, AA1: roundTo(AA0 * r.between(1.06, 1.18, 0.01), 50), D0, D1: roundTo(D0 * r.between(1.2, 1.55, 0.01), 10),
        EQ0, EQ1: roundTo(EQ0 * r.between(1.04, 1.12, 0.01), 50),
        A0, A1: roundTo(A0 * r.between(1.06, 1.2, 0.01), 10), d0, d1: roundTo(d0 * r.between(1.3, 1.7, 0.01), 10), c0, c1: roundTo(c0 * r.between(0.6, 0.9, 0.01), 5),
      };
    },
    tasks: {
      "p5-1": {
        text: (p) => `Yil boshida → yil oxirida (mln so'm): asosiy vositalar ${f0(p.AV0)} → ${f0(p.AV1)}; aylanma aktivlar ${f0(p.AA0)} → ${f0(p.AA1)}; debitorlik qarzi ${f0(p.D0)} → ${f0(p.D1)}; o'z kapitali ${f0(p.EQ0)} → ${f0(p.EQ1)}; majburiyatlar ${f0(p.AV0 + p.AA0 - p.EQ0)} → ${f0(p.AV1 + p.AA1 - p.EQ1)}. Debitorlik va majburiyatlarning o'sish sur'atini hamda yil oxiridagi balans jamini toping.`,
        values: (p) => [pct(p.D1, p.D0), pct(p.AV1 + p.AA1 - p.EQ1, p.AV0 + p.AA0 - p.EQ0), p.AV1 + p.AA1],
        solution: (p) => `Debitorlik: ${f0(p.D1)} / ${f0(p.D0)} = ${f2(pct(p.D1, p.D0))}%. Majburiyatlar: ${f0(p.AV1 + p.AA1 - p.EQ1)} / ${f0(p.AV0 + p.AA0 - p.EQ0)} = ${f2(pct(p.AV1 + p.AA1 - p.EQ1, p.AV0 + p.AA0 - p.EQ0))}%. Balans: ${f0(p.AV1)} + ${f0(p.AA1)} = ${f0(p.EQ1)} + ${f0(p.AV1 + p.AA1 - p.EQ1)} = ${f0(p.AV1 + p.AA1)} mln so'm.`,
      },
      "p5-2": {
        text: (p) => `Yil oxiri balans jami ${f0(p.AV1 + p.AA1)} mln so'm. Asosiy vositalar (${f0(p.AV1)}), debitorlik (${f0(p.D1)}) va o'z kapitalining (${f0(p.EQ1)}) ulushini hisoblang.`,
        values: (p) => [pct(p.AV1, p.AV1 + p.AA1), pct(p.D1, p.AV1 + p.AA1), pct(p.EQ1, p.AV1 + p.AA1)],
        solution: (p) => `${f0(p.AV1)} / ${f0(p.AV1 + p.AA1)} = ${f2(pct(p.AV1, p.AV1 + p.AA1))}%; ${f0(p.D1)} / ${f0(p.AV1 + p.AA1)} = ${f2(pct(p.D1, p.AV1 + p.AA1))}%; ${f0(p.EQ1)} / ${f0(p.AV1 + p.AA1)} = ${f2(pct(p.EQ1, p.AV1 + p.AA1))}% (yil boshida ${f1(pct(p.EQ0, p.AV0 + p.AA0))}%).`,
      },
      "p5-3": {
        text: (p) => `Jami aktivlar ${f0(p.A0)} → ${f0(p.A1)}; debitorlik ${f0(p.d0)} → ${f0(p.d1)}; pul mablag'lari ${f0(p.c0)} → ${f0(p.c1)} mln so'm. Uch ko'rsatkichning o'sish sur'atini toping.`,
        values: (p) => [pct(p.A1, p.A0), pct(p.d1, p.d0), pct(p.c1, p.c0)],
        solution: (p) => `${f0(p.A1)} / ${f0(p.A0)} = ${f1(pct(p.A1, p.A0))}%; ${f0(p.d1)} / ${f0(p.d0)} = ${f1(pct(p.d1, p.d0))}%; ${f0(p.c1)} / ${f0(p.c0)} = ${f1(pct(p.c1, p.c0))}%.`,
      },
    },
  },
  6: {
    base: { B: 2400, E: 720, Y0: 2650, In: 600, Out: 250, Q: 8400, P: 630, AV: 2100, Cap: 12000, Used: 8400 },
    vary: (r) => {
      const B = r.vary(2400, 0.3, 10);
      const Y0 = r.vary(2650, 0.3, 10);
      const AV = r.vary(2100, 0.3, 10);
      const Cap = r.vary(12000, 0.25, 100);
      return {
        B, E: roundTo(B * r.between(0.2, 0.45, 0.001), 1), Y0, In: roundTo(Y0 * r.between(0.12, 0.3, 0.001), 5), Out: roundTo(Y0 * r.between(0.05, 0.12, 0.001), 5),
        AV, Q: roundTo(AV * r.between(3, 5, 0.01), 10), P: roundTo(AV * r.between(0.2, 0.4, 0.001), 1), Cap, Used: roundTo(Cap * r.between(0.55, 0.9, 0.001), 10),
      };
    },
    tasks: {
      "p6-1": {
        text: (p) => `Asosiy vositalarning boshlang'ich qiymati ${f0(p.B)} mln so'm, jamg'arilgan eskirish ${f0(p.E)} mln so'm. Eskirish va yaroqlilik koeffitsiyentlarini (%) toping.`,
        values: (p) => [pct(p.E, p.B), pct(p.B - p.E, p.B)],
        solution: (p) => `Kesk = ${f0(p.E)} / ${f0(p.B)} = ${f2(pct(p.E, p.B))}%; Kyaroq = (${f0(p.B)} − ${f0(p.E)}) / ${f0(p.B)} = ${f2(pct(p.B - p.E, p.B))}%.`,
      },
      "p6-2": {
        text: (p) => `Yil boshida asosiy vositalar ${f0(p.Y0)} mln, yil davomida ${f0(p.In)} mln kiritildi, ${f0(p.Out)} mln chiqib ketdi, yil oxirida ${f0(p.Y0 + p.In - p.Out)} mln so'm. Yangilanish va chiqib ketish koeffitsiyentlarini toping.`,
        values: (p) => [pct(p.In, p.Y0 + p.In - p.Out), pct(p.Out, p.Y0)],
        solution: (p) => `Kyang = ${f0(p.In)} / ${f0(p.Y0 + p.In - p.Out)} = ${f2(pct(p.In, p.Y0 + p.In - p.Out))}%; Kchiq = ${f0(p.Out)} / ${f0(p.Y0)} = ${f2(pct(p.Out, p.Y0))}%.`,
      },
      "p6-3": {
        text: (p) => `Sotilgan xizmatlar hajmi ${f0(p.Q)} mln, foyda ${f0(p.P)} mln, asosiy vositalarning o'rtacha yillik qiymati ${f0(p.AV)} mln so'm. Fond qaytimi va asosiy vositalar rentabelligini toping.`,
        values: (p) => [p.Q / p.AV, pct(p.P, p.AV)],
        solution: (p) => `AVq = ${f0(p.Q)} / ${f0(p.AV)} = ${f2(p.Q / p.AV)} so'm/so'm; AVr = ${f0(p.P)} / ${f0(p.AV)} × 100 = ${f2(pct(p.P, p.AV))}%. Fond sig'imi = 1 / ${f2(p.Q / p.AV)} = ${f3(p.AV / p.Q)}.`,
      },
      "p6-4": {
        text: (p) => `Turistik transport korxonasida avtobuslarning texnik quvvati oyiga ${f0(p.Cap)} o'rindiq-km, amalda ${f0(p.Used)} o'rindiq-km ishlatilgan. Quvvatdan foydalanish koeffitsiyentini toping.`,
        values: (p) => [pct(p.Used, p.Cap)],
        solution: (p) => `${f0(p.Used)} / ${f0(p.Cap)} = ${f2(pct(p.Used, p.Cap))}%; ${f2(100 - pct(p.Used, p.Cap))}% quvvat bo'sh.`,
      },
    },
  },
  7: {
    base: { NA0: 260, NA1: 340, TA: 9500, Esk: 68, Q: 7500, D: 960, F: 615, a0: 0.72, a1: 0.697, b0: 11.15, b1: 12.5, c0: 21.6, c1: 25.6 },
    vary: (r) => {
      const NA0 = r.vary(260, 0.3, 10);
      const NA1 = roundTo(NA0 * r.between(1.1, 1.4, 0.01), 10);
      const NAo = (NA0 + NA1) / 2;
      const Q = roundTo(NAo * r.between(18, 30, 0.5), 50);
      const D = roundTo(Q * r.between(0.1, 0.16, 0.005), 5);
      return {
        NA0, NA1, TA: r.vary(9500, 0.25, 100), Esk: roundTo(NA1 * r.between(0.12, 0.3, 0.01), 1), Q, D, F: roundTo(D * r.between(0.55, 0.75, 0.01), 5),
        a0: r.vary(0.72, 0.08, 0.001), a1: r.vary(0.697, 0.08, 0.001), b0: r.vary(11.15, 0.15, 0.05), b1: r.vary(12.5, 0.15, 0.05), c0: r.vary(21.6, 0.15, 0.1), c1: r.vary(25.6, 0.15, 0.1),
      };
    },
    tasks: {
      "p7-1": {
        text: (p) => `Nomoddiy aktivlar (NA) yil boshida ${f0(p.NA0)} mln, yil oxirida ${f0(p.NA1)} mln so'm; yil oxiri jami aktivlar ${f0(p.TA)} mln; NA eskirishi ${f0(p.Esk)} mln so'm. O'rtacha yillik qiymat, aktivlardagi ulush va eskirish koeffitsiyentini toping.`,
        values: (p) => [(p.NA0 + p.NA1) / 2, pct(p.NA1, p.TA), pct(p.Esk, p.NA1)],
        solution: (p) => `NAo'r = (${f0(p.NA0)} + ${f0(p.NA1)}) / 2 = ${f1((p.NA0 + p.NA1) / 2)}; ulush = ${f0(p.NA1)} / ${f0(p.TA)} = ${f2(pct(p.NA1, p.TA))}%; Kesk = ${f0(p.Esk)} / ${f0(p.NA1)} = ${f2(pct(p.Esk, p.NA1))}%.`,
      },
      "p7-2": {
        text: (p) => `NA o'rtacha yillik qiymati ${f1((p.NA0 + p.NA1) / 2)} mln, xizmat sotish hajmi ${f0(p.Q)} mln, daromad ${f0(p.D)} mln, foyda ${f0(p.F)} mln so'm. Aylanuvchanlik, daromadlilik va rentabellikni toping.`,
        values: (p) => [p.Q / ((p.NA0 + p.NA1) / 2), p.D / ((p.NA0 + p.NA1) / 2), p.F / ((p.NA0 + p.NA1) / 2)],
        solution: (p) => {
          const n = (p.NA0 + p.NA1) / 2;
          return `QNA = ${f0(p.Q)} / ${f1(n)} = ${f2(p.Q / n)}; DNA = ${f0(p.D)} / ${f1(n)} = ${f2(p.D / n)}; RNA = ${f0(p.F)} / ${f1(n)} = ${f2(p.F / n)}.`;
        },
      },
      "p7-3": {
        text: (p) => `RNA = (F/D) × (D/Q) × (Q/NA). Foydaning daromaddagi hissasi ${fx(p.a0, 3)} → ${fx(p.a1, 3)}; sotish daromadliligi (D/Q, %) ${fx(p.b0, 2)} → ${fx(p.b1, 2)}; NA aylanuvchanligi ${fx(p.c0, 1)} → ${fx(p.c1, 1)}. Zanjirli almashtirish usulida omillar ta'sirini (nisbiy birlikda) toping.`,
        values: (p) => [((p.a1 - p.a0) * p.b0 * p.c0) / 100, (p.a1 * (p.b1 - p.b0) * p.c0) / 100, (p.a1 * p.b1 * (p.c1 - p.c0)) / 100],
        solution: (p) => `F/D: (${f3(p.a1)} − ${f3(p.a0)}) × ${f3(p.b0 / 100)} × ${f1(p.c0)} = ${f3(((p.a1 - p.a0) * p.b0 * p.c0) / 100)}; D/Q: ${f3(p.a1)} × (${f3(p.b1 / 100)} − ${f3(p.b0 / 100)}) × ${f1(p.c0)} = ${f3((p.a1 * (p.b1 - p.b0) * p.c0) / 100)}; aylanuvchanlik: ${f3(p.a1)} × ${f3(p.b1 / 100)} × (${f1(p.c1)} − ${f1(p.c0)}) = ${f3((p.a1 * p.b1 * (p.c1 - p.c0)) / 100)}.`,
      },
    },
  },
  8: {
    base: { Z: 2400, Db: 1200, C: 600, O: 300, Rev: 9000, AM: 3000, D0: 72, D1: 60, Rev3: 10800, EQ: 6400, UMM: 1000, LTA: 5200, CA: 4000 },
    vary: (r) => {
      const AM = r.vary(3000, 0.3, 10);
      const Rev3 = r.int(20, 60) * 360;
      const D0 = r.int(60, 90);
      const LTA = r.vary(5200, 0.25, 10);
      const CA = r.vary(4000, 0.25, 10);
      return {
        Z: r.vary(2400, 0.3, 5), Db: r.vary(1200, 0.3, 5), C: r.vary(600, 0.3, 5), O: r.vary(300, 0.4, 5),
        AM, Rev: roundTo(AM * r.between(2.4, 4.5, 0.01), 10), D0, D1: D0 - r.int(6, 18), Rev3,
        EQ: roundTo(LTA * r.between(1.05, 1.3, 0.001), 10), UMM: r.vary(1000, 0.4, 10), LTA, CA,
      };
    },
    tasks: {
      "p8-1": {
        text: (p) => `Zaxiralar ${f0(p.Z)} mln, debitorlik ${f0(p.Db)} mln, pul ${f0(p.C)} mln, boshqa joriy aktivlar ${f0(p.O)} mln so'm. Jami aylanma aktivlar va zaxiralar ulushini toping.`,
        values: (p) => [p.Z + p.Db + p.C + p.O, pct(p.Z, p.Z + p.Db + p.C + p.O)],
        solution: (p) => `${f0(p.Z)} + ${f0(p.Db)} + ${f0(p.C)} + ${f0(p.O)} = ${f0(p.Z + p.Db + p.C + p.O)} mln so'm; zaxiralar ${f2(pct(p.Z, p.Z + p.Db + p.C + p.O))}%.`,
      },
      "p8-2": {
        text: (p) => `Yillik sof tushum ${f0(p.Rev)} mln, aylanma mablag'larning o'rtacha yillik qiymati ${f0(p.AM)} mln so'm. Aylanish koeffitsiyenti va bir aylanish davomiyligini (360 kun) toping.`,
        values: (p) => [p.Rev / p.AM, 360 / (p.Rev / p.AM)],
        solution: (p) => `Kayl = ${f0(p.Rev)} / ${f0(p.AM)} = ${f2(p.Rev / p.AM)}; D = 360 / ${f2(p.Rev / p.AM)} = ${f1(360 / (p.Rev / p.AM))} kun.`,
      },
      "p8-3": {
        text: (p) => `Aylanish davri ${f0(p.D0)} kundan ${f0(p.D1)} kunga qisqardi. Yillik tushum ${f0(p.Rev3)} mln so'm. Bo'shagan mablag'ni toping.`,
        values: (p) => [p.Rev3 / 360, (p.Rev3 / 360) * (p.D0 - p.D1)],
        solution: (p) => `Kunlik tushum = ${f0(p.Rev3)} / 360 = ${f1(p.Rev3 / 360)}; bo'shash = ${f1(p.Rev3 / 360)} × (${f0(p.D0)} − ${f0(p.D1)}) = ${f1((p.Rev3 / 360) * (p.D0 - p.D1))} mln so'm.`,
      },
      "p8-4": {
        text: (p) => `O'z kapitali ${f0(p.EQ)} mln, uzoq muddatli majburiyatlar ${f0(p.UMM)} mln, uzoq muddatli aktivlar ${f0(p.LTA)} mln, joriy aktivlar ${f0(p.CA)} mln so'm. O'z aylanma mablag'ini va u bilan ta'minlanganlik koeffitsiyentini toping.`,
        values: (p) => [p.EQ + p.UMM - p.LTA, (p.EQ + p.UMM - p.LTA) / p.CA],
        solution: (p) => `O'AM = ${f0(p.EQ)} + ${f0(p.UMM)} − ${f0(p.LTA)} = ${f0(p.EQ + p.UMM - p.LTA)}; Kta'm = ${f0(p.EQ + p.UMM - p.LTA)} / ${f0(p.CA)} = ${f3((p.EQ + p.UMM - p.LTA) / p.CA)} (me'yor ≥ 0,1).`,
      },
    },
  },
  9: {
    base: { TA: 12000, UM: 2600, QK: 1500, Kr: 1300, AA: 6800 },
    vary: (r) => ({ TA: r.vary(12000, 0.25, 10), UM: r.vary(2600, 0.3, 10), QK: r.vary(1500, 0.3, 5), Kr: r.vary(1300, 0.3, 10), AA: r.vary(6800, 0.25, 10) }),
    tasks: {
      "p9-1": {
        text: (p) => `Balans jami ${f0(p.TA)} mln, jami majburiyatlar ${f0(p.UM + p.QK + p.Kr)} mln so'm. Umumiy to'planish koeffitsiyentini toping.`,
        values: (p) => [(p.UM + p.QK + p.Kr) / p.TA],
        solution: (p) => `${f0(p.UM + p.QK + p.Kr)} / ${f0(p.TA)} = ${f3((p.UM + p.QK + p.Kr) / p.TA)} — aktivlarning ${f1(pct(p.UM + p.QK + p.Kr, p.TA))}% i qarz hisobidan.`,
      },
      "p9-2": {
        text: (p) => `Majburiyatlar: uzoq muddatli ${f0(p.UM)} mln, qisqa muddatli kredit ${f0(p.QK)} mln, kreditorlik ${f0(p.Kr)} mln so'm. Har birining ulushini (%) toping.`,
        values: (p) => [pct(p.UM, p.UM + p.QK + p.Kr), pct(p.QK, p.UM + p.QK + p.Kr), pct(p.Kr, p.UM + p.QK + p.Kr)],
        solution: (p) => {
          const s = p.UM + p.QK + p.Kr;
          return `Jami ${f0(s)}: ${f0(p.UM)} / ${f0(s)} = ${f2(pct(p.UM, s))}%; ${f0(p.QK)} / ${f0(s)} = ${f2(pct(p.QK, s))}%; ${f0(p.Kr)} / ${f0(s)} = ${f2(pct(p.Kr, s))}%.`;
        },
      },
      "p9-3": {
        text: (p) => `Aylanma aktivlar ${f0(p.AA)} mln, qisqa muddatli qarz ${f0(p.QK)} mln so'm. Qisqa muddatli mablag'larning aylanma aktivlardagi hissasini toping.`,
        values: (p) => [p.QK / p.AA],
        solution: (p) => `${f0(p.QK)} / ${f0(p.AA)} = ${f3(p.QK / p.AA)}.`,
      },
    },
  },
  10: {
    base: { Deb: 4200, DebO: 1260, Kr: 5000, KrO: 1100, TA: 15000, AA: 8000, Rev: 25200 },
    vary: (r) => {
      const Deb = r.vary(4200, 0.25, 10);
      const Kr = r.vary(5000, 0.25, 10);
      const AA = roundTo(Deb * r.between(1.6, 2.4, 0.001), 10);
      return { Deb, DebO: roundTo(Deb * r.between(0.15, 0.4, 0.001), 5), Kr, KrO: roundTo(Kr * r.between(0.12, 0.3, 0.001), 5), TA: roundTo(AA * r.between(1.6, 2.2, 0.001), 10), AA, Rev: roundTo(Deb * r.between(4, 9, 0.001), 10) };
    },
    tasks: {
      "p10-1": {
        text: (p) => `Jami debitorlik ${f0(p.Deb)} mln, muddati o'tgan qismi ${f0(p.DebO)} mln; jami kreditorlik ${f0(p.Kr)} mln, muddati o'tgan qismi ${f0(p.KrO)} mln so'm. Ikkala ulushni toping.`,
        values: (p) => [pct(p.DebO, p.Deb), pct(p.KrO, p.Kr)],
        solution: (p) => `${f0(p.DebO)} / ${f0(p.Deb)} = ${f2(pct(p.DebO, p.Deb))}%; ${f0(p.KrO)} / ${f0(p.Kr)} = ${f2(pct(p.KrO, p.Kr))}%.`,
      },
      "p10-2": {
        text: (p) => `Kreditorlik ${f0(p.Kr)} mln, debitorlik ${f0(p.Deb)} mln so'm. Kreditorlik/debitorlik nisbatini toping.`,
        values: (p) => [p.Kr / p.Deb],
        solution: (p) => `${f0(p.Kr)} / ${f0(p.Deb)} = ${f3(p.Kr / p.Deb)}${p.Kr > p.Deb ? " > 1: firma o'z debitorlaridan oladiganidan ko'proq qarzdor." : " < 1: debitorlik kreditorlikdan ko'p."}`,
      },
      "p10-3": {
        text: (p) => `Debitorlik ${f0(p.Deb)} mln, jami aktivlar ${f0(p.TA)} mln, aylanma aktivlar ${f0(p.AA)} mln so'm. Sarmoya va aylanma mablag'larni immobilizatsiyalash koeffitsiyentlarini toping.`,
        values: (p) => [p.Deb / p.TA, p.Deb / p.AA],
        solution: (p) => `${f0(p.Deb)} / ${f0(p.TA)} = ${f3(p.Deb / p.TA)}; ${f0(p.Deb)} / ${f0(p.AA)} = ${f3(p.Deb / p.AA)}.`,
      },
      "p10-4": {
        text: (p) => `Yillik sof tushum ${f0(p.Rev)} mln, debitorlik qarzining o'rtacha qiymati ${f0(p.Deb)} mln so'm. Aylanish koeffitsiyenti va davrini (360 kun) toping.`,
        values: (p) => [p.Rev / p.Deb, 360 / (p.Rev / p.Deb)],
        solution: (p) => `${f0(p.Rev)} / ${f0(p.Deb)} = ${f2(p.Rev / p.Deb)}; 360 / ${f2(p.Rev / p.Deb)} = ${f1(360 / (p.Rev / p.Deb))} kun.`,
      },
    },
  },
  11: {
    base: { OI: 2500, OO: 2300, II: 100, IO: 350, FI: 400, FO: 180, S: 1200, C: 1050 },
    vary: (r) => {
      const OI = r.vary(2500, 0.25, 10);
      const S = r.vary(1200, 0.3, 5);
      return { OI, OO: roundTo(OI * r.between(0.85, 0.96, 0.001), 5), II: r.vary(100, 0.5, 5), IO: r.vary(350, 0.35, 5), FI: r.vary(400, 0.35, 5), FO: r.vary(180, 0.4, 5), S, C: roundTo(S * r.between(0.78, 0.95, 0.001), 1) };
    },
    tasks: {
      "p11-1": {
        text: (p) => `Operatsion kirim ${f0(p.OI)}, chiqim ${f0(p.OO)}; investitsion kirim ${f0(p.II)}, chiqim ${f0(p.IO)}; moliyaviy kirim ${f0(p.FI)}, chiqim ${f0(p.FO)} mln so'm. Har bir faoliyat va jami sof pul oqimini toping.`,
        values: (p) => [p.OI - p.OO, p.II - p.IO, p.FI - p.FO, p.OI - p.OO + p.II - p.IO + p.FI - p.FO],
        solution: (p) => `${sgn(p.OI - p.OO, 0)}; ${sgn(p.II - p.IO, 0)}; ${sgn(p.FI - p.FO, 0)}; jami ${sgn(p.OI - p.OO + p.II - p.IO + p.FI - p.FO, 0)} mln so'm.`,
      },
      "p11-2": {
        text: (p) => `Jami pul tushumi ${f0(p.OI + p.II + p.FI)} mln, jami chiqim ${f0(p.OO + p.IO + p.FO)} mln so'm. Koeffitsiyentni toping.`,
        values: (p) => [(p.OI + p.II + p.FI) / (p.OO + p.IO + p.FO)],
        solution: (p) => `${f0(p.OI + p.II + p.FI)} / ${f0(p.OO + p.IO + p.FO)} = ${f3((p.OI + p.II + p.FI) / (p.OO + p.IO + p.FO))}.`,
      },
      "p11-3": {
        text: (p) => `Sof sotish ${f0(p.S)} mln, xaridorlardan real pul tushumi ${f0(p.C)} mln so'm. Daromadlarning tushish koeffitsiyentini toping.`,
        values: (p) => [p.C / p.S],
        solution: (p) => `${f0(p.C)} / ${f0(p.S)} = ${f3(p.C / p.S)}; ${f0(p.S - p.C)} mln so'm farq debitorlik qarzining oshishi bilan bog'liq.`,
      },
    },
  },
  12: {
    base: { CA: 6000, CL: 2800, Cash: 500, Deb: 1500, Over: 300 },
    vary: (r) => {
      const CL = r.vary(2800, 0.25, 10);
      const Deb = r.vary(1500, 0.3, 10);
      return { CA: roundTo(CL * r.between(1.3, 2.6, 0.001), 10), CL, Cash: r.vary(500, 0.35, 5), Deb, Over: roundTo(Deb * r.between(0.1, 0.3, 0.001), 5) };
    },
    tasks: {
      "p12-1": {
        text: (p) => `Joriy aktivlar ${f0(p.CA)} mln, joriy majburiyatlar ${f0(p.CL)} mln so'm.`,
        values: (p) => [p.CA / p.CL],
        solution: (p) => `${f0(p.CA)} / ${f0(p.CL)} = ${f2(p.CA / p.CL)} (tavsiya ≥ 1,5–2).`,
      },
      "p12-2": {
        text: (p) => `Pul ${f0(p.Cash)} mln, debitorlik ${f0(p.Deb)} mln (shundan muddati o'tgan ${f0(p.Over)} mln), joriy majburiyatlar ${f0(p.CL)} mln so'm. Kitobdagi formula bo'yicha toping.`,
        values: (p) => [(p.Cash + p.Deb - p.Over) / p.CL],
        solution: (p) => `(${f0(p.Cash)} + ${f0(p.Deb)} − ${f0(p.Over)}) / ${f0(p.CL)} = ${f3((p.Cash + p.Deb - p.Over) / p.CL)} (tavsiya ≈ 0,7–1).`,
      },
      "p12-3": {
        text: (p) => `Pul mablag'lari ${f0(p.Cash)} mln, joriy majburiyatlar ${f0(p.CL)} mln so'm.`,
        values: (p) => [p.Cash / p.CL],
        solution: (p) => `${f0(p.Cash)} / ${f0(p.CL)} = ${f3(p.Cash / p.CL)} (tavsiya 0,2–0,25).`,
      },
    },
  },
  13: {
    base: { Rev: 7500, Cost: 6100, Sell: 280, Adm: 210, Oth: 90, Fin: 120, Ext: -20, R0: 5000, R1: 6200, C0: 4100, C1: 4900 },
    vary: (r) => {
      const Rev = r.vary(7500, 0.25, 10);
      const R0 = r.vary(5000, 0.25, 10);
      const C0 = roundTo(R0 * r.between(0.76, 0.86, 0.001), 10);
      return {
        Rev, Cost: roundTo(Rev * r.between(0.74, 0.84, 0.001), 5), Sell: r.vary(280, 0.3, 1), Adm: r.vary(210, 0.3, 1), Oth: r.vary(90, 0.4, 1), Fin: r.vary(120, 0.5, 1), Ext: -r.int(5, 60),
        R0, R1: roundTo(R0 * r.between(1.1, 1.3, 0.001), 10), C0, C1: roundTo(C0 * r.between(1.05, 1.22, 0.001), 10),
      };
    },
    tasks: {
      "p13-1": {
        text: (p) => `Sof tushum ${f0(p.Rev)} mln, tannarx ${f0(p.Cost)} mln; sotish xarajatlari ${f0(p.Sell)} mln, ma'muriy xarajatlar ${f0(p.Adm)} mln, boshqa operatsion daromadlar ${f0(p.Oth)} mln so'm.`,
        values: (p) => [p.Rev - p.Cost, p.Rev - p.Cost - p.Sell - p.Adm + p.Oth],
        solution: (p) => `${f0(p.Rev)} − ${f0(p.Cost)} = ${f0(p.Rev - p.Cost)}; ${f0(p.Rev - p.Cost)} − ${f0(p.Sell)} − ${f0(p.Adm)} + ${f0(p.Oth)} = ${f0(p.Rev - p.Cost - p.Sell - p.Adm + p.Oth)} mln so'm.`,
      },
      "p13-2": {
        text: (p) => `Asosiy faoliyat foydasi ${f0(p.Rev - p.Cost - p.Sell - p.Adm + p.Oth)} mln; moliyaviy faoliyat natijasi ${sgn(p.Fin, 0)} mln; boshqa (favqulodda) natija ${sgn(p.Ext, 0)} mln; foyda solig'i 15%.`,
        values: (p) => {
          const b = p.Rev - p.Cost - p.Sell - p.Adm + p.Oth + p.Fin + p.Ext;
          return [b, b * 0.15, b * 0.85];
        },
        solution: (p) => {
          const a = p.Rev - p.Cost - p.Sell - p.Adm + p.Oth;
          const b = a + p.Fin + p.Ext;
          return `${f0(a)} ${sgn(p.Fin, 0)} ${sgn(p.Ext, 0)} = ${f0(b)}; soliq ${f0(b)} × 15% = ${f1(b * 0.15)}; sof foyda ${f1(b * 0.85)} mln so'm.`;
        },
      },
      "p13-3": {
        text: (p) => `Sof tushum ${f0(p.R0)} → ${f0(p.R1)} mln, tannarx ${f0(p.C0)} → ${f0(p.C1)} mln so'm. O'sish sur'atlari va yalpi marjani toping.`,
        values: (p) => [pct(p.R1, p.R0), pct(p.C1, p.C0), pct(p.R1 - p.C1, p.R1)],
        solution: (p) => `${f0(p.R1)} / ${f0(p.R0)} = ${f1(pct(p.R1, p.R0))}%; ${f0(p.C1)} / ${f0(p.C0)} = ${f1(pct(p.C1, p.C0))}%; marja (${f0(p.R1)} − ${f0(p.C1)}) / ${f0(p.R1)} = ${f2(pct(p.R1 - p.C1, p.R1))}% (o'tgan yil ${f1(pct(p.R0 - p.C0, p.R0))}%).`,
      },
    },
  },
  14: {
    base: { M: 2000, c: 1300, P0: 40, P1: 54, sg: 28, a0: 8, b0: 1400, c0: 0.6, d0: 50, a1: 9, b1: 1450, c1: 0.63, d1: 55 },
    vary: (r) => {
      const M = r.vary(2000, 0.3, 5);
      const P0 = r.int(30, 90);
      const P1 = P0 + r.int(6, 30);
      const pg = (P1 / P0 - 1) * 100;
      const a0 = r.int(6, 12);
      const b0 = r.vary(1400, 0.25, 10);
      const c0 = r.vary(0.6, 0.15, 0.01);
      const d0 = r.int(40, 60);
      return {
        M, c: roundTo(M * r.between(0.55, 0.75, 0.001), 1), P0, P1, sg: Math.max(1, Math.round(pg * r.between(0.55, 0.9, 0.01))),
        a0, b0, c0, d0, a1: a0 + r.int(1, 2), b1: b0 + r.int(2, 10) * 10, c1: roundTo(c0 + r.pick([0.01, 0.02, 0.03, 0.04]), 0.01), d1: d0 + r.int(2, 8),
      };
    },
    tasks: {
      "p14-1": {
        text: (p) => `Yalpi mahsulot ${f0(p.M)} mln, sarflangan ishlab chiqarish vositalari ${f0(p.c)} mln so'm.`,
        values: (p) => [p.M - p.c],
        solution: (p) => `YD = M − c = ${f0(p.M)} − ${f0(p.c)} = ${f0(p.M - p.c)} mln so'm (= v + m).`,
      },
      "p14-2": {
        text: (p) => `Foyda ${f0(p.P0)} mln dan ${f0(p.P1)} mln ga oshdi. Sof tushum o'sish sur'ati ${f0(p.sg)}%, foyda o'sish sur'ati ${f2((p.P1 / p.P0 - 1) * 100)}%. Sof tushum va rentabellikning foyda o'sishidagi ulushini (%) toping.`,
        values: (p) => {
          const s = (p.sg / ((p.P1 / p.P0 - 1) * 100)) * 100;
          return [s, 100 - s];
        },
        solution: (p) => {
          const pg = (p.P1 / p.P0 - 1) * 100;
          const s = (p.sg / pg) * 100;
          return `${f0(p.sg)} / ${f2(pg)} = ${f2(s)}%; 100 − ${f2(s)} = ${f2(100 - s)}%. Mutlaq: ${f0(p.P1 - p.P0)} × ${f3(s / 100)} = ${f2(((p.P1 - p.P0) * s) / 100)} mln va ${f2(((p.P1 - p.P0) * (100 - s)) / 100)} mln so'm.`;
        },
      },
      "p14-3": {
        text: (p) => `M = a × b × c × d (ming so'm). Reja: a=${f0(p.a0)} guruh, b=${f0(p.b0)} turist, c=${fx(p.c0, 2)}, d=${f0(p.d0)}. Haqiqat: a=${f0(p.a1)}, b=${f0(p.b1)}, c=${fx(p.c1, 2)}, d=${f0(p.d1)}. Har bir omil ta'sirini zanjirli almashtirish bilan toping.`,
        values: (p) => [(p.a1 - p.a0) * p.b0 * p.c0 * p.d0, p.a1 * (p.b1 - p.b0) * p.c0 * p.d0, p.a1 * p.b1 * (p.c1 - p.c0) * p.d0, p.a1 * p.b1 * p.c1 * (p.d1 - p.d0)],
        solution: (p) => {
          const m0 = p.a0 * p.b0 * p.c0 * p.d0, m1 = p.a1 * p.b0 * p.c0 * p.d0, m2 = p.a1 * p.b1 * p.c0 * p.d0, m3 = p.a1 * p.b1 * p.c1 * p.d0, m4 = p.a1 * p.b1 * p.c1 * p.d1;
          return `M0 = ${f1(m0)}; a → ${f1(m1)} (${sgn(m1 - m0, 1)}); b → ${f1(m2)} (${sgn(m2 - m1, 1)}); c → ${f1(m3)} (${sgn(m3 - m2, 1)}); d → ${f1(m4)} (${sgn(m4 - m3, 1)}); jami ${sgn(m4 - m0, 1)} ming so'm.`;
        },
      },
    },
  },
  15: {
    base: { NP1: 72, Cost: 900, NP: 180, Rev: 2400, TA: 3000, EQ: 1500 },
    vary: (r) => {
      const Cost = r.vary(900, 0.3, 1);
      const TA = r.vary(3000, 0.25, 10);
      const Rev = roundTo(TA * r.between(0.6, 1.2, 0.001), 10);
      return { NP1: roundTo(Cost * r.between(0.05, 0.12, 0.001), 1), Cost, NP: roundTo(Rev * r.between(0.05, 0.1, 0.001), 1), Rev, TA, EQ: roundTo(TA * r.between(0.4, 0.65, 0.001), 10) };
    },
    tasks: {
      "p15-1": {
        text: (p) => `Sof foyda ${f0(p.NP1)} mln, xizmatlar tannarxi ${f0(p.Cost)} mln so'm.`,
        values: (p) => [pct(p.NP1, p.Cost)],
        solution: (p) => `${f0(p.NP1)} / ${f0(p.Cost)} × 100 = ${f2(pct(p.NP1, p.Cost))}%.`,
      },
      "p15-2": {
        text: (p) => `Sof foyda ${f0(p.NP)} mln, sof tushum ${f0(p.Rev)} mln, jami aktivlar ${f0(p.TA)} mln, o'z kapitalining o'rtacha qiymati ${f0(p.EQ)} mln so'm.`,
        values: (p) => [pct(p.NP, p.Rev), pct(p.NP, p.TA), pct(p.NP, p.EQ)],
        solution: (p) => `${f0(p.NP)} / ${f0(p.Rev)} = ${f2(pct(p.NP, p.Rev))}%; ${f0(p.NP)} / ${f0(p.TA)} = ${f2(pct(p.NP, p.TA))}%; ${f0(p.NP)} / ${f0(p.EQ)} = ${f2(pct(p.NP, p.EQ))}%. ROE > ROA — moliyaviy leverej ijobiy ishlayapti.`,
      },
      "p15-3": {
        text: () => "Yuqoridagi ma'lumotlar bo'yicha aktivlar aylanishi va moliyaviy leverej (aktivlar/o'z kapitali) ni toping; ROE = ROS × aylanish × leverej ekanini tekshiring.",
        values: (p) => [p.Rev / p.TA, p.TA / p.EQ],
        solution: (p) => `${f0(p.Rev)} / ${f0(p.TA)} = ${f3(p.Rev / p.TA)}; ${f0(p.TA)} / ${f0(p.EQ)} = ${f3(p.TA / p.EQ)}; ${f2(pct(p.NP, p.Rev))}% × ${f3(p.Rev / p.TA)} × ${f3(p.TA / p.EQ)} = ${f2(pct(p.NP, p.EQ))}% = ROE.`,
      },
    },
  },
  16: {
    base: { Rev: 17416.5, Var: 8132.5, Fix: 7631.3, U: 2342.3, m: 0.9, N: 100, K: 50, price: 3 },
    vary: (r) => {
      const Rev = r.vary(17416.5, 0.25, 0.1);
      const Var = roundTo(Rev * r.between(0.4, 0.52, 0.001), 0.1);
      const Md = Rev - Var;
      const m = r.pick([0.6, 0.7, 0.75, 0.8, 0.9, 1, 1.2]);
      return { Rev, Var, Fix: roundTo(Md * r.between(0.72, 0.9, 0.001), 0.1), U: r.vary(2342.3, 0.25, 0.1), m, N: r.int(60, 160), K: r.int(20, 90), price: r.pick([2.5, 2.8, 3, 3.2, 3.5, 4]) };
    },
    tasks: {
      "p16-1": {
        text: (p) => `Tushum ${f1(p.Rev)} ming so'm, o'zgaruvchan xarajat ${f1(p.Var)} ming, doimiy xarajat ${f1(p.Fix)} ming so'm.`,
        values: (p) => [p.Rev - p.Var, p.Rev - p.Var - p.Fix],
        solution: (p) => `Md = ${f1(p.Rev)} − ${f1(p.Var)} = ${f1(p.Rev - p.Var)}; F = ${f1(p.Rev - p.Var)} − ${f1(p.Fix)} = ${f1(p.Rev - p.Var - p.Fix)}.`,
      },
      "p16-2": {
        text: () => "Yuqoridagi ma'lumotlar bo'yicha zararsizlik tushumini, doimiy xarajatlarning marjinal daromaddagi ulushini va xavfsizlik zaxirasini (%) toping.",
        values: (p) => {
          const Md = p.Rev - p.Var;
          const Zn = (p.Rev * p.Fix) / Md;
          return [Zn, pct(p.Fix, Md), pct(p.Rev - Zn, p.Rev)];
        },
        solution: (p) => {
          const Md = p.Rev - p.Var;
          const Zn = (p.Rev * p.Fix) / Md;
          return `Zn = ${f1(p.Rev)} × ${f1(p.Fix)} / ${f1(Md)} = ${f1(Zn)}; ${f1(p.Fix)} / ${f1(Md)} = ${f1(pct(p.Fix, Md))}%; xavfsizlik zaxirasi = (${f1(p.Rev)} − ${f1(Zn)}) / ${f1(p.Rev)} = ${f1(pct(p.Rev - Zn, p.Rev))}%.`;
        },
      },
      "p16-3": {
        text: (p) => `Sotilgan xizmatlar ${f1(p.U)} birlik. Bir birlik marjinal daromadi va natural zararsizlik miqdorini toping.`,
        values: (p) => {
          const u = (p.Rev - p.Var) / p.U;
          return [u, p.Fix / u];
        },
        solution: (p) => {
          const u = (p.Rev - p.Var) / p.U;
          return `${f1(p.Rev - p.Var)} / ${f1(p.U)} = ${f3(u)}; ${f1(p.Fix)} / ${f3(u)} = ${f1(p.Fix / u)} birlik.`;
        },
      },
      "p16-4": {
        text: (p) => `Turpaket narxi ${f0(p.price * 1e6)} so'm, o'zgaruvchan xarajat ${f0((p.price - p.m) * 1e6)} so'm, mavsumiy doimiy xarajat ${f2(p.N * p.m)} mln so'm. Zararsizlik turistlar soni va ${f2(p.K * p.m)} mln maqsadli foyda uchun turistlar soni.`,
        values: (p) => [p.N, p.N + p.K],
        solution: (p) => `Bir turistdan marjinal daromad ${f2(p.m)} mln; ${f2(p.N * p.m)} / ${f2(p.m)} = ${f0(p.N)} turist; (${f2(p.N * p.m)} + ${f2(p.K * p.m)}) / ${f2(p.m)} = ${f0(p.N + p.K)} turist.`,
      },
    },
  },
  17: {
    base: { AA: 6000, LTA: 3700, Maj: 5200, QM: 850, UM: 2700, Loan: 1200, mg: 4 },
    vary: (r) => {
      const AA = r.vary(6000, 0.25, 10);
      const LTA = r.vary(3700, 0.25, 10);
      const UM = roundTo(LTA * r.between(0.5, 0.85, 0.001), 5);
      const Maj = roundTo(UM + AA * r.between(0.3, 0.5, 0.001), 5);
      return { AA, LTA, Maj, QM: roundTo(AA * r.between(0.1, 0.2, 0.001), 5), UM, Loan: r.vary(1200, 0.4, 10), mg: r.pick([2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6]) };
    },
    tasks: {
      "p17-1": {
        text: (p) => `Balans jami ${f0(p.AA + p.LTA)}; jami jalb qilingan mablag' ${f0(p.Maj)}; qisqa muddatli ${f0(p.QM)}; uzoq muddatli ${f0(p.UM)} mln so'm.`,
        values: (p) => [p.Maj / (p.AA + p.LTA), p.QM / (p.AA + p.LTA), p.UM / (p.AA + p.LTA)],
        solution: (p) => {
          const b = p.AA + p.LTA;
          return `${f0(p.Maj)} / ${f0(b)} = ${f3(p.Maj / b)}; ${f0(p.QM)} / ${f0(b)} = ${f3(p.QM / b)}; ${f0(p.UM)} / ${f0(b)} = ${f3(p.UM / b)}.`;
        },
      },
      "p17-2": {
        text: (p) => `Aylanma aktivlar ${f0(p.AA)} mln, uzoq muddatli aktivlar ${f0(p.LTA)} mln so'm (qisqa muddatli ${f0(p.QM)}, uzoq muddatli ${f0(p.UM)}).`,
        values: (p) => [p.QM / p.AA, p.UM / p.LTA],
        solution: (p) => `${f0(p.QM)} / ${f0(p.AA)} = ${f3(p.QM / p.AA)}; ${f0(p.UM)} / ${f0(p.LTA)} = ${f3(p.UM / p.LTA)}.`,
      },
      "p17-3": {
        text: (p) => `Jami majburiyat ${f0(p.Maj)} mln, uzoq muddatli qismi ${f0(p.UM)} mln, aylanma aktivlar ${f0(p.AA)} mln so'm.`,
        values: (p) => [p.Maj - p.UM, (p.Maj - p.UM) / p.AA],
        solution: (p) => `${f0(p.Maj)} − ${f0(p.UM)} = ${f0(p.Maj - p.UM)}; ${f0(p.Maj - p.UM)} / ${f0(p.AA)} = ${f3((p.Maj - p.UM) / p.AA)}.`,
      },
      "p17-4": {
        text: (p) => `Firma ${f0(p.Loan)} mln so'm kreditni Markaziy bank asosiy stavkasi (14%) + ${f1(p.mg)} foiz punkt marja bilan oldi. Yillik foiz xarajati va foyda solig'i (15%) tejalgandan keyingi samarali stavka.`,
        values: (p) => [(p.Loan * (14 + p.mg)) / 100, (14 + p.mg) * 0.85],
        solution: (p) => `Stavka 14% + ${f1(p.mg)}% = ${f1(14 + p.mg)}%; ${f0(p.Loan)} × ${f1(14 + p.mg)}% = ${f1((p.Loan * (14 + p.mg)) / 100)} mln; samarali stavka ${f1(14 + p.mg)}% × (1 − 0,15) = ${f2((14 + p.mg) * 0.85)}%.`,
      },
    },
  },
  18: {
    base: { Pl: 820, Ac: 814, WPl: 605, WAc: 599, Avg: 400, Vol: 12, Dis: 8, W0: 120, D0: 250, H0: 8, W1: 118, D1: 244, H1: 7.9, Q0: 18000, X0: 60, Q1: 20700, X1: 63, s0: 0.74, s1: 0.72, w0: 400, w1: 470 },
    vary: (r) => {
      const Pl = r.int(500, 900);
      const WPl = Math.round(Pl * r.between(0.65, 0.8, 0.01));
      const W0 = r.int(80, 160);
      const X0 = r.int(40, 80);
      const Q0 = roundTo(X0 * r.between(250, 350, 5), 100);
      const w0 = r.vary(400, 0.2, 10);
      return {
        Pl, Ac: Pl - r.int(2, 12), WPl, WAc: WPl - r.int(2, 10), Avg: r.int(250, 600), Vol: r.int(6, 18), Dis: r.int(3, 12),
        W0, D0: r.pick([248, 250, 252]), H0: 8, W1: W0 - r.int(1, 5), D1: r.int(238, 247), H1: r.pick([7.6, 7.7, 7.8, 7.9]),
        Q0, X0, Q1: roundTo(Q0 * r.between(1.08, 1.22, 0.01), 100), X1: X0 + r.int(1, 6),
        s0: r.vary(0.74, 0.06, 0.01), s1: r.vary(0.72, 0.06, 0.01), w0, w1: roundTo(w0 * r.between(1.08, 1.25, 0.01), 5),
      };
    },
    tasks: {
      "p18-1": {
        text: (p) => `Reja bo'yicha ${f0(p.Pl)} xodim, haqiqatda ${f0(p.Ac)}; ishchilar reja ${f0(p.WPl)}, haqiqat ${f0(p.WAc)}.`,
        values: (p) => [pct(p.Ac, p.Pl), pct(p.WAc, p.WPl)],
        solution: (p) => `${f0(p.Ac)} / ${f0(p.Pl)} = ${f2(pct(p.Ac, p.Pl))}% (${sgn(p.Ac - p.Pl, 0)}); ${f0(p.WAc)} / ${f0(p.WPl)} = ${f2(pct(p.WAc, p.WPl))}% (${sgn(p.WAc - p.WPl, 0)}).`,
      },
      "p18-2": {
        text: (p) => `O'rtacha xodimlar soni ${f0(p.Avg)}. O'z xohishi bilan ${f0(p.Vol)}, intizom buzilishi sababli ${f0(p.Dis)} xodim ketgan.`,
        values: (p) => [pct(p.Vol + p.Dis, p.Avg)],
        solution: (p) => `(${f0(p.Vol)} + ${f0(p.Dis)}) / ${f0(p.Avg)} = ${f2(pct(p.Vol + p.Dis, p.Avg))}%.`,
      },
      "p18-3": {
        text: (p) => `Reja: ${f0(p.W0)} ishchi × ${f0(p.D0)} kun × ${f1(p.H0)} soat. Haqiqat: ${f0(p.W1)} ishchi × ${f0(p.D1)} kun × ${f1(p.H1)} soat.`,
        values: (p) => [p.W0 * p.D0 * p.H0, p.W1 * p.D1 * p.H1, p.W1 * p.D1 * p.H1 - p.W0 * p.D0 * p.H0],
        solution: (p) => `${f0(p.W0)} × ${f0(p.D0)} × ${f1(p.H0)} = ${f1(p.W0 * p.D0 * p.H0)}; ${f0(p.W1)} × ${f0(p.D1)} × ${f1(p.H1)} = ${f1(p.W1 * p.D1 * p.H1)}; farq ${sgn(p.W1 * p.D1 * p.H1 - p.W0 * p.D0 * p.H0, 1)} soat.`,
      },
      "p18-4": {
        text: (p) => `Xizmat hajmi ${f0(p.Q0)} mln, xodimlar ${f0(p.X0)} kishi; keyingi yil ${f0(p.Q1)} mln va ${f0(p.X1)} kishi.`,
        values: (p) => [p.Q0 / p.X0, p.Q1 / p.X1, (p.Q1 / p.X1 / (p.Q0 / p.X0)) * 100 - 100],
        solution: (p) => `${f0(p.Q0)} / ${f0(p.X0)} = ${f2(p.Q0 / p.X0)}; ${f0(p.Q1)} / ${f0(p.X1)} = ${f2(p.Q1 / p.X1)}; ${f2(p.Q1 / p.X1)} / ${f2(p.Q0 / p.X0)} = ${f2((p.Q1 / p.X1 / (p.Q0 / p.X0)) * 100)}% (o'sish ${f2((p.Q1 / p.X1 / (p.Q0 / p.X0)) * 100 - 100)}%).`,
      },
      "p18-5": {
        text: (p) => `Bir xodim unumdorligi = ishchilar ulushi × bir ishchi unumdorligi. Ulush ${f0(p.s0 * 100)}% → ${f0(p.s1 * 100)}%, bir ishchi unumdorligi ${f0(p.w0)} → ${f0(p.w1)} mln so'm.`,
        values: (p) => [(p.s1 - p.s0) * p.w0, p.s1 * (p.w1 - p.w0), p.s1 * p.w1 - p.s0 * p.w0],
        solution: (p) => `${f2(p.s0)} × ${f0(p.w0)} = ${f1(p.s0 * p.w0)}; ${f2(p.s1)} × ${f0(p.w0)} = ${f1(p.s1 * p.w0)} (${sgn((p.s1 - p.s0) * p.w0, 1)}); ${f2(p.s1)} × ${f0(p.w1)} = ${f1(p.s1 * p.w1)} (${sgn(p.s1 * (p.w1 - p.w0), 1)}); jami ${sgn(p.s1 * p.w1 - p.s0 * p.w0, 1)} mln so'm.`,
      },
    },
  },
};

export const VARIANT_TOPICS = V;

/** Variant raqami (1–999) — talaba va o'qituvchi ko'radi. */
export const variantNumber = (seed, num) => (hash(`${seed}:${num}:n`) % 999) + 1;

/**
 * Talabaning amaliy mashg'uloti: masalalar shu talabaning raqamlari bilan (javoblar ham shunga mos).
 * seed — talaba identifikatori. Variant yo'q bo'lsa (yoki seed berilmasa) — asl masalalar qaytariladi.
 */
export function practiceFor(num, seed) {
  const pr = PRACTICE[num];
  const def = V[num];
  if (!pr || !def || !seed) return pr || null;
  const p = def.vary(makeRng(`${seed}:${num}`));
  return {
    ...pr,
    variant: variantNumber(seed, num),
    tasks: pr.tasks.map((t) => {
      const v = def.tasks[t.id];
      if (!v) return t;
      const vals = v.values(p);
      // Ruxsat etilgan farq: asl masaladagi nisbiy aniqlik saqlanadi
      return {
        ...t,
        text: v.text(p),
        solution: v.solution(p),
        note: undefined,
        fields: t.fields.map((f, i) => ({ ...f, value: Math.round(vals[i] * 1e6) / 1e6, tol: f.tol === undefined ? undefined : f.value ? Math.max(f.tol, (Math.abs(f.tol / f.value) * Math.abs(vals[i])) || f.tol) : f.tol })),
      };
    }),
  };
}

/** Tekshiruv uchun: asl raqamlar bilan hisoblangan javoblar. */
export function baseTexts(num) {
  const def = V[num];
  return Object.fromEntries(Object.entries(def.tasks).map(([id, v]) => [id, v.text(def.base)]));
}

export function baseValues(num) {
  const def = V[num];
  return Object.fromEntries(Object.entries(def.tasks).map(([id, v]) => [id, v.values(def.base)]));
}
