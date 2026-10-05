// Mediateka: barcha animatsion darslar, video darslar va taqdimotlar bir joyda.
import { h, mount, loading } from "../ui.js";
import { api } from "../api.js";
import { TOPICS } from "../../data/topics.js";
import { allVideos, videoCard } from "../media.js";
import { lessonPlayer } from "../lesson-player.js";
import { sceneSVG, LANDMARK_NAMES } from "../landmarks.js";
import { updateTopic, loadProgress } from "../progress.js";

function playerModal(topic) {
  const player = lessonPlayer(topic, { onComplete: () => updateTopic(topic.id, (s) => (s.watched = true)) });
  const close = () => {
    player.destroy();
    overlay.remove();
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => e.key === "Escape" && close();
  const overlay = h(
    "div",
    { class: "vm-overlay", onclick: (e) => e.target === overlay && close() },
    h("div", { class: "vm vm-wide", role: "dialog", "aria-modal": "true", "aria-label": topic.title }, h("div", { class: "vm-head" }, h("b", {}, `🎬 ${topic.num}. ${topic.title}`), h("button", { class: "icon-btn", "aria-label": "Yopish", onclick: close }, "✕")), player)
  );
  document.body.append(overlay);
  document.addEventListener("keydown", onKey);
  setTimeout(() => player.querySelector(".lp-poster")?.click(), 200);
}

export async function render(el) {
  mount(el, loading());
  await loadProgress();
  const [videos, uploaded] = await Promise.all([allVideos({ fresh: true }), api.get("slides").then((d) => d.slides).catch(() => [])]);
  // O'qituvchi joylagan taqdimotlar + platformaga o'rnatilgan dars taqdimotlari
  const slides = [...uploaded, ...TOPICS.filter((t) => t.deck && !uploaded.some((u) => u.topicId === t.id)).map((t) => ({ topicId: t.id, title: `${t.num}-mavzu taqdimoti`, kind: "pdf", pages: t.deckPages }))];
  let filter = "all";
  const grid = h("div");

  const section = (key, icon, title, items) =>
    (filter === "all" || filter === key) && items.length > 0 && h("section", { class: "media-sec" }, h("h2", { class: "section-title" }, icon, " ", title, h("span", { class: "media-count" }, items.length)), h("div", { class: key === "lessons" ? "media-lessons" : "video-grid" }, items));

  const draw = () => {
    const lessons = TOPICS.map((t) =>
      h(
        "button",
        { class: "lesson-tile tilt", onclick: () => playerModal(t) },
        t.image ? h("img", { src: t.image, alt: "", loading: "lazy" }) : h("div", { class: "lt-scene", html: sceneSVG({ landmark: ["registan", "khiva", "bukhara", "guramir"][t.num % 4], time: "sunset", animated: false, caravan: false }) }),
        h("span", { class: "lt-play" }, "▶"),
        h("span", { class: "lt-num" }, `${t.num}-mavzu`),
        h("b", {}, t.title)
      )
    );
    const vids = videos.map((v) => {
      const t = TOPICS.find((x) => x.id === v.topicId);
      return videoCard(v, t && h("a", { class: "vc-topic", href: `#/topics/${t.id}` }, `${t.icon} ${t.num}-mavzu`));
    });
    const slideCards = slides.map((s) => {
      const t = TOPICS.find((x) => x.id === s.topicId);
      return h("a", { class: "video-card slide-card", href: `#/topics/${s.topicId}?tab=slides` }, h("div", { class: "vc-thumb" }, t?.image ? h("img", { src: t.image, alt: "", loading: "lazy" }) : h("div", { class: "vc-ph" }, "🖥️"), h("span", { class: "vc-kind" }, s.kind === "pdf" ? `PDF · ${s.pages || "?"} slayd` : s.kind === "pptx" ? "PowerPoint" : "Havola")), h("div", { class: "vc-body" }, h("b", {}, s.title), t && h("small", { class: "muted" }, `${t.icon} ${t.num}-mavzu`)));
    });
    const gallery = [
      ...TOPICS.filter((t) => t.image).map((t) => ({ img: t.image, cap: `${t.num}-mavzu. ${t.title}` })),
      ...Object.keys(LANDMARK_NAMES).flatMap((k, i) => [{ svg: sceneSVG({ landmark: k, time: ["day", "sunset", "night"][i % 3], animated: true }), cap: `${LANDMARK_NAMES[k]} — illyustratsiya` }]),
    ].map((g, k) => h("figure", { "data-zoom": g.cap, class: "zoomable", style: { "--k": k } }, g.img ? h("img", { src: g.img, alt: g.cap, loading: "lazy" }) : h("div", { html: g.svg }), h("figcaption", {}, g.cap)));
    grid.replaceChildren(
      ...[
        section("lessons", "🎬", "Animatsion darslar", lessons),
        section("videos", "📹", "Video darslar", vids),
        section("slides", "🖥️", "Taqdimotlar", slideCards),
        (filter === "all" || filter === "gallery") && h("section", { class: "media-sec" }, h("h2", { class: "section-title" }, "🖼️ Galereya", h("span", { class: "media-count" }, gallery.length)), h("div", { class: "gallery" }, gallery)),
      ].filter(Boolean)
    );
    if (filter === "videos" && !vids.length) grid.append(h("div", { class: "card empty" }, h("div", { class: "empty-icon" }, "📹"), h("h3", {}, "Hali video darslar joylanmagan"), h("p", { class: "muted" }, "O'qituvchi panelidagi “Video darslar” bo'limida YouTube havolasi yoki video fayl qo'shiladi.")));
  };

  const tabs = h(
    "div",
    { class: "chips filter media-tabs" },
    [["all", "✨ Barchasi"], ["lessons", "🎬 Animatsion darslar"], ["videos", `📹 Video (${videos.length})`], ["slides", `🖥️ Taqdimotlar (${slides.length})`], ["gallery", "🖼️ Galereya"]].map(([k, l]) =>
      h("button", { class: `chip ${filter === k ? "active" : ""}`, onclick: (e) => {
        filter = k;
        tabs.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === e.currentTarget));
        draw();
      } }, l)
    )
  );

  mount(
    el,
    h(
      "section",
      { class: "media-hero" },
      h("div", { class: "media-hero-bg", html: sceneSVG({ landmark: "registan", time: "night" }) }),
      h(
        "div",
        { class: "media-hero-content" },
        h("div", { class: "eyebrow" }, "Mediateka"),
        h("h1", {}, "Ko'ring, tinglang, o'rganing"),
        h("p", { class: "lead" }, "18 ta animatsion dars, 18 ta dars taqdimoti, o'qituvchilar joylagan video darslar va qo'llanma audiokitobi — barchasi bir joyda."),
        h("div", { class: "row wrap" }, h("a", { class: "btn lg", href: "#/topics" }, "📚 Mavzularga o'tish"), h("a", { class: "btn lg ghost light", href: "#/practice" }, "🧮 Amaliy mashg'ulotlar"))
      )
    ),
    tabs,
    grid
  );
  draw();
}
