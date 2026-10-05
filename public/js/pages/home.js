import { h, mount } from "../ui.js";
import { session } from "../api.js";
import { COURSE, TOPICS } from "../../data/topics.js";
import { loadProgress, topicCompletion, loadGame } from "../progress.js";
import { dueCount } from "./review.js";
import { mountScene, LANDMARK_NAMES } from "../landmarks.js";
import { UPDATES, CHECKED } from "../../data/updates.js";

const SHOWCASE = [
  ["registan", "Samarqand"],
  ["khiva", "Xiva"],
  ["bukhara", "Buxoro"],
  ["guramir", "Samarqand"],
  ["shahizinda", "Samarqand"],
  ["aksaray", "Shahrisabz"],
];
const timeOfDay = () => {
  const hr = new Date().getHours();
  return hr >= 19 || hr < 6 ? "night" : hr >= 17 ? "sunset" : "day";
};

/** Bosh sahifa manzarasi: obidalar navbat bilan almashadi, sichqoncha bilan parallaks. */
function heroScene() {
  let i = 0;
  const time = timeOfDay();
  const stage = h("div", { class: "scene-stage" });
  const caption = h("div", { class: "scene-caption" });
  const dots = h("div", { class: "scene-dots", role: "tablist", "aria-label": "Obidalar" });
  let timer;
  const show = (n) => {
    i = (n + SHOWCASE.length) % SHOWCASE.length;
    const [key, city] = SHOWCASE[i];
    const layer = h("div", { class: "scene-layer entering" });
    mountScene(layer, { landmark: key, time });
    stage.append(layer);
    requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.remove("entering")));
    const old = [...stage.children].slice(0, -1);
    setTimeout(() => old.forEach((o) => o.remove()), 1300);
    caption.replaceChildren(h("b", {}, LANDMARK_NAMES[key]), h("span", {}, `📍 ${city}`));
    dots.querySelectorAll("button").forEach((d, k) => d.classList.toggle("active", k === i));
    clearInterval(timer);
    timer = setInterval(() => (stage.isConnected ? show(i + 1) : clearInterval(timer)), 7000);
  };
  SHOWCASE.forEach(([key], k) => dots.append(h("button", { "aria-label": LANDMARK_NAMES[key], onclick: () => show(k) })));
  const wrap = h(
    "div",
    { class: "hero-visual scene-frame" },
    stage,
    h("div", { class: "scene-vignette", "aria-hidden": "true" }),
    caption,
    dots,
    h("a", { href: "#/lab", class: "scene-cta" }, "🔬 Tahlil laboratoriyasi"),
    h("a", { href: "#/practice", class: "scene-cta second" }, "🧮 Amaliy mashg'ulotlar"),
    h("span", { class: "float-chip c1", "aria-hidden": "true" }, "📊 ROE · ROA"),
    h("span", { class: "float-chip c2", "aria-hidden": "true" }, "⚖️ Balans"),
    h("span", { class: "float-chip c3", "aria-hidden": "true" }, "🤖 AI tekshiruv")
  );
  show(0);
  return wrap;
}

export async function render(el) {
  const user = session.user;
  await loadProgress();
  const game = user?.role === "student" ? await loadGame() : null;
  const due = user?.role === "student" ? dueCount() : 0;
  const done = TOPICS.filter((t) => topicCompletion(t) === 100).length;
  const tests = TOPICS.reduce((s, t) => s + t.quiz.length, 0);
  const questions = TOPICS.reduce((s, t) => s + t.questions.length, 0);

  const tasks = TOPICS.reduce((s, t) => s + (t.practice?.tasks.length || 0), 0);
  const features = [
    ["📚", "Interaktiv mavzular", `${TOPICS.length} ta mavzu: o'quv qo'llanma matni (lotin yozuvida), dars taqdimotlari, tushunchalar, nazorat savollari, testlar va interaktiv metodlar.`, "#/topics"],
    ["🧮", "Amaliy mashg'ulotlar + AI tekshiruv", `${tasks} ta hisob-kitob masalasi darhol tekshiriladi; keys va xulosalaringizni sun'iy intellekt 10 ballik mezon bo'yicha baholab, batafsil feedback beradi.`, "#/practice"],
    ["🔬", "Tahlil laboratoriyasi", "Turistik korxona balansi va moliyaviy natijalarini kiriting — 30+ koeffitsiyent, DuPont, zararsizlik nuqtasi va grafiklar avtomatik hisoblanadi; hisobotingizni AI va o'qituvchi baholaydi.", "#/lab"],
    ["🎙️", "Tahlilchi trenajyori", "AI direktor, bank xodimi, investor yoki auditor rolini o'ynaydi — siz tahlil natijalarini real vaziyatda himoya qilasiz.", "#/trainer"],
    ["🔄", "Dolzarb ma'lumotlar", `Qo'llanmadagi eskirgan statistika va me'yoriy hujjatlar tekshirildi: ${UPDATES.length} ta yangilanish, rasmiy manbalar bilan (${CHECKED.split("-").reverse().join(".")} holatiga).`, "#/updates"],
    ["🧩", "Mustaqil ta'lim", "Shaxsiy o'quv rejasi, mustaqil ish topshiriqlari, o'qituvchi bahosi va refleksiv kundalik.", "#/self-study"],
    ["🎬", "Mediateka va audiokitob", "Animatsion darslar, 18 ta dars taqdimoti, video darslar va qo'llanma matnini o'zbekcha AI ovozida tinglash.", "#/media"],
    ["🎮", "Live viktorina", "Sinfda Kahoot uslubidagi jonli musobaqa va so'z buluti: PIN yoki QR-kod orqali qo'shiling.", "#/live"],
    ["🛂", "Tahlilchi pasporti", "XP, darajalar (Stajyor → Tahlil ustasi), nishonlar, reyting va kursni tugatganlik sertifikati.", "#/passport"],
  ];

  mount(
    el,
    h(
      "section",
      { class: "hero-xl" },
      h(
        "div",
        {},
        h("span", { class: "hero-chip" }, h("span", { class: "dot" }), COURSE.audience),
        h("h1", {}, h("span", { class: "gradient-text" }, "Turistik korxonalar"), h("br"), "faoliyati tahlili"),
        h("p", { class: "lead" }, COURSE.description),
        h(
          "div",
          { class: "row wrap" },
          h("a", { href: "#/topics", class: "btn lg" }, "📚 O'qishni boshlash"),
          h("a", { href: "#/practice", class: "btn ghost lg" }, "🧮 Amaliy mashg'ulotlar"),
          h("a", { href: "#/lab", class: "btn ghost lg" }, "🔬 Tahlil laboratoriyasi"),
          h("a", { href: "#/live", class: "btn ghost lg" }, "🎮 Live o'yin")
        ),
        h(
          "div",
          { class: "counter-row" },
          [[TOPICS.length, "mavzu"], [tests, "test savoli"], [tasks, "hisob-kitob masalasi"], [questions, "nazorat savoli"]].map(([n, l]) => h("div", { class: "counter" }, h("b", { "data-count": n }, "0"), h("span", {}, l)))
        )
      ),
      heroScene()
    ),
    user &&
      h(
        "div",
        { class: "card hero-card accent" },
        h("div", { class: "row between wrap" },
          h("div", { class: "row home-me" },
            game && h("a", { href: "#/passport", class: "home-level", title: "Tahlilchi pasporti", style: { "--p": game.level.pct } }, h("span", {}, game.level.icon)),
            h("div", {}, h("div", { class: "eyebrow" }, "Shaxsiy kabinet"), h("h3", {}, `Xush kelibsiz, ${user.name.split(" ")[0]}!`), h("p", { class: "muted small" }, game ? `${game.level.name} · ${game.xp} XP · 🔥 ${game.stats.streak} kunlik seriya · ${done}/${TOPICS.length} mavzu` : `${done} / ${TOPICS.length} mavzu to'liq o'zlashtirildi`))),
          h("div", { class: "row wrap" },
            game && h("a", { href: "#/review", class: `btn ${due ? "" : "ghost"}` }, `🔁 Takrorlash${due ? ` (${due})` : ""}`),
            h("a", { href: user.role === "teacher" ? "#/teacher" : "#/self-study", class: "btn" }, user.role === "teacher" ? "O'qituvchi paneli" : "O'quv rejam"),
            user.role === "student" && h("a", { href: "#/lab", class: "btn ghost" }, "🔬 Laboratoriya")))
      ),
    !user &&
      h("div", { class: "card hero-card accent" }, h("div", { class: "row between wrap" }, h("div", {}, h("h3", {}, "Profilingizni yarating"), h("p", { class: "muted small" }, "Email va parol orqali ro'yxatdan o'ting: progressingiz saqlanadi, AI tekshiruv, trenajyor va tahlil laboratoriyasi ochiladi.")), h("div", { class: "row" }, h("a", { href: "#/register", class: "btn" }, "Ro'yxatdan o'tish"), h("a", { href: "#/login", class: "btn ghost" }, "Kirish")))),
    h("h2", { class: "section-title" }, "Platforma imkoniyatlari"),
    h("section", { class: "grid cols-3" }, features.map(([icon, title, text, href]) => h("a", { href, class: "card feature tilt" }, h("div", { class: "feature-icon" }, icon), h("h3", {}, title), h("p", { class: "muted small" }, text)))),
    h(
      "section",
      { class: "card how" },
      h("h2", {}, "Platformada qanday o'qiladi?"),
      h(
        "ol",
        { class: "timeline" },
        [
          ["Nazariya", "Mavzuni qo'llanma matni, dars taqdimoti yoki animatsion dars orqali o'rganing; “Dolzarb” belgilarida eskirgan ma'lumotlarning yangi qiymatini ko'ring."],
          ["Mustahkamlash", "Tushunchalar kartalari, interaktiv metodlar va test (o'tish balli 60%)."],
          ["Amaliy mashg'ulot", "Hisob-kitob masalalarini yeching — javob darhol tekshiriladi; keys va xulosani yozib, AI dan 10 ballik feedback oling."],
          ["Tahlil laboratoriyasi", "Namuna yoki real korxonaning kompleks moliyaviy tahlilini bajarib, hisobotni AI va o'qituvchiga topshiring."],
          ["Trenajyor va reyting", "Tahlil natijalarini direktor, bank yoki investor oldida himoya qiling; XP to'plab sertifikat oling."],
        ].map(([t, d], i) => h("li", { class: "reveal" }, h("span", { class: "t-num" }, i + 1), h("b", {}, t), h("p", { class: "muted small" }, d)))
      )
    )
  );
}
