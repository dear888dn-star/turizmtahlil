// "Tahlil laboratoriyasi": turistik korxona faoliyatining kompleks moliyaviy tahlili loyihasi.
// Talaba ikki yillik balans va moliyaviy natijalarni kiritadi → platforma 30+ ko'rsatkichni hisoblaydi →
// talaba xulosa va takliflar yozadi → AI tekshiradi va feedback beradi → o'qituvchiga topshiriladi (100 ballik rubrika).
import { h, mount, toast, loading, fmtDate, confirmDialog, emptyState, downloadFile } from "../ui.js";
import { api } from "../api.js";
import { BALANCE_FIELDS, PNL_FIELDS, CASES, NORMS, LAB_SECTIONS, analyze, totals, fmt, pct } from "../finance.js";
import { confetti } from "../motion.js";

const STATUS = { draft: ["Qoralama", ""], submitted: ["Topshirilgan", "badge-warn"], graded: ["Baholangan", "badge-ok"] };
const uid = () => Math.random().toString(36).slice(2, 10);
const blankYear = () => Object.fromEntries([...BALANCE_FIELDS, ...PNL_FIELDS].map(([k]) => [k, ""]));

function newProject(caseId) {
  const c = CASES.find((x) => x.id === caseId);
  if (c) return { title: c.name, company: { type: c.type, about: c.about, caseId: c.id }, data: { prev: { ...c.prev }, cur: { ...c.cur }, years: ["2024", "2025"] }, conclusions: {} };
  return { title: "Mening korxonam", company: { type: "", about: "", caseId: null }, data: { prev: blankYear(), cur: blankYear(), years: ["2024", "2025"] }, conclusions: {} };
}

// ---------------- Ro'yxat ----------------

export async function renderList(el) {
  mount(el, loading());
  const { projects, rubric } = await api.get("labs");
  const create = async (caseId) => {
    const id = uid();
    try {
      await api.put(`labs/${id}`, newProject(caseId));
      location.hash = `#/lab/${id}`;
    } catch (e) {
      toast(e.message, "error");
    }
  };
  mount(
    el,
    h("section", { class: "trainer-hero" },
      h("div", {},
        h("div", { class: "eyebrow" }, "Kompleks tahlil loyihasi · MT18"),
        h("h1", {}, "🔬 Tahlil laboratoriyasi"),
        h("p", { class: "lead" }, "Turistik korxonaning ikki yillik balansi va moliyaviy natijalarini kiriting — platforma gorizontal va vertikal tahlil, likvidlik, moliyaviy barqarorlik, aylanish, rentabellik (DuPont) va zararsizlik nuqtasini avtomatik hisoblaydi. Siz ko'rsatkichlarni talqin qilib, xulosa va takliflar yozasiz."),
        h("p", { class: "small muted" }, "Baholash: sun'iy intellekt dastlabki feedback beradi, yakuniy bahoni o'qituvchi 100 ballik rubrika bo'yicha qo'yadi (86–100 a'lo, 71–85 yaxshi, 56–70 qoniqarli).")),
      h("div", { class: "card stack" },
        h("h3", {}, "Yangi tahlil boshlash"),
        CASES.map((c) => h("button", { class: "btn ghost case-btn", onclick: () => create(c.id) }, h("b", {}, c.name), h("small", { class: "muted" }, c.about))),
        h("button", { class: "btn", onclick: () => create(null) }, "➕ O'z korxonam ma'lumotlari bilan (bo'sh shablon)"),
        h("p", { class: "muted small" }, "Namuna korxonalar ma'lumotlari shartli (o'quv mashqi uchun). Real korxona hisobotini openinfo.uz yoki korxonaning o'zidan olishingiz mumkin."))),
    h("h2", { class: "section-title" }, "Mening tahlillarim"),
    projects.length
      ? h("div", { class: "grid cols-2" }, projects.map((p) => {
          const a = analyze(p.data?.prev, p.data?.cur);
          const [label, cls] = STATUS[p.status] || STATUS.draft;
          return h("a", { href: `#/lab/${p.id}`, class: "card tilt" },
            h("div", { class: "row between" }, h("b", {}, p.title), h("span", { class: `badge ${cls}` }, label)),
            h("p", { class: "muted small" }, p.company?.type || "Turistik korxona", " · yangilangan: ", fmtDate(p.updatedAt)),
            h("div", { class: "chips" }, h("span", { class: "chip chip-soft" }, `ROE ${pct(a.k.roe)}`), h("span", { class: "chip chip-soft" }, `Joriy likvidlik ${fmt(a.k.current)}`), p.aiReview && h("span", { class: "chip chip-soft" }, `🤖 ${p.aiReview.total}/100`), p.grade && h("span", { class: "chip chip-active" }, `👩‍🏫 ${p.grade.total}/100`)));
        }))
      : emptyState("🔬", "Hali tahlil yo'q", "Yuqoridan namuna korxonani tanlab, birinchi tahlilingizni boshlang."),
    h("details", { class: "card" }, h("summary", {}, h("b", {}, "📋 Baholash rubrikasi (100 ball)")), h("ol", {}, rubric.map((r) => h("li", {}, `${r.title} — ${r.max} ball`))))
  );
}

// ---------------- Loyiha ----------------

export async function renderProject(el, id) {
  mount(el, loading());
  const { projects, rubric, levels } = await api.get("labs");
  let p = projects.find((x) => x.id === id);
  if (!p) throw new Error("Loyiha topilmadi");
  p.data ||= { prev: blankYear(), cur: blankYear(), years: ["2024", "2025"] };
  p.conclusions ||= {};
  p.company ||= {};
  const locked = () => p.status === "submitted";

  let saveTimer;
  const saveState = h("span", { class: "muted small" }, "Saqlangan");
  const save = async () => {
    try {
      const { aiReview, grade, ...rest } = p;
      p = { ...p, ...(await api.put(`labs/${id}`, rest)) };
      saveState.textContent = "✓ Saqlandi";
    } catch (e) {
      saveState.textContent = `⚠ ${e.message}`;
    }
  };
  const queueSave = () => {
    saveState.textContent = "Saqlanmoqda…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 900);
  };

  const results = h("div", { class: "stack" });
  const drawResults = () => results.replaceChildren(...resultsView(p));

  // --- Korxona ---
  const titleIn = h("input", { value: p.title, oninput: (e) => ((p.title = e.target.value), queueSave()) });
  const typeIn = h("input", { value: p.company.type || "", placeholder: "Turoperator, mehmonxona, turagent…", oninput: (e) => ((p.company.type = e.target.value), queueSave()) });
  const aboutIn = h("textarea", { rows: 2, placeholder: "Qisqacha tavsif: faoliyat turi, hudud, xodimlar, mavsumiylik…", oninput: (e) => ((p.company.about = e.target.value), queueSave()) }, p.company.about || "");
  const yearIn = (i) => h("input", { class: "year-input", value: p.data.years?.[i] || "", oninput: (e) => ((p.data.years[i] = e.target.value), queueSave(), drawTable()) });

  // --- Ma'lumotlar jadvali ---
  const table = h("div", { class: "lab-table-wrap" });
  const checkLine = h("div", { class: "lab-check" });
  const cell = (year, key) =>
    h("input", { type: "text", inputmode: "decimal", class: "num-input", value: p.data[year][key] ?? "", disabled: locked(), oninput: (e) => {
      const v = e.target.value.replace(/\s/g, "").replace(",", ".");
      p.data[year][key] = v === "" ? "" : Number(v);
      queueSave();
      drawCheck();
      drawResults();
    } });
  function drawCheck() {
    const tp = totals(p.data.prev);
    const tc = totals(p.data.cur);
    checkLine.replaceChildren(
      ...[["prev", tp], ["cur", tc]].map(([y, t], i) => h("span", { class: `badge ${t.balanced ? "badge-ok" : "badge-warn"}` }, `${p.data.years?.[i] || y}: aktivlar ${fmt(t.assets, 0)} ${t.balanced ? "=" : "≠"} passivlar ${fmt(t.passive, 0)}`)),
      h("span", { class: "muted small" }, " Balans tengligi: Aktivlar = Xususiy kapital + Majburiyatlar")
    );
  }
  function drawTable() {
    const head = h("tr", {}, h("th", {}, "Ko'rsatkich (mln so'm)"), h("th", {}, p.data.years?.[0] || "O'tgan yil"), h("th", {}, p.data.years?.[1] || "Hisobot yili"), h("th", {}, "Guruh"));
    const rows = (fields, title) => [h("tr", { class: "group-row" }, h("td", { colspan: 4 }, title)), ...fields.map(([k, label, g]) => h("tr", {}, h("td", {}, label), h("td", {}, cell("prev", k)), h("td", {}, cell("cur", k)), h("td", { class: "muted small" }, g || "")))];
    table.replaceChildren(h("table", { class: "table lab-table" }, h("thead", {}, head), h("tbody", {}, rows(BALANCE_FIELDS, "Buxgalteriya balansi (yil oxiriga)"), rows(PNL_FIELDS, "Moliyaviy natijalar va mehnat ko'rsatkichlari (yil davomida)"))));
  }
  drawTable();
  drawCheck();
  drawResults();

  // --- Xulosalar ---
  const conclusionBoxes = LAB_SECTIONS.map(([key, title, hint]) => {
    const ta = h("textarea", { rows: 4, disabled: locked(), placeholder: hint, oninput: (e) => ((p.conclusions[key] = e.target.value), queueSave(), wc()) }, p.conclusions[key] || "");
    const count = h("span", { class: "muted small" });
    const wc = () => (count.textContent = `${ta.value.split(/\s+/).filter(Boolean).length} so'z`);
    wc();
    return h("div", { class: "card" }, h("div", { class: "row between" }, h("h4", {}, title), count), h("p", { class: "muted small" }, hint), ta);
  });

  // --- AI va o'qituvchi ---
  const aiBox = h("div");
  const drawAi = () => aiBox.replaceChildren(p.aiReview ? aiView(p.aiReview, rubric) : h("p", { class: "muted small" }, "Xulosalarni yozib bo'lgach, AI tekshiruvidan o'tkazing: u har bir xulosa hisoblangan ko'rsatkichlarga mos kelishini, iqtisodiy mantiqni va takliflar sifatini 100 ballik rubrika bo'yicha baholaydi."));
  drawAi();
  const aiBtn = h("button", { class: "btn ai-btn", onclick: async () => {
    clearTimeout(saveTimer);
    await save();
    aiBtn.disabled = true;
    aiBtn.textContent = "🤖 AI tekshirmoqda… (20–40 soniya)";
    try {
      p = { ...p, ...(await api.post(`labs/${id}/review`)) };
      drawAi();
      aiBox.scrollIntoView({ behavior: "smooth", block: "start" });
      if (p.aiReview.total >= 86) {
        const r = aiBox.getBoundingClientRect();
        setTimeout(() => confetti(r.left + r.width / 2, r.top + 40), 300);
      }
    } catch (e) {
      toast(e.message, "error");
    } finally {
      aiBtn.disabled = false;
      aiBtn.textContent = "🤖 AI bilan qayta tekshirish";
    }
  } }, p.aiReview ? "🤖 AI bilan qayta tekshirish" : "🤖 AI bilan tekshirish");

  const submitBtn = h("button", { class: "btn", disabled: locked() || p.status === "graded", onclick: async () => {
    if (!(await confirmDialog("Hisobotni o'qituvchiga topshirasizmi? Topshirilgandan keyin ma'lumotlarni o'zgartirib bo'lmaydi."))) return;
    clearTimeout(saveTimer);
    await save();
    try {
      p = { ...p, ...(await api.post(`labs/${id}/submit`)) };
      toast("Hisobot o'qituvchiga topshirildi", "ok");
      renderProject(el, id);
    } catch (e) {
      toast(e.message, "error");
    }
  } }, p.status === "draft" ? "📤 O'qituvchiga topshirish" : STATUS[p.status][0]);

  const exportCsv = () => {
    const a = analyze(p.data.prev, p.data.cur);
    const rows = [["Ko'rsatkich", "Qiymat"], ...Object.entries(a.k).map(([k, v]) => [k, v == null ? "" : String(Math.round(v * 10000) / 10000)])];
    downloadFile(`tahlil-${id}.csv`, "﻿" + rows.map((r) => r.join(";")).join("\n"));
  };

  mount(
    el,
    h("nav", { class: "crumbs" }, h("a", { href: "#/lab" }, "Tahlil laboratoriyasi"), " / ", p.title),
    h("div", { class: "page-head" }, h("div", {}, h("h1", {}, "🔬 ", p.title), h("p", { class: "muted" }, h("span", { class: `badge ${STATUS[p.status]?.[1] || ""}` }, STATUS[p.status]?.[0] || "Qoralama"), " ", saveState)), h("div", { class: "row wrap" }, h("button", { class: "btn ghost", onclick: exportCsv }, "⬇ CSV"), h("button", { class: "btn ghost", onclick: () => window.print() }, "🖨 Chop etish / PDF"), p.status === "draft" && h("button", { class: "btn ghost danger", onclick: async () => {
      if (!(await confirmDialog("Loyiha o'chirilsinmi?"))) return;
      await api.del(`labs/${id}`);
      location.hash = "#/lab";
    } }, "🗑"))),
    p.grade && h("div", { class: "card grade-card" }, h("h3", {}, `👩‍🏫 O'qituvchi bahosi: ${p.grade.total}/100 — ${p.grade.level}`), h("ol", { class: "small" }, rubric.map((r, i) => h("li", {}, `${r.title}: ${p.grade.scores[i]}/${r.max}`))), p.grade.feedback && h("p", {}, p.grade.feedback), h("p", { class: "muted small" }, `${p.grade.by} · ${fmtDate(p.grade.at)}`)),
    step(1, "Korxona", h("div", { class: "grid cols-2" }, h("label", {}, "Korxona nomi", titleIn), h("label", {}, "Faoliyat turi", typeIn), h("label", { class: "span-2" }, "Tavsif", aboutIn))),
    step(2, "Dastlabki ma'lumotlar", h("div", { class: "stack" }, h("div", { class: "row wrap small" }, "Yillar: ", yearIn(0), " → ", yearIn(1)), checkLine, table, h("p", { class: "muted small" }, "Doimiy xarajatlar — zararsizlik nuqtasi uchun: tannarx va davr xarajatlarining sotish hajmiga bog'liq bo'lmagan qismi (ijara, ma'muriy xodimlar, amortizatsiya, reklama). Muddati o'tgan debitorlik tez likvidlikdan chiqariladi."))),
    step(3, "Hisoblangan ko'rsatkichlar", results),
    step(4, "Xulosa va takliflar", h("div", { class: "stack" }, conclusionBoxes)),
    step(5, "AI tekshiruvi va topshirish", h("div", { class: "stack" }, h("div", { class: "row wrap" }, aiBtn, submitBtn), aiBox, h("details", { class: "small" }, h("summary", {}, "Baholash darajalari"), h("ul", {}, levels.map((l) => h("li", {}, l.label))))))
  );
  return () => clearTimeout(saveTimer);
}

function step(n, title, content) {
  return h("section", { class: "chapter" }, h("div", { class: "chapter-head" }, h("span", { class: "chapter-icon" }, n), h("div", {}, h("h2", {}, title))), content);
}

// ---------------- Natijalar ----------------

const RATIO_KEYS = new Set(["current", "quick", "absolute", "autonomy", "ownWcRatio"]);

function resultsView(p) {
  const a = analyze(p.data.prev, p.data.cur);
  const [y0, y1] = p.data.years || ["O'tgan yil", "Hisobot yili"];
  const tiles = Object.entries(NORMS).map(([k, m]) => {
    const v = a.k[k];
    const sig = v == null ? "" : m.test(v);
    return h("div", { class: `kpi-tile ${sig}` }, h("span", { class: "kpi-label" }, m.label), h("b", { class: "kpi-value" }, RATIO_KEYS.has(k) ? fmt(v) : pct(v)), h("span", { class: "kpi-norm" }, `me'yor: ${m.norm}`));
  });
  const growth = (cur, prev) => (prev ? `${fmt((cur / prev) * 100, 1)}%` : "—");
  const share = (v, total) => (total ? `${fmt((v / total) * 100, 1)}%` : "—");
  const bal = [
    ["Uzoq muddatli aktivlar", "nca"], ["Zaxiralar", "inventory"], ["Debitorlik", "receivables"], ["Pul mablag'lari", "cash"], ["Boshqa joriy aktivlar", "otherCa"],
    ["Xususiy kapital", "equity"], ["Uzoq muddatli majburiyatlar", "ltDebt"], ["Qisqa muddatli kreditlar", "stLoans"], ["Kreditorlik", "payables"],
  ];
  const n = (v) => Number(v) || 0;
  const horiz = h("table", { class: "table" },
    h("thead", {}, h("tr", {}, h("th", {}, "Modda"), h("th", {}, y0), h("th", {}, y1), h("th", {}, "Farq"), h("th", {}, "O'sish"), h("th", {}, `Ulush (${y1})`))),
    h("tbody", {}, bal.map(([label, k]) => {
      const v0 = n(p.data.prev[k]);
      const v1 = n(p.data.cur[k]);
      return h("tr", {}, h("td", {}, label), h("td", {}, fmt(v0, 0)), h("td", {}, fmt(v1, 0)), h("td", {}, `${v1 - v0 >= 0 ? "+" : ""}${fmt(v1 - v0, 0)}`), h("td", {}, growth(v1, v0)), h("td", {}, share(v1, a.cur.assets)));
    }), h("tr", { class: "total-row" }, h("td", {}, "Balans jami"), h("td", {}, fmt(a.prev.assets, 0)), h("td", {}, fmt(a.cur.assets, 0)), h("td", {}, fmt(a.cur.assets - a.prev.assets, 0)), h("td", {}, growth(a.cur.assets, a.prev.assets)), h("td", {}, "100%"))));
  const pnl = [["Sof tushum", p.data.prev.revenue, p.data.cur.revenue], ["Yalpi foyda", a.prev.gross, a.cur.gross], ["Asosiy faoliyat foydasi", a.prev.operating, a.cur.operating], ["Soliq to'lagunga qadar foyda", a.prev.pretax, a.cur.pretax], ["Sof foyda", a.prev.net, a.cur.net]];
  const pnlTable = h("table", { class: "table" }, h("thead", {}, h("tr", {}, h("th", {}, "Moliyaviy natija"), h("th", {}, y0), h("th", {}, y1), h("th", {}, "O'sish"))), h("tbody", {}, pnl.map(([l, v0, v1]) => h("tr", {}, h("td", {}, l), h("td", {}, fmt(n(v0), 0)), h("td", {}, fmt(n(v1), 0)), h("td", {}, growth(n(v1), n(v0)))))));
  const g = a.groups;
  const liq = h("table", { class: "table" }, h("thead", {}, h("tr", {}, h("th", {}, "Aktivlar"), h("th", {}, "Summa"), h("th", {}, "Passivlar"), h("th", {}, "Summa"), h("th", {}, "Shart"))),
    h("tbody", {}, [["A1", "P1", "≥"], ["A2", "P2", "≥"], ["A3", "P3", "≥"], ["A4", "P4", "≤"]].map(([x, y, op]) => {
      const ok = op === "≥" ? g[x] >= g[y] : g[x] <= g[y];
      return h("tr", {}, h("td", {}, x), h("td", {}, fmt(g[x], 0)), h("td", {}, y), h("td", {}, fmt(g[y], 0)), h("td", {}, h("span", { class: `badge ${ok ? "badge-ok" : "badge-warn"}` }, `${x} ${op} ${y} ${ok ? "✓" : "✗"}`)));
    })));
  const other = [
    ["Aktivlar aylanishi", fmt(a.k.assetTurnover), "marta"], ["Aylanma mablag'lar aylanish davri", fmt(a.k.caDays, 0), "kun"], ["Debitorlik aylanish davri", fmt(a.k.recDays, 0), "kun"], ["Kreditorlik aylanish davri", fmt(a.k.payDays, 0), "kun"],
    ["Fond qaytimi", fmt(a.k.fondReturn), "so'm/so'm"], ["Yalpi marja", pct(a.k.grossMargin), ""], ["Aktivlar rentabelligi (ROA)", pct(a.k.roa), ""], ["Xarajatlar rentabelligi", pct(a.k.costReturn), ""],
    ["Qarz / o'z kapitali", fmt(a.k.debtEquity), ""], ["O'z aylanma mablag'i", fmt(a.k.ownWc, 0), "mln so'm"], ["Bir xodim unumdorligi", fmt(a.k.productivity, 1), "mln so'm"], ["Ish haqi fondi / tushum", pct(a.k.payrollShare), ""],
  ];
  const d = a.dupont;
  return [
    h("div", { class: "kpi-grid" }, tiles),
    h("p", { class: "muted small" }, "🟢 me'yorda · 🟡 e'tibor talab etadi · 🔴 xavf. Me'yorlar A.N. Xoliqulov qo'llanmasi va umumqabul qilingan tavsiyalarga ko'ra; ROE asosiy stavka (14%, CBU, 2026) bilan solishtiriladi."),
    h("div", { class: "grid cols-2" }, h("div", { class: "card" }, h("h4", {}, "📊 Tushum va sof foyda"), barChart([[y0, n(p.data.prev.revenue), a.prev.net], [y1, n(p.data.cur.revenue), a.cur.net]])), h("div", { class: "card" }, h("h4", {}, "🎯 Zararsizlik nuqtasi"), breakevenChart(a, p))),
    h("div", { class: "card" }, h("h4", {}, "Gorizontal va vertikal tahlil"), h("div", { class: "table-scroll" }, horiz)),
    h("div", { class: "grid cols-2" }, h("div", { class: "card" }, h("h4", {}, "Moliyaviy natijalar"), pnlTable), h("div", { class: "card" }, h("h4", {}, "Balans likvidligi (A1–A4 / P1–P4)"), liq)),
    h("div", { class: "card" }, h("h4", {}, "DuPont modeli: ROE = ROS × Aktivlar aylanishi × Moliyaviy leverej"),
      h("div", { class: "dupont" }, h("span", { class: "dp-box main" }, h("small", {}, "ROE"), h("b", {}, pct(d.roe))), "=", h("span", { class: "dp-box" }, h("small", {}, "ROS"), h("b", {}, pct(d.ros))), "×", h("span", { class: "dp-box" }, h("small", {}, "Aylanish"), h("b", {}, fmt(d.turnover))), "×", h("span", { class: "dp-box" }, h("small", {}, "Leverej"), h("b", {}, fmt(d.leverage))))),
    h("div", { class: "card" }, h("h4", {}, "Boshqa ko'rsatkichlar"), h("div", { class: "mini-grid" }, other.map(([l, v, u]) => h("div", { class: "mini" }, h("span", {}, l), h("b", {}, v, u && h("small", {}, ` ${u}`)))))),
  ];
}

function barChart(rows) {
  const max = Math.max(1, ...rows.flatMap(([, r, nt]) => [r, Math.abs(nt)]));
  const W = 320;
  const H = 180;
  const bw = 46;
  const parts = rows.map(([label, rev, net], i) => {
    const x = 50 + i * 140;
    const hr = (rev / max) * 130;
    const hn = (Math.abs(net) / max) * 130;
    return `<g><rect x="${x}" y="${150 - hr}" width="${bw}" height="${hr}" rx="5" fill="var(--c1)"/><rect x="${x + bw + 6}" y="${150 - hn}" width="${bw}" height="${hn}" rx="5" fill="${net < 0 ? "var(--err)" : "var(--c3)"}"/>
      <text x="${x + bw}" y="170" text-anchor="middle" font-size="12" fill="var(--muted)">${label}</text>
      <text x="${x + bw / 2}" y="${144 - hr}" text-anchor="middle" font-size="10" fill="var(--text)">${fmt(rev, 0)}</text>
      <text x="${x + bw * 1.5 + 6}" y="${144 - hn}" text-anchor="middle" font-size="10" fill="var(--text)">${fmt(net, 0)}</text></g>`;
  });
  return h("div", { class: "chart", html: `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tushum va sof foyda"><line x1="40" y1="150" x2="${W - 10}" y2="150" stroke="var(--border)"/>${parts.join("")}</svg><div class="legend small"><span><i style="background:var(--c1)"></i>Sof tushum</span><span><i style="background:var(--c3)"></i>Sof foyda</span></div>` });
}

function breakevenChart(a, p) {
  const rev = Number(p.data.cur.revenue) || 0;
  const fixed = Number(p.data.cur.fixedCosts) || 0;
  if (!rev || a.k.bep == null) return h("p", { class: "muted small" }, "Zararsizlik nuqtasi uchun sof tushum va doimiy xarajatlarni kiriting.");
  const varRate = (rev - a.k.margin) / rev;
  const maxX = Math.max(rev, a.k.bep) * 1.25;
  const maxY = maxX;
  const W = 320;
  const H = 190;
  const X = (v) => 40 + (v / maxX) * (W - 55);
  const Y = (v) => 165 - (v / maxY) * 150;
  const costEnd = fixed + varRate * maxX;
  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Zararsizlik grafigi">
    <line x1="40" y1="165" x2="${W - 10}" y2="165" stroke="var(--border)"/><line x1="40" y1="10" x2="40" y2="165" stroke="var(--border)"/>
    <line x1="${X(0)}" y1="${Y(0)}" x2="${X(maxX)}" y2="${Y(maxX)}" stroke="var(--c1)" stroke-width="2.5"/>
    <line x1="${X(0)}" y1="${Y(fixed)}" x2="${X(maxX)}" y2="${Y(costEnd)}" stroke="var(--err)" stroke-width="2.5"/>
    <line x1="${X(0)}" y1="${Y(fixed)}" x2="${X(maxX)}" y2="${Y(fixed)}" stroke="var(--muted)" stroke-dasharray="4 4"/>
    <line x1="${X(a.k.bep)}" y1="${Y(a.k.bep)}" x2="${X(a.k.bep)}" y2="165" stroke="var(--accent)" stroke-dasharray="3 3"/>
    <circle cx="${X(a.k.bep)}" cy="${Y(a.k.bep)}" r="5" fill="var(--accent)"/>
    <line x1="${X(rev)}" y1="20" x2="${X(rev)}" y2="165" stroke="var(--ok)" stroke-dasharray="2 4"/>
    <text x="${X(a.k.bep)}" y="180" text-anchor="middle" font-size="10" fill="var(--text)">Zn ${fmt(a.k.bep, 0)}</text>
    <text x="${X(rev)}" y="16" text-anchor="middle" font-size="10" fill="var(--ok)">haqiqiy ${fmt(rev, 0)}</text></svg>`;
  return h("div", {}, h("div", { class: "chart", html: svg }), h("div", { class: "legend small" }, h("span", {}, h("i", { style: { background: "var(--c1)" } }), "Tushum"), h("span", {}, h("i", { style: { background: "var(--err)" } }), "Jami xarajatlar"), h("span", {}, h("i", { style: { background: "var(--muted)" } }), "Doimiy xarajatlar")),
    h("p", { class: "small" }, `Marjinal daromad: ${fmt(a.k.margin, 0)} mln so'm · zararsizlik tushumi: ${fmt(a.k.bep, 0)} mln so'm · xavfsizlik zaxirasi: ${pct(a.k.safety)}`));
}

function aiView(r, rubric) {
  const cls = r.total >= 86 ? "score-high" : r.total >= 56 ? "score-mid" : "score-low";
  const secName = Object.fromEntries(LAB_SECTIONS.map(([k, t]) => [k, t]));
  return h("div", { class: "card ai-review" },
    h("div", { class: "row wrap ai-review-head" },
      h("div", { class: `score-ring ${cls}`, style: { "--pct": r.total } }, h("b", {}, `${r.total}`), h("span", {}, "/100")),
      h("div", { class: "grow" }, h("h3", {}, r.estimated ? "🧮 Taxminiy avtomatik baho" : "🤖 AI tekshiruvi natijasi"), h("p", {}, r.summary), h("p", { class: "muted small" }, fmtDate(r.at), " · yakuniy bahoni o'qituvchi qo'yadi"))),
    h("div", { class: "crit-bars" }, rubric.map((c, i) => h("div", { class: "crit-row" }, h("span", { class: "crit-name" }, c.title), h("span", { class: "crit-bar" }, h("i", { style: { width: `${((r.scores[i] || 0) / c.max) * 100}%` } })), h("b", {}, `${r.scores[i] || 0}/${c.max}`)))),
    r.sections?.length > 0 && h("details", { open: true }, h("summary", {}, h("b", {}, "Bo'limlar bo'yicha izohlar")), h("ul", {}, r.sections.map((s) => h("li", {}, h("b", {}, `${secName[s.key] || s.key}: `), s.comment)))),
    h("div", { class: "grid cols-3 ai-lists" },
      r.strengths?.length > 0 && h("div", { class: "ai-list ok" }, h("h4", {}, "💪 Kuchli tomonlar"), h("ul", {}, r.strengths.map((x) => h("li", {}, x)))),
      r.mistakes?.length > 0 && h("div", { class: "ai-list bad" }, h("h4", {}, "⚠️ Xatolar"), h("ul", {}, r.mistakes.map((x) => h("li", {}, x)))),
      r.recommendations?.length > 0 && h("div", { class: "ai-list info" }, h("h4", {}, "🧭 Tavsiyalar"), h("ul", {}, r.recommendations.map((x) => h("li", {}, x))))));
}
