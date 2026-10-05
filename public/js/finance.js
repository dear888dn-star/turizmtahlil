// Moliyaviy tahlil hisob-kitoblari (DOMga bog'liq emas — brauzer va serverda bir xil ishlaydi).
// Kirish: korxonaning ikki yillik (o'tgan / hisobot) balansi va moliyaviy natijalari, mln so'm.
// Formulalar A.N. Xoliqulov o'quv qo'llanmasi (2024) va amaliy mashg'ulotlar to'plamiga mos.

export const BALANCE_FIELDS = [
  ["nca", "Uzoq muddatli aktivlar (asosiy vositalar, NA va b.)", "A4"],
  ["inventory", "Zaxiralar", "A3"],
  ["receivables", "Debitorlik qarzlari", "A2"],
  ["overdue", "  shundan muddati o'tgan debitorlik", ""],
  ["cash", "Pul mablag'lari va qisqa muddatli qo'yilmalar", "A1"],
  ["otherCa", "Boshqa joriy aktivlar", "A3"],
  ["equity", "Xususiy kapital", "P4"],
  ["ltDebt", "Uzoq muddatli majburiyatlar", "P3"],
  ["stLoans", "Qisqa muddatli kredit va qarzlar", "P2"],
  ["payables", "Kreditorlik qarzlari", "P1"],
];

export const PNL_FIELDS = [
  ["revenue", "Sof tushum"],
  ["cogs", "Sotilgan xizmatlar tannarxi"],
  ["selling", "Sotish xarajatlari"],
  ["admin", "Ma'muriy xarajatlar"],
  ["otherOp", "Boshqa operatsion daromad (+) / xarajat (−)"],
  ["finance", "Moliyaviy faoliyat natijasi (±)"],
  ["tax", "Foyda solig'i"],
  ["fixedCosts", "Doimiy xarajatlar (zararsizlik uchun)"],
  ["staff", "O'rtacha xodimlar soni, kishi"],
  ["payroll", "Ish haqi fondi"],
];

const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const div = (a, b) => (b ? a / b : null);
const avg = (a, b) => (n(a) + n(b)) / 2;

/** Bir yil uchun yig'ma ko'rsatkichlar. */
export function totals(y = {}) {
  const ca = n(y.inventory) + n(y.receivables) + n(y.cash) + n(y.otherCa);
  const assets = n(y.nca) + ca;
  const liabilities = n(y.ltDebt) + n(y.stLoans) + n(y.payables);
  const passive = n(y.equity) + liabilities;
  const gross = n(y.revenue) - n(y.cogs);
  const operating = gross - n(y.selling) - n(y.admin) + n(y.otherOp);
  const pretax = operating + n(y.finance);
  const net = pretax - n(y.tax);
  return { ca, assets, liabilities, passive, currentLiab: n(y.stLoans) + n(y.payables), gross, operating, pretax, net, balanced: Math.abs(assets - passive) < 0.5 };
}

/** Barcha koeffitsiyentlar. prev — o'tgan yil, cur — hisobot yili. */
export function analyze(prev = {}, cur = {}) {
  const p = totals(prev);
  const c = totals(cur);
  const avgAssets = avg(p.assets, c.assets) || c.assets;
  const avgEquity = avg(prev.equity, cur.equity) || n(cur.equity);
  const avgCa = avg(p.ca, c.ca) || c.ca;
  const avgRec = avg(prev.receivables, cur.receivables) || n(cur.receivables);
  const avgPay = avg(prev.payables, cur.payables) || n(cur.payables);
  const avgInv = avg(prev.inventory, cur.inventory) || n(cur.inventory);
  const avgNca = avg(prev.nca, cur.nca) || n(cur.nca);
  const rev = n(cur.revenue);
  const variable = n(cur.cogs) + n(cur.selling) + n(cur.admin) - n(cur.fixedCosts);
  const margin = rev - variable;
  const bep = margin > 0 ? (rev * n(cur.fixedCosts)) / margin : null;
  const ownWc = n(cur.equity) + n(cur.ltDebt) - n(cur.nca);
  const roeParts = { ros: div(c.net, rev), turnover: div(rev, avgAssets), leverage: div(avgAssets, avgEquity) };
  const groups = {
    A1: n(cur.cash), A2: n(cur.receivables) - n(cur.overdue), A3: n(cur.inventory) + n(cur.otherCa) + n(cur.overdue), A4: n(cur.nca),
    P1: n(cur.payables), P2: n(cur.stLoans), P3: n(cur.ltDebt), P4: n(cur.equity),
  };
  const k = {
    current: div(c.ca, c.currentLiab),
    quick: div(n(cur.cash) + n(cur.receivables) - n(cur.overdue), c.currentLiab),
    absolute: div(n(cur.cash), c.currentLiab),
    autonomy: div(n(cur.equity), c.assets),
    debtRatio: div(c.liabilities, c.assets),
    debtEquity: div(c.liabilities, n(cur.equity)),
    ownWc,
    ownWcRatio: div(ownWc, c.ca),
    assetTurnover: div(rev, avgAssets),
    caTurnover: div(rev, avgCa),
    caDays: div(360, div(rev, avgCa)),
    recTurnover: div(rev, avgRec),
    recDays: div(360, div(rev, avgRec)),
    payDays: div(360, div(n(cur.cogs), avgPay)),
    invDays: div(360, div(n(cur.cogs), avgInv)),
    fondReturn: div(rev, avgNca),
    grossMargin: div(c.gross, rev),
    ros: roeParts.ros,
    roa: div(c.net, avgAssets),
    roe: div(c.net, avgEquity),
    costReturn: div(c.net, n(cur.cogs)),
    margin,
    bep,
    safety: bep != null && rev ? (rev - bep) / rev : null,
    productivity: div(rev, n(cur.staff)),
    payrollShare: div(n(cur.payroll), rev),
    overdueShare: div(n(cur.overdue), n(cur.receivables)),
  };
  const dupont = { ...roeParts, roe: roeParts.ros != null && roeParts.turnover != null && roeParts.leverage != null ? roeParts.ros * roeParts.turnover * roeParts.leverage : null };
  return { prev: p, cur: c, k, groups, dupont, growth: { revenue: div(rev, n(prev.revenue)), net: div(c.net, p.net), assets: div(c.assets, p.assets), receivables: div(n(cur.receivables), n(prev.receivables)), equity: div(n(cur.equity), n(prev.equity)), liabilities: div(c.liabilities, p.liabilities) } };
}

/** Me'yoriy chegaralar va signal: "ok" | "warn" | "bad". */
export const NORMS = {
  current: { label: "Joriy likvidlik (qoplash)", norm: "≥ 1,5–2", test: (v) => (v >= 1.5 ? "ok" : v >= 1 ? "warn" : "bad") },
  quick: { label: "Tez likvidlik", norm: "≥ 0,7–1", test: (v) => (v >= 0.7 ? "ok" : v >= 0.5 ? "warn" : "bad") },
  absolute: { label: "Absolyut likvidlik", norm: "≥ 0,2", test: (v) => (v >= 0.2 ? "ok" : v >= 0.1 ? "warn" : "bad") },
  autonomy: { label: "Avtonomiya (mustaqillik)", norm: "≥ 0,5", test: (v) => (v >= 0.5 ? "ok" : v >= 0.4 ? "warn" : "bad") },
  ownWcRatio: { label: "O'z aylanma mablag'lari bilan ta'minlanganlik", norm: "≥ 0,1", test: (v) => (v >= 0.1 ? "ok" : v >= 0 ? "warn" : "bad") },
  overdueShare: { label: "Muddati o'tgan debitorlik ulushi", norm: "≤ 10%", test: (v) => (v <= 0.1 ? "ok" : v <= 0.25 ? "warn" : "bad") },
  ros: { label: "Sotish rentabelligi (ROS)", norm: "> 0, o'sish", test: (v) => (v >= 0.08 ? "ok" : v > 0 ? "warn" : "bad") },
  roe: { label: "O'z kapitali rentabelligi (ROE)", norm: "> asosiy stavka (14%)", test: (v) => (v >= 0.14 ? "ok" : v > 0 ? "warn" : "bad") },
  safety: { label: "Xavfsizlik zaxirasi", norm: "≥ 20%", test: (v) => (v >= 0.2 ? "ok" : v > 0 ? "warn" : "bad") },
};

/** Namuna korxonalar (shartli ma'lumotlar, mln so'm) — o'quv mashqi uchun. */
export const CASES = [
  {
    id: "silk-road-travel",
    name: "“Silk Road Travel” MChJ (turoperator, Samarqand)",
    type: "Turoperator",
    about: "Kiruvchi turizm bo'yicha turoperator: Samarqand–Buxoro–Xiva turpaketlari, 18 xodim. Tushum o'sgan, ammo debitorlik va qisqa muddatli qarz tez ko'paygan.",
    prev: { nca: 820, inventory: 60, receivables: 640, overdue: 40, cash: 410, otherCa: 70, equity: 1150, ltDebt: 200, stLoans: 250, payables: 400, revenue: 9600, cogs: 8160, selling: 420, admin: 380, otherOp: 15, finance: -35, tax: 93, fixedCosts: 690, staff: 17, payroll: 610 },
    cur: { nca: 900, inventory: 70, receivables: 1020, overdue: 190, cash: 300, otherCa: 80, equity: 1240, ltDebt: 180, stLoans: 420, payables: 530, revenue: 11500, cogs: 9890, selling: 520, admin: 420, otherOp: 10, finance: -70, tax: 92, fixedCosts: 760, staff: 18, payroll: 700 },
  },
  {
    id: "registan-plaza",
    name: "“Registan Plaza” mehmonxonasi (4*, 120 xona)",
    type: "Mehmonxona",
    about: "Kapital sig'imi yuqori mehmonxona: asosiy vositalar ulushi katta, bank krediti hisobidan rekonstruksiya qilingan, mavsumiylik kuchli.",
    prev: { nca: 38500, inventory: 620, receivables: 1450, overdue: 120, cash: 980, otherCa: 300, equity: 24800, ltDebt: 12400, stLoans: 1800, payables: 2850, revenue: 21400, cogs: 12900, selling: 1650, admin: 2900, otherOp: 120, finance: -1950, tax: 320, fixedCosts: 11200, staff: 142, payroll: 4300 },
    cur: { nca: 39800, inventory: 680, receivables: 1600, overdue: 140, cash: 1650, otherCa: 270, equity: 26050, ltDebt: 11300, stLoans: 2100, payables: 4550, revenue: 25900, cogs: 14700, selling: 1900, admin: 3200, otherOp: 160, finance: -1800, tax: 680, fixedCosts: 12100, staff: 150, payroll: 5050 },
  },
  {
    id: "zomin-eco",
    name: "“Zomin Eco Tour” (ekoturizm va mehmon uylari, Jizzax)",
    type: "Turagent + mehmon uylari",
    about: "Kichik oilaviy biznes: ekoturlar va 3 ta mehmon uyi. Ichki turizm o'smoqda, 2026-yildan soddalashtirilgan QQS rejimini ko'rib chiqmoqda.",
    prev: { nca: 2100, inventory: 90, receivables: 160, overdue: 10, cash: 140, otherCa: 20, equity: 1900, ltDebt: 300, stLoans: 120, payables: 190, revenue: 2350, cogs: 1450, selling: 160, admin: 280, otherOp: 0, finance: -40, tax: 63, fixedCosts: 520, staff: 9, payroll: 380 },
    cur: { nca: 2600, inventory: 110, receivables: 210, overdue: 15, cash: 260, otherCa: 25, equity: 2250, ltDebt: 520, stLoans: 160, payables: 275, revenue: 3150, cogs: 1890, selling: 210, admin: 330, otherOp: 20, finance: -65, tax: 101, fixedCosts: 610, staff: 11, payroll: 470 },
  },
];

export const fmt = (v, d = 2) => (v == null || !Number.isFinite(v) ? "—" : v.toLocaleString("ru-RU", { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/ /g, " "));
export const pct = (v, d = 1) => (v == null || !Number.isFinite(v) ? "—" : `${fmt(v * 100, d)}%`);

/** Laboratoriya hisobotining xulosa bo'limlari va yo'riqnomalari. */
export const LAB_SECTIONS = [
  ["structure", "Gorizontal va vertikal tahlil xulosasi", "Balans jami, aktivlar va passivlar tarkibi qanday o'zgardi? Qaysi moddalar eng tez o'sdi va bu nimani anglatadi?"],
  ["liquidity", "Likvidlik va to'lov qobiliyati", "Joriy, tez va absolyut likvidlik me'yorga mosmi? A1–A4 / P1–P4 shartlari bajariladimi?"],
  ["stability", "Moliyaviy barqarorlik", "Avtonomiya, qarz/o'z kapitali nisbati va o'z aylanma mablag'lari nimani ko'rsatadi?"],
  ["activity", "Ish faolligi (aylanish)", "Aktivlar, aylanma mablag'lar, debitorlik va kreditorlik aylanish davri. Pul qayerda “muzlab” qolmoqda?"],
  ["profitability", "Moliyaviy natijalar va rentabellik", "Tushum va foyda dinamikasi, yalpi marja, ROS, ROA, ROE. DuPont bo'yicha ROE o'zgarishi qaysi omil hisobiga?"],
  ["breakeven", "Zararsizlik nuqtasi", "Zararsizlik tushumi va xavfsizlik zaxirasi qancha? Mavsumiylik xavfi qanday?"],
  ["recommendations", "Umumiy xulosa va takliflar", "3–5 ta aniq chora: nima qilinadi, qaysi ko'rsatkich qanchaga yaxshilanadi, muddat. 2026-yil sharoitini (14% stavka, soliqlar, imtiyozlar) hisobga oling."],
];
