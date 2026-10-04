// "Amaliyot" bo'limi: 18 ta amaliy mashg'ulot ro'yxati, progress va AI tekshiruvlari tarixi.
import { h, mount, progressBar, fmtDate } from "../ui.js";
import { api, session } from "../api.js";
import { TOPICS } from "../../data/topics.js";
import { loadProgress, topicState } from "../progress.js";
import { practicePanel } from "../practice-ui.js";

export async function renderList(el) {
  await loadProgress();
  const history = session.user ? await api.get("practice/reviews").catch(() => null) : null;
  const items = TOPICS.filter((t) => t.practice);
  const totalTasks = items.reduce((s, t) => s + t.practice.tasks.length, 0);
  const solved = items.reduce((s, t) => s + t.practice.tasks.filter((k) => topicState(t.id).practice?.[k.id]?.ok).length, 0);
  const reviewed = items.filter((t) => topicState(t.id).aiReview).length;
  mount(
    el,
    h("div", { class: "page-head" },
      h("div", {}, h("h1", {}, "🧮 Amaliy mashg'ulotlar"), h("p", { class: "muted" }, `${items.length} ta mashg'ulot · ${totalTasks} ta hisob-kitob masalasi · keyslar · sun'iy intellekt asosida tekshiruv va feedback`))),
    h("div", { class: "grid cols-3" },
      stat("🧮", `${solved} / ${totalTasks}`, "to'g'ri yechilgan masala"),
      stat("🤖", `${reviewed} / ${items.length}`, "AI tekshiruvidan o'tgan mashg'ulot"),
      stat("🏅", history?.reviews?.length ? `${(history.reviews.reduce((s, r) => s + r.total, 0) / history.reviews.length).toFixed(1)} / 10` : "—", "AI bahosining o'rtachasi")),
    h("div", { class: "alert alert-info" }, "Qanday ishlaydi: 1) masalani yechib, javobni kiriting — u darhol tekshiriladi; 2) keys va xulosani yozing; 3) “🤖 AI bilan tekshirish” tugmasini bosing — sun'iy intellekt 10 ballik mezon bo'yicha baho, xatolaringiz va tavsiyalarni beradi. Natijalar o'qituvchi panelida ham ko'rinadi."),
    h("div", { class: "grid cols-2" },
      items.map((t) => {
        const st = topicState(t.id);
        const ok = t.practice.tasks.filter((k) => st.practice?.[k.id]?.ok).length;
        return h("a", { href: `#/practice/${t.id}`, class: "card topic-card tilt" },
          h("div", { class: "topic-num" }, t.icon, h("span", {}, `${t.num}-amaliy mashg'ulot`)),
          h("h3", {}, t.title),
          h("p", { class: "muted small clamp" }, t.practice.goal),
          h("div", { class: "row between small muted" }, h("span", {}, `🧮 ${t.practice.tasks.length} masala · 📁 ${t.practice.open?.length || 0} keys`), h("span", {}, st.aiReview ? `🤖 ${st.aiReview.total}/10` : "AI tekshiruvi yo'q")),
          progressBar(Math.round((ok / t.practice.tasks.length) * 100)));
      })),
    history?.reviews?.length > 0 && h("details", { class: "card" }, h("summary", {}, h("b", {}, `📜 AI tekshiruvlari tarixi (${history.reviews.length})`)),
      h("table", { class: "table" }, h("thead", {}, h("tr", {}, h("th", {}, "Sana"), h("th", {}, "Mavzu"), h("th", {}, "Hisob-kitob"), h("th", {}, "Baho"), h("th", {}, "O'qituvchi"))),
        h("tbody", {}, history.reviews.slice(0, 50).map((r) => {
          const t = TOPICS.find((x) => x.id === r.topicId);
          return h("tr", {}, h("td", {}, fmtDate(r.createdAt)), h("td", {}, h("a", { href: `#/practice/${r.topicId}` }, `${t?.num}. ${t?.title}`)), h("td", {}, `${r.calc.correct}/${r.calc.total}`), h("td", {}, h("b", {}, `${r.total}/10`), r.ai ? " 🤖" : ""), h("td", {}, r.teacher ? `${r.teacher.grade ?? "—"} · ${r.teacher.comment.slice(0, 60)}` : "—"));
        }))))
  );
}

function stat(icon, value, label) {
  return h("div", { class: "card stat-card" }, h("div", { class: "stat-icon" }, icon), h("b", { class: "stat-value" }, value), h("span", { class: "muted small" }, label));
}

export async function renderTopic(el, id) {
  await loadProgress();
  const idx = TOPICS.findIndex((t) => t.id === id);
  const topic = TOPICS[idx];
  if (!topic?.practice) throw new Error("Amaliy mashg'ulot topilmadi");
  const prev = TOPICS[idx - 1];
  const next = TOPICS[idx + 1];
  let teacherNote = null;
  if (session.user) {
    const hist = await api.get("practice/reviews").catch(() => null);
    teacherNote = hist?.reviews?.find((r) => r.topicId === topic.id && r.teacher);
  }
  mount(
    el,
    h("nav", { class: "crumbs" }, h("a", { href: "#/practice" }, "Amaliy mashg'ulotlar"), " / ", `${topic.num}-mashg'ulot`),
    h("div", { class: "page-head" }, h("div", {}, h("h1", {}, `${topic.icon} ${topic.num}-amaliy mashg'ulot`), h("p", { class: "lead" }, topic.title)), h("a", { href: `#/topics/${topic.id}`, class: "btn ghost" }, "📖 Mavzu nazariyasi")),
    teacherNote && h("div", { class: "alert alert-info" }, h("b", {}, `👩‍🏫 O'qituvchi izohi (${teacherNote.teacher.by})${teacherNote.teacher.grade != null ? ` — ${teacherNote.teacher.grade}/10` : ""}: `), teacherNote.teacher.comment),
    practicePanel(topic),
    h("div", { class: "lesson-pager" },
      prev?.practice ? h("a", { href: `#/practice/${prev.id}`, class: "pager-card" }, h("small", {}, "← Oldingi mashg'ulot"), h("b", {}, `${prev.num}. ${prev.title}`)) : h("span"),
      next?.practice ? h("a", { href: `#/practice/${next.id}`, class: "pager-card next" }, h("small", {}, "Keyingi mashg'ulot →"), h("b", {}, `${next.num}. ${next.title}`)) : h("span"))
  );
}
