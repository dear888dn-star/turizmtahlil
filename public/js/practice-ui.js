// Amaliy mashg'ulot paneli: hisob-kitob topshiriqlari (darhol tekshiriladi), ochiq topshiriqlar (keys)
// va sun'iy intellekt asosidagi tekshiruv + feedback (POST /api/practice/:topicId/review).
import { h, toast, fmtDate } from "./ui.js";
import { api, session } from "./api.js";
import { topicState, updateTopic } from "./progress.js";
import { checkField } from "../data/practice.js";
import { confetti, shake } from "./motion.js";

const changed = () => window.dispatchEvent(new Event("vgt:progress"));

export function practicePanel(topic) {
  const pr = topic.practice;
  const st = topicState(topic.id);
  st.practice ||= {};
  const draft = (st.practiceDraft ||= { open: [], conclusion: "" });
  const summary = h("div", { class: "practice-summary" });
  const drawSummary = () => {
    const ok = pr.tasks.filter((t) => st.practice[t.id]?.ok).length;
    summary.replaceChildren(
      h("div", { class: "ps-ring", style: { "--p": Math.round((ok / pr.tasks.length) * 100) } }, h("b", {}, `${ok}/${pr.tasks.length}`)),
      h("div", {}, h("b", {}, ok === pr.tasks.length ? "Barcha hisob-kitoblar to'g'ri! 🎉" : "Hisob-kitoblar"), h("p", { class: "muted small" }, "Har bir to'g'ri yechilgan masala +10 XP. Javobni kasr bilan vergul yoki nuqta orqali yozishingiz mumkin (masalan: 2,14)."))
    );
  };
  drawSummary();

  const taskCards = pr.tasks.map((task, idx) => taskCard(topic, task, idx, st, drawSummary));

  const openBoxes = (pr.open || []).map((q, i) => {
    const ta = h("textarea", { rows: 5, placeholder: "Javobingizni yozing: raqamlarga tayaning, sabab va taklifni ko'rsating..." }, draft.open[i] || "");
    ta.addEventListener("input", () => updateTopic(topic.id, (s) => ((s.practiceDraft ||= { open: [], conclusion: "" }).open[i] = ta.value)));
    return h("div", { class: "card practice-open" }, h("div", { class: "row" }, h("span", { class: "q-num" }, `K${i + 1}`), h("b", {}, q)), ta);
  });
  const conclusion = h("textarea", { rows: 4, placeholder: "Mashg'ulot bo'yicha umumiy xulosangiz: qaysi ko'rsatkichlar nimani ko'rsatdi, rahbarga qanday tavsiya berasiz?" }, draft.conclusion || "");
  conclusion.addEventListener("input", () => updateTopic(topic.id, (s) => ((s.practiceDraft ||= { open: [], conclusion: "" }).conclusion = conclusion.value)));

  const reviewBox = h("div", { class: "ai-review-box" });
  if (st.aiReview) reviewBox.append(reviewView(st.aiReview));
  const aiBtn = h("button", { class: "btn lg ai-btn", onclick: () => runReview() }, "🤖 AI bilan tekshirish va feedback olish");

  async function runReview() {
    if (!session.user) {
      toast("AI tekshiruvi uchun tizimga kiring", "warn");
      sessionStorage.setItem("tt.after-login", location.hash);
      location.hash = "#/login";
      return;
    }
    const payload = {
      tasks: Object.fromEntries(pr.tasks.map((t) => [t.id, { values: st.practice[t.id]?.values || [], work: st.practice[t.id]?.work || "" }])),
      open: (pr.open || []).map((_, i) => topicState(topic.id).practiceDraft?.open?.[i] || ""),
      conclusion: topicState(topic.id).practiceDraft?.conclusion || "",
    };
    aiBtn.disabled = true;
    aiBtn.textContent = "🤖 AI tekshirmoqda… (10–30 soniya)";
    reviewBox.replaceChildren(h("div", { class: "card ai-thinking" }, h("div", { class: "sv-spinner" }), h("p", {}, "Sun'iy intellekt hisob-kitoblaringiz, yechim yo'lingiz va xulosalaringizni 10 ballik mezon bo'yicha tekshirmoqda…")));
    try {
      const res = await api.post(`practice/${topic.id}/review`, payload);
      const saved = { total: res.total, max: res.max, review: res.review, criteria: res.criteria, calc: res.calc, ai: res.ai, at: res.createdAt };
      updateTopic(topic.id, (s) => (s.aiReview = saved));
      reviewBox.replaceChildren(reviewView(saved));
      reviewBox.scrollIntoView({ behavior: "smooth", block: "start" });
      if (res.total >= 8) {
        const r = reviewBox.getBoundingClientRect();
        setTimeout(() => confetti(r.left + r.width / 2, r.top + 60), 300);
      }
    } catch (e) {
      reviewBox.replaceChildren(h("div", { class: "alert alert-error" }, e.message));
    } finally {
      aiBtn.disabled = false;
      aiBtn.textContent = "🤖 Qayta tekshirish";
    }
  }

  return h(
    "div",
    { class: "stack practice" },
    h("div", { class: "card plan-card" },
      h("h3", {}, "🎯 Mashg'ulot maqsadi"),
      h("p", {}, pr.goal),
      h("div", { class: "chips" }, pr.concepts.map((c) => h("span", { class: "chip chip-soft" }, c))),
      h("p", { class: "muted small" }, `Asosiy manba: A.N. Xoliqulov, “Turistik korxonalar faoliyati tahlili”, 2024, ${pr.source}. Shartli raqamlar dars mashqi uchun tuzilgan.`)),
    summary,
    taskCards,
    openBoxes.length > 0 && h("h3", { class: "practice-sub" }, "📁 Keys va tahliliy topshiriqlar"),
    openBoxes,
    h("div", { class: "card" }, h("h4", {}, "📝 Umumiy xulosa"), conclusion),
    h("div", { class: "card ai-card" },
      h("div", { class: "row between wrap" },
        h("div", {}, h("h3", {}, "🤖 Sun'iy intellekt asosida tekshirish"),
          h("p", { class: "muted small" }, "AI hisob-kitoblaringiz, yechim yo'lingiz, keys javoblari va xulosangizni tekshirib, 10 ballik mezon (formulalar — 3, aniqlik — 3, tahlil va xulosa — 2, keys — 1, mustaqillik — 1) bo'yicha baho va aniq tavsiyalar beradi. Natija o'qituvchiga ham ko'rinadi.")),
        aiBtn)),
    reviewBox
  );
}

function taskCard(topic, task, idx, st, onChange) {
  const saved = st.practice[task.id] || {};
  const inputs = task.fields.map((f, i) => h("input", { type: "text", inputmode: "decimal", class: "num-input", value: saved.values?.[i] ?? "", "aria-label": f.label, placeholder: "javob" }));
  const marks = task.fields.map(() => h("span", { class: "field-mark" }));
  const work = h("textarea", { rows: 2, placeholder: "Yechim yo'li (ixtiyoriy, AI tekshiruvi uchun foydali): formulalar va oraliq hisoblar..." }, saved.work || "");
  const solution = h("details", { class: "solution" }, h("summary", {}, "💡 Yechimni ko'rish"), h("p", {}, task.solution), task.note && h("p", { class: "alert alert-warn small" }, "⚠️ ", task.note));
  if (!saved.tries) solution.classList.add("locked");
  const status = h("span", { class: `badge ${saved.ok ? "badge-ok" : ""}` }, saved.ok ? "✓ To'g'ri" : saved.tries ? `Urinishlar: ${saved.tries}` : "Bajarilmagan");
  const persist = (patch) =>
    updateTopic(topic.id, (s) => {
      s.practice ||= {};
      s.practice[task.id] = { ...(s.practice[task.id] || {}), ...patch };
    });
  work.addEventListener("input", () => persist({ work: work.value }));
  const card = h(
    "article",
    { class: `card practice-task ${saved.ok ? "ok" : ""}` },
    h("div", { class: "row between wrap" }, h("h4", {}, `${idx + 1}. ${task.title}`), status),
    h("p", {}, task.text),
    task.formula && h("div", { class: "formula" }, "ƒ ", task.formula),
    h("div", { class: "field-grid" }, task.fields.map((f, i) => h("label", { class: "field-row" }, h("span", { class: "field-label" }, f.label), h("span", { class: "field-input" }, inputs[i], f.unit && h("span", { class: "unit" }, f.unit), marks[i])))),
    work,
    h("div", { class: "row wrap" },
      h("button", { class: "btn", onclick: () => {
        const values = inputs.map((x) => x.value.trim());
        if (values.every((v) => !v)) return toast("Javobni kiriting", "warn");
        const results = task.fields.map((f, i) => checkField(f, values[i]));
        results.forEach((ok, i) => {
          marks[i].textContent = ok ? "✓" : "✗";
          marks[i].className = `field-mark ${ok ? "ok" : "bad"}`;
        });
        const ok = results.every(Boolean);
        const tries = (topicState(topic.id).practice?.[task.id]?.tries || 0) + 1;
        const wasOk = topicState(topic.id).practice?.[task.id]?.ok;
        persist({ values, ok: ok || Boolean(wasOk), tries, at: new Date().toISOString() });
        status.textContent = ok || wasOk ? "✓ To'g'ri" : `Urinishlar: ${tries}`;
        status.className = `badge ${ok || wasOk ? "badge-ok" : ""}`;
        card.classList.toggle("ok", ok || Boolean(wasOk));
        solution.classList.remove("locked");
        if (ok) toast(wasOk ? "To'g'ri!" : "To'g'ri! +10 XP", "ok");
        else {
          shake(card);
          toast(`${results.filter(Boolean).length}/${results.length} ta javob to'g'ri. Formulani va o'lchov birligini tekshiring.`, "warn");
        }
        changed();
        onChange();
      } }, "Tekshirish"),
      solution)
  );
  return card;
}

export function reviewView(r) {
  const rv = r.review;
  const crit = r.criteria || [];
  const cls = r.total >= 8 ? "score-high" : r.total >= 6 ? "score-mid" : "score-low";
  const taskName = (id) => (id.startsWith("open-") ? `Keys ${id.slice(5)}` : id.replace(/^p\d+-/, "Masala "));
  return h(
    "div",
    { class: "card ai-review" },
    h("div", { class: "row wrap ai-review-head" },
      h("div", { class: `score-ring ${cls}`, style: { "--pct": (r.total / (r.max || 10)) * 100 } }, h("b", {}, `${r.total}/${r.max || 10}`), h("span", {}, "ball")),
      h("div", { class: "grow" },
        h("h3", {}, r.ai ? "🤖 AI tekshiruvi natijasi" : "🧮 Avtomatik tekshiruv natijasi"),
        h("p", {}, rv.summary),
        h("p", { class: "muted small" }, `${r.calc ? `Hisob-kitoblar: ${r.calc.correct}/${r.calc.total} to'g'ri · ` : ""}${r.at ? fmtDate(r.at) : ""}${rv.estimated ? " · taxminiy baho" : ""}`))),
    crit.length > 0 && h("div", { class: "crit-bars" }, crit.map((c) => {
      const v = rv.scores?.[c.key] ?? 0;
      return h("div", { class: "crit-row" }, h("span", { class: "crit-name" }, c.name), h("span", { class: "crit-bar" }, h("i", { style: { width: `${(v / c.max) * 100}%` } })), h("b", {}, `${v}/${c.max}`));
    })),
    rv.tasks?.length > 0 && h("details", { class: "ai-tasks", open: true }, h("summary", {}, h("b", {}, "Topshiriqlar bo'yicha izohlar")), h("ul", {}, rv.tasks.map((t) => h("li", {}, h("b", {}, `${taskName(t.id)}: `), t.comment)))),
    h("div", { class: "grid cols-3 ai-lists" },
      rv.strengths?.length > 0 && h("div", { class: "ai-list ok" }, h("h4", {}, "💪 Kuchli tomonlar"), h("ul", {}, rv.strengths.map((x) => h("li", {}, x)))),
      rv.mistakes?.length > 0 && h("div", { class: "ai-list bad" }, h("h4", {}, "⚠️ Xatolar"), h("ul", {}, rv.mistakes.map((x) => h("li", {}, x)))),
      rv.recommendations?.length > 0 && h("div", { class: "ai-list info" }, h("h4", {}, "🧭 Tavsiyalar"), h("ul", {}, rv.recommendations.map((x) => h("li", {}, x))))),
    r.teacher && h("div", { class: "alert alert-info" }, h("b", {}, `👩‍🏫 O'qituvchi (${r.teacher.by})${r.teacher.grade != null ? ` — ${r.teacher.grade}/10` : ""}: `), r.teacher.comment)
  );
}
