// Ballar jadvali: mustaqil ish baholari va amaliy mashg'ulot ballari (o'qituvchi jurnali va talaba sahifasi uchun umumiy).
import { h } from "./ui.js";
import { TOPICS } from "../data/topics.js";

export const num = (x) => (x === null || x === undefined ? "—" : String(x).replace(".", ","));
export const ratingClass = (r) => (r >= 17 ? "score-high" : r >= 12 ? "score-mid" : "score-low");

/** Mavzular bo'yicha jadval: mustaqil ish baholari va amaliy mashg'ulot bali (o'qituvchi va talaba uchun umumiy). */
export function scoreTable(s) {
  const gradeChip = (x) => (!x ? h("span", { class: "muted" }, "—") : x.grade !== null ? h("b", { class: x.grade >= 4 ? "score-high" : x.grade === 3 ? "score-mid" : "score-low" }, x.grade) : h("span", { class: "chip chip-soft" }, x.resubmitted ? "qayta topshirilgan" : "baholanmagan"));
  return h("div", { class: "stack" },
    h("div", { class: "grid cols-2" },
      h("div", { class: "card stat-card" }, h("div", { class: "stat-icon" }, "🧩"), h("b", { class: ratingClass(s.selfStudy.rating) }, `${num(s.selfStudy.rating)} / 20`), h("span", { class: "muted small" }, `Mustaqil ish · ${s.selfStudy.graded} ta baholangan, o'rtacha ${num(s.selfStudy.avg)}`)),
      h("div", { class: "card stat-card" }, h("div", { class: "stat-icon" }, "🧮"), h("b", { class: ratingClass(s.practice.rating) }, `${num(s.practice.rating)} / 20`), h("span", { class: "muted small" }, `Amaliy · ${s.practice.done} ta mavzu, o'rtacha ${num(s.practice.avg)} / 10`))),
    h("div", { class: "table-wrap" },
      h("table", { class: "table" },
        h("thead", {}, h("tr", {}, h("th", {}, "Mavzu"), h("th", {}, "Mustaqil ishlar (baho)"), h("th", {}, "Amaliy (/10)"))),
        h("tbody", {}, TOPICS.map((t) => {
          const p = s.practice.topics[t.id];
          return h("tr", {},
            h("td", {}, `${t.num}. ${t.title}`),
            h("td", {}, t.selfStudy.length ? t.selfStudy.map((task) => h("div", { class: "small" }, gradeChip(s.selfStudy.tasks[task.id]), " ", task.title)) : h("span", { class: "muted" }, "—")),
            h("td", { class: "num" }, p ? [h("b", { class: p.score >= 8 ? "score-high" : p.score >= 6 ? "score-mid" : "score-low" }, num(p.score)), p.byTeacher ? h("div", { class: "muted small" }, "o'qituvchi bahosi") : h("div", { class: "muted small" }, "AI bahosi")] : h("span", { class: "muted" }, "—")));
        })))));
}

