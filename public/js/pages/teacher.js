// O'qituvchi (admin) paneli: umumiy ko'rsatkichlar, amaliy mashg'ulotlar (AI tekshiruvlari), tahlil laboratoriyasi
// hisobotlarini baholash, test tahlili, talabalar, trenajyor natijalari, mustaqil ishlar va o'quv kontenti.
import { h, mount, toast, loading, fmtDate, modal, confirmDialog, emptyState, downloadFile } from "../ui.js";
import { api } from "../api.js";
import { mean, sd, fmt, toCSV } from "../stats.js";
import { showSession, scoreClass } from "./trainer.js";
import { TOPICS } from "../../data/topics.js";
import { reviewView } from "../practice-ui.js";
import { analyze, pct, fmt as fmtN, LAB_SECTIONS } from "../finance.js";
import { slideViewer, uploadSlides, fmtSize } from "../slides.js";
import { allVideos, videoCard, uploadVideo, invalidateVideos } from "../media.js";
import { audioUrl, audioInfo, chunkText, ttsInfo, resetTtsInfo } from "../narrator.js";
import { buildScenes } from "../lesson-player.js";
import { bookParagraphs } from "../audiobook.js";
import { createForm } from "./live.js";

const COHORTS = { experimental: "Tajriba (TG)", control: "Nazorat (NG)", unassigned: "Belgilanmagan" };

// Panel bo'limlari galereyasi: guruh, belgi, tavsif va (bo'lsa) umumiy ko'rsatkichlardan jonli hisoblagich.
const GROUPS = [
  ["class", "🏫 Baholash va nazorat", 220],
  ["analysis", "📈 Tahlil", 200],
  ["content", "📚 O'quv kontenti", 32],
  ["live", "🎮 Interaktiv dars", 280],
];
const SECTIONS = [
  { key: "practice", icon: "🤖", title: "Amaliy mashg'ulotlar (AI)", group: "class", desc: "Talabalarning amaliy mashg'ulot natijalari, AI bahosi va feedbacki; o'qituvchi bahosi va izohi.", meta: (o) => `${o.practiceReviews} ta tekshiruv${o.avgPracticeScore !== null ? ` · o'rtacha ${o.avgPracticeScore}/10` : ""}` },
  { key: "labs", icon: "🔬", title: "Laboratoriya hisobotlari", group: "class", desc: "Kompleks tahlil loyihalarini 9 mezonli 100 ballik rubrika bilan baholash.", badge: (o) => o.labs.submitted && [`${o.labs.submitted} ta yangi`, "warn"], meta: (o) => `${o.labs.graded} tasi baholangan` },
  { key: "self-study", icon: "🧩", title: "Mustaqil ishlar", group: "class", desc: "Topshiriqlarni baholash va izoh yozish.", badge: (o) => o.ungraded && [`${o.ungraded} ta baholanmagan`, "warn"], meta: (o) => `${o.selfStudySubmissions} ta topshiriq` },
  { key: "trainer", icon: "🎙", title: "Trenajyor natijalari", group: "class", desc: "AI baholagan mashg'ulotlar, suhbat yozuvlari va mezonlar.", meta: (o) => `${o.trainerSessions} ta mashg'ulot${o.avgTrainerScore !== null ? ` · o'rtacha ${o.avgTrainerScore}` : ""}` },
  { key: "students", icon: "👥", title: "Talabalar", group: "class", desc: "Ro'yxat, guruhlar, progress va parolni tiklash.", meta: (o) => `${o.students} nafar` },
  { key: "items", icon: "📉", title: "Test tahlili", group: "analysis", desc: "Savollar qiyinligi, ajrata olish indeksi, distraktorlar va KR-20 ishonchliligi." },
  { key: "slides", icon: "🖥️", title: "Taqdimotlar", group: "content", desc: "18 ta dars taqdimoti o'rnatilgan; kerak bo'lsa mavzuga boshqa PDF, PowerPoint yoki havola joylang." },
  { key: "videos", icon: "📹", title: "Video darslar", group: "content", desc: "YouTube/Vimeo havolasi yoki video fayl yuklash." },
  { key: "voices", icon: "🔊", title: "AI ovozlar", group: "content", desc: "Platforma ovozini tanlash va ovozlarni oldindan tayyorlash." },
  { key: "live", icon: "🎮", title: "Jonli viktorina va so'z buluti", group: "live", desc: "Live: PIN/QR orqali sinf musobaqasi yoki jonli aqliy hujum." },
];
const RECENT_KEY = "tt.teacher.recent";
const readRecent = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").filter((k) => SECTIONS.some((x) => x.key === k));
  } catch {
    return [];
  }
};
function rememberSection(key) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([key, ...readRecent().filter((k) => k !== key)].slice(0, 4)));
  } catch {}
}
const sectionHref = (key) => `#/teacher/${key}`;

export async function render(el, tab = "", param) {
  const content = h("div");
  const views = { "": overview, practice: practiceReviews, labs: labProjects, slides: slidesManager, videos: videosManager, live: (el) => mount(el, createForm()), items: itemsView, voices: voicesManager, students, trainer, "self-study": selfStudy };
  const view = views[tab || ""];
  if (!view) throw new Error("Bo'lim topilmadi");
  const sec = SECTIONS.find((x) => x.key === tab);
  if (sec) {
    rememberSection(sec.key);
    const g = GROUPS.find(([k]) => k === sec.group);
    mount(
      el,
      h("div", { class: "tp-head", style: { "--hue": g[2] } },
        h("a", { class: "btn ghost small tp-back", href: "#/teacher" }, "← Barcha bo'limlar"),
        h("div", { class: "tp-title" }, h("span", { class: "tp-icon" }, sec.icon), h("div", {}, h("small", { class: "muted" }, g[1]), h("h1", {}, sec.title)))),
      h("nav", { class: "tp-tiles", "aria-label": "Panel bo'limlari" }, SECTIONS.map((x) => {
        const xg = GROUPS.find(([k]) => k === x.group);
        return h("a", { class: `tp-tile ${x.key === sec.key ? "active" : ""}`, href: sectionHref(x.key), style: { "--hue": xg[2] }, "aria-current": x.key === sec.key ? "page" : null }, h("span", {}, x.icon), h("b", {}, x.title));
      })),
      content
    );
  } else {
    mount(el, h("div", { class: "page-head" }, h("h1", {}, "O'qituvchi paneli"), h("a", { class: "btn", href: "#/qr" }, "📱 Kirish QR-kodi")), content);
  }
  mount(content, loading());
  await view(content, param);
}

/** Bo'limlar galereyasi. o — umumiy ko'rsatkichlar (hisoblagichlar uchun), bo'lmasa null. */
function gallery(o) {
  const query = { text: "" };
  const recent = readRecent();
  const card = (x, i) => {
    const g = GROUPS.find(([k]) => k === x.group);
    const badge = o && x.badge?.(o);
    return h("a", { class: "tp-card", href: sectionHref(x.key), "data-search": `${x.title} ${x.desc}`.toLowerCase(), style: { "--hue": g[2], "--i": i } },
      h("span", { class: "tp-card-icon" }, x.icon),
      h("b", { class: "tp-card-title" }, x.title),
      h("span", { class: "tp-card-desc" }, x.desc),
      o && x.meta ? h("small", { class: "tp-card-meta" }, x.meta(o)) : null,
      badge ? h("span", { class: `tp-card-badge ${badge[1]}` }, badge[0]) : null,
      h("span", { class: "tp-card-go", "aria-hidden": "true" }, "→"));
  };
  let n = 0;
  const groups = GROUPS.map(([gk, gl, hue]) => h("section", { class: "tp-group", "data-group": gk },
    h("h2", { class: "tp-group-title", style: { "--hue": hue } }, gl),
    h("div", { class: "tp-grid" }, SECTIONS.filter((x) => x.group === gk).map((x) => card(x, n++)))));
  const empty = h("p", { class: "muted hidden" }, "Bunday bo'lim topilmadi.");
  const search = h("input", { type: "search", class: "tp-search", placeholder: "🔍 Bo'limni qidirish…", oninput: (e) => {
    query.text = e.target.value.trim().toLowerCase();
    let any = false;
    for (const sec of groups) {
      let shown = 0;
      sec.querySelectorAll(".tp-card").forEach((c) => {
        const ok = !query.text || c.dataset.search.includes(query.text);
        c.classList.toggle("hidden", !ok);
        shown += ok;
      });
      sec.classList.toggle("hidden", !shown);
      any ||= shown > 0;
    }
    empty.classList.toggle("hidden", any);
  } });
  return h("div", { class: "tp-gallery" },
    h("div", { class: "tp-toolbar" },
      search,
      recent.length ? h("div", { class: "tp-recent" }, h("span", { class: "muted small" }, "So'nggi:"), recent.map((k) => {
        const x = SECTIONS.find((s) => s.key === k);
        return h("a", { class: "chip", href: sectionHref(k) }, `${x.icon} ${x.title}`);
      })) : null),
    ...groups,
    empty);
}

// ---------------- Umumiy ----------------

async function overview(el) {
  const o = await api.get("admin/overview");
  const card = (icon, value, label, href) => h(href ? "a" : "div", { class: "card stat-card", href }, h("div", { class: "stat-icon" }, icon), h("b", {}, value), h("span", { class: "muted small" }, label));
  mount(
    el,
    gallery(o),
    h("h2", { class: "tp-group-title", style: { "--hue": 220 } }, "📊 Umumiy ko'rsatkichlar"),
    !o.aiEnabled && h("div", { class: "alert alert-warn" }, "⚠️ AI kaliti ulanmagan: amaliy mashg'ulotlar va laboratoriya avtomatik qoidalar asosida taxminiy baholanadi, trenajyor demo-rejimda. Netlify sozlamalarida GEMINI_API_KEY (bepul) yoki ANTHROPIC_API_KEY o'zgaruvchisini qo'shing."),
    o.aiEnabled && h("p", { class: "muted small" }, `🤖 AI: ${o.aiProvider} · ${o.aiModel}`),
    h(
      "div",
      { class: "grid cols-4" },
      card("🎓", o.students, "talaba", "#/teacher/students"),
      card("🤖", o.practiceReviews, `amaliy mashg'ulot AI tekshiruvi${o.avgPracticeScore !== null ? ` · o'rtacha ${o.avgPracticeScore}/10` : ""}`, "#/teacher/practice"),
      card("🔬", o.labs.submitted, `laboratoriya hisoboti baholashni kutmoqda · ${o.labs.graded} tasi baholangan`, "#/teacher/labs"),
      card("🎙", o.trainerSessions, `trenajyor mashg'uloti${o.avgTrainerScore !== null ? ` · o'rtacha ${o.avgTrainerScore} ball` : ""}`, "#/teacher/trainer"),
      card("🧩", o.selfStudySubmissions, `mustaqil ish · ${o.ungraded} tasi baholanmagan`, "#/teacher/self-study")
    )
  );
}

// ---------------- Taqdimotlar ----------------

async function slidesManager(el) {
  const { slides } = await api.get("slides");
  const byTopic = Object.fromEntries(slides.map((x) => [x.topicId, x]));
  const kindLabel = { pdf: "PDF", pptx: "PowerPoint", link: "Havola" };

  const preview = (meta) => {
    const v = slideViewer(meta);
    const close = modal(meta.title, v, { wide: true });
    const obs = new MutationObserver(() => {
      if (!v.isConnected) {
        v.destroy?.();
        obs.disconnect();
      }
    });
    obs.observe(document.body, { childList: true });
    return close;
  };

  const row = (t) => {
    const status = h("div", { class: "sm-status" });
    const bar = h("div", { class: "sm-upload hidden" }, h("div", { class: "sm-upload-fill" }), h("span", {}, "0%"));
    const fileInput = h("input", { type: "file", accept: ".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation", class: "hidden", onchange: () => fileInput.files[0] && upload(fileInput.files[0]) });

    const drawStatus = () => {
      const m = byTopic[t.id];
      status.replaceChildren(
        m
          ? h("div", {}, h("span", { class: "badge badge-ok" }, kindLabel[m.kind]), " ", h("b", {}, m.title), h("div", { class: "muted small" }, [m.kind === "link" ? m.url : `${m.name} · ${fmtSize(m.size)}${m.pages ? ` · ${m.pages} slayd` : ""}`, ` · ${fmtDate(m.uploadedAt)}`]))
          : h("span", { class: "muted small" }, "Taqdimot joylanmagan")
      );
      actions.querySelector(".sm-view").disabled = !m;
      actions.querySelector(".sm-del").disabled = !m;
    };

    async function upload(file) {
      if (!/\.(pdf|pptx)$/i.test(file.name)) return toast("Faqat .pdf yoki .pptx fayl yuklang", "error");
      bar.classList.remove("hidden");
      card.classList.add("uploading");
      const setP = (f) => {
        bar.firstChild.style.transform = `scaleX(${f})`;
        bar.lastChild.textContent = `${Math.round(f * 100)}%`;
      };
      setP(0);
      try {
        byTopic[t.id] = await uploadSlides(t.id, file, { onProgress: setP });
        toast(`${t.num}-mavzu: taqdimot joylandi`, "ok");
        drawStatus();
      } catch (err) {
        toast(err.message, "error");
      } finally {
        card.classList.remove("uploading");
        setTimeout(() => bar.classList.add("hidden"), 600);
        fileInput.value = "";
      }
    }

    const linkForm = () => {
      const url = h("input", { type: "url", placeholder: "https://docs.google.com/presentation/d/...", required: true, value: byTopic[t.id]?.kind === "link" ? byTopic[t.id].url : "" });
      const title = h("input", { placeholder: "Taqdimot nomi", value: byTopic[t.id]?.title || t.title });
      const close = modal(
        `${t.num}-mavzu: havola orqali joylash`,
        h(
          "form",
          { onsubmit: async (e) => {
            e.preventDefault();
            try {
              byTopic[t.id] = await api.put(`admin/slides/${t.id}/link`, { url: url.value.trim(), title: title.value.trim() });
              toast("Taqdimot havolasi saqlandi", "ok");
              drawStatus();
              close();
            } catch (err) {
              toast(err.message, "error");
            }
          } },
          h("p", { class: "muted small" }, "Google Slides (Fayl → Ulashish → Internetda e'lon qilish), Canva (Ulashish → Ko'rish havolasi), OneDrive / PowerPoint Online (Joylashtirish havolasi) havolalarini qo'yishingiz mumkin. Havola hamma uchun ochiq bo'lishi kerak."),
          h("label", { class: "field" }, h("span", {}, "Havola"), url),
          h("label", { class: "field" }, h("span", {}, "Nomi"), title),
          h("div", { class: "row end" }, h("button", { class: "btn", type: "submit" }, "Saqlash"))
        )
      );
    };

    const actions = h(
      "div",
      { class: "row wrap sm-actions" },
      h("button", { class: "btn small", onclick: () => fileInput.click() }, "📤 Fayl yuklash"),
      h("button", { class: "btn small ghost", onclick: linkForm }, "🔗 Havola"),
      h("button", { class: "btn small ghost sm-view", onclick: () => preview(byTopic[t.id]) }, "👁 Ko'rish"),
      h("button", { class: "btn small ghost danger-text sm-del", onclick: async () => {
        if (!(await confirmDialog(`${t.num}-mavzu taqdimotini o'chirasizmi?`))) return;
        try {
          await api.del(`admin/slides/${t.id}`);
          delete byTopic[t.id];
          drawStatus();
          toast("Taqdimot o'chirildi", "ok");
        } catch (err) {
          toast(err.message, "error");
        }
      } }, "🗑")
    );

    const card = h(
      "div",
      {
        class: "card sm-row",
        ondragover: (e) => {
          e.preventDefault();
          card.classList.add("drag");
        },
        ondragleave: () => card.classList.remove("drag"),
        ondrop: (e) => {
          e.preventDefault();
          card.classList.remove("drag");
          const f = e.dataTransfer.files[0];
          if (f) upload(f);
        },
      },
      h("div", { class: "sm-thumb" }, t.image ? h("img", { src: t.image, alt: "" }) : t.icon),
      h("div", { class: "sm-main" }, h("div", { class: "eyebrow" }, `${t.num}-mavzu`), h("h3", {}, t.title), status, bar),
      actions,
      fileInput
    );
    drawStatus();
    return card;
  };

  mount(
    el,
    h(
      "div",
      { class: "alert alert-info" },
      h("b", {}, "Har bir mavzu uchun taqdimot joylang. "),
      "Talaba mavzuni ochganda taqdimot darsning boshida o'rnatilgan slayd ko'ruvchida chiqadi (varaqlash, to'liq ekran, avtomatik ko'rsatish). ",
      h("br"),
      "Eng yaxshi natija uchun ",
      h("b", {}, "PDF"),
      " yuklang (PowerPoint'da: Fayl → Eksport → PDF), eng ko'pi 60 MB. ",
      h("b", {}, ".pptx"),
      " fayllar (20 MB gacha) PowerPoint Online orqali ko'rsatiladi. Faylni kartaga sudrab tashlash ham mumkin."
    ),
    h("div", { class: "stack sm-list" }, TOPICS.map(row))
  );
}

// ---------------- Test tahlili (item-analiz) ----------------

const fmt2 = (v) => (v === null || v === undefined || Number.isNaN(v) ? "—" : v.toFixed(2).replace(".", ","));
const krText = (v) => (v === null ? "ma'lumot yetarli emas" : v >= 0.8 ? "a'lo" : v >= 0.7 ? "yaxshi" : v >= 0.6 ? "qoniqarli" : "past");
const dClass = (d) => (d === null ? "" : d < 0 ? "lv-bad" : d < 0.2 ? "lv-warn" : d < 0.3 ? "lv-mid" : "lv-good");
const dText = (d) => (d === null ? "—" : d < 0 ? "salbiy" : d < 0.2 ? "past" : d < 0.3 ? "qoniqarli" : d < 0.4 ? "yaxshi" : "a'lo");
const pText = (p) => (p === null ? "—" : p > 0.8 ? "oson" : p < 0.3 ? "qiyin" : "o'rtacha");

async function itemsView(el, topicParam) {
  let cohort = "all";
  const box = h("div");
  const seg = h("div", { class: "segmented" }, [["all", "Barchasi"], ["experimental", "TG"], ["control", "NG"]].map(([k, l]) => h("button", { class: `seg ${k === cohort ? "active" : ""}`, onclick: (e) => {
    cohort = k;
    seg.querySelectorAll(".seg").forEach((b) => b.classList.toggle("active", b === e.currentTarget));
    draw();
  } }, l)));
  const method = h("details", { class: "card small" }, h("summary", {}, h("b", {}, "ℹ️ Uslubiyat (klassik test nazariyasi)")),
    h("ul", {},
      h("li", {}, h("b", {}, "Qiyinlik indeksi p"), " — savolga to'g'ri javob bergan talabalar ulushi (0,3–0,8 — maqbul)."),
      h("li", {}, h("b", {}, "Ajrata olish indeksi D"), " = p(yuqori 27%) − p(past 27%); ≥0,4 a'lo, 0,3–0,39 yaxshi, 0,2–0,29 qoniqarli, <0,2 qayta ko'rib chiqish kerak, salbiy — kalitni tekshiring."),
      h("li", {}, h("b", {}, "r"), " — savol bali va qolgan savollar yig'indisi orasidagi korrelyatsiya (tuzatilgan point-biserial)."),
      h("li", {}, h("b", {}, "KR-20"), " — testning ichki izchilligi (ishonchliligi): ≥0,7 yaxshi."),
      h("li", {}, "Faqat ", h("b", {}, "birinchi urinish"), " javoblari olinadi (qayta topshirishlar natijani buzmasligi uchun). Ma'lumot yig'ish ushbu yangilanishdan keyin boshlanadi.")));

  async function draw() {
    box.replaceChildren(loading());
    const topicId = topicParam;
    if (!topicId) {
      const d = await api.get(`admin/items?cohort=${cohort}`);
      box.replaceChildren(h("div", { class: "card table-wrap" }, h("table", { class: "table" },
        h("thead", {}, h("tr", {}, h("th", {}, "Mavzu"), h("th", {}, "N"), h("th", {}, "O'rtacha"), h("th", {}, "KR-20"), h("th", {}, "Diqqat talab"), h("th", {}))),
        h("tbody", {}, d.topics.map((t) => h("tr", {},
          h("td", {}, `${t.num}. ${t.title}`),
          h("td", {}, t.n),
          h("td", {}, t.n ? `${Math.round(t.meanPct)}%` : "—"),
          h("td", {}, t.kr20 === null ? "—" : `${fmt2(t.kr20)} (${krText(t.kr20)})`),
          h("td", {}, t.critical ? h("span", { class: "badge badge-err" }, `⛔ ${t.critical} kalit?`) : null, " ", t.warn ? h("span", { class: "badge badge-warn" }, `⚠ ${t.warn}`) : t.n && !t.critical ? h("span", { class: "badge badge-ok" }, "✓") : "—"),
          h("td", {}, h("a", { class: "btn small ghost", href: `#/teacher/items/${t.id}` }, "Batafsil →"))))))));
      return;
    }
    const d = await api.get(`admin/items?topic=${topicId}&cohort=${cohort}`);
    const maxDist = Math.max(1, ...d.distribution);
    box.replaceChildren(
      h("nav", { class: "crumbs" }, h("a", { href: "#/teacher/items" }, "Test tahlili"), " / ", `${d.topic.num}-mavzu`),
      h("h3", {}, `${d.topic.num}. ${d.topic.title}`),
      d.n === 0
        ? h("div", { class: "alert alert-info" }, "Bu mavzu testini hali hech kim (birinchi urinishda) topshirmagan.")
        : h("div", { class: "stack" },
            d.n < 10 && h("div", { class: "alert alert-warn" }, `Hozircha ${d.n} ta javob — ishonchli xulosa uchun kamida 20–30 talaba kerak. Ko'rsatkichlar taxminiy.`),
            h("div", { class: "grid cols-4" },
              h("div", { class: "card stat-card" }, h("b", {}, d.n), h("span", { class: "muted small" }, "talaba (N)")),
              h("div", { class: "card stat-card" }, h("b", {}, `${fmt2(d.mean)} / ${d.k}`), h("span", { class: "muted small" }, `o'rtacha ball (${Math.round(d.meanPct)}%), SD = ${fmt2(d.sd)}`)),
              h("div", { class: "card stat-card" }, h("b", {}, fmt2(d.kr20)), h("span", { class: "muted small" }, `KR-20 ishonchlilik: ${krText(d.kr20)}`)),
              h("div", { class: "card stat-card" }, h("b", {}, d.items.filter((it) => it.flags.some((f) => f.level === "critical")).length), h("span", { class: "muted small" }, "kalitni tekshirish kerak bo'lgan savol"))),
            h("div", { class: "card" }, h("h4", {}, "Ballar taqsimoti"), h("div", { class: "ia-hist" }, d.distribution.map((c, sIdx) => h("div", { class: "ia-hcol", title: `${sIdx} ball: ${c} talaba` }, h("span", {}, c || ""), h("i", { style: { "--h": `${(c / maxDist) * 100}%` } }), h("small", {}, sIdx))))),
            h("div", { class: "card table-wrap" }, h("table", { class: "table ia-table" },
              h("thead", {}, h("tr", {}, h("th", {}, "#"), h("th", {}, "Savol"), h("th", {}, "Qiyinlik p"), h("th", {}, "Ajratish D"), h("th", {}, "r"), h("th", {}, "Variantlar tanlovi"))),
              h("tbody", {}, d.items.map((it) => h("tr", { class: it.flags.some((f) => f.level === "critical") ? "ia-critical" : "" },
                h("td", {}, it.index + 1),
                h("td", { class: "ia-q" }, h("details", {}, h("summary", {}, it.q.length > 90 ? `${it.q.slice(0, 88)}…` : it.q), h("ol", { type: "A" }, it.options.map((o, oi) => h("li", { class: oi === it.correct ? "ok-text" : "" }, o, oi === it.correct ? " ✓ (kalit)" : "")))),
                  it.flags.map((f) => h("div", { class: `ia-flag ${f.level}` }, f.level === "critical" ? "⛔ " : f.level === "warn" ? "⚠️ " : "ℹ️ ", f.text))),
                h("td", {}, h("div", { class: "ia-pbar" }, h("i", { style: { width: `${(it.p || 0) * 100}%` } })), h("small", {}, `${fmt2(it.p)} · ${pText(it.p)}`)),
                h("td", {}, h("span", { class: `ia-d ${dClass(it.D)}` }, fmt2(it.D)), h("small", { class: "muted" }, ` ${dText(it.D)}`)),
                h("td", {}, fmt2(it.r)),
                h("td", {}, h("div", { class: "ia-opts" }, it.counts.map((c, oi) => h("span", { class: `ia-opt ${oi === it.correct ? "key" : ""}`, title: `${"ABCDEF"[oi]}: ${c} ta (${Math.round((c / d.n) * 100)}%)`, style: { flex: `${Math.max(c, 0.4)}` } }, `${"ABCDEF"[oi]}${oi === it.correct ? "✓" : ""} ${c}`))))))))),
            h("button", { class: "btn ghost", onclick: () => downloadFile(`test-tahlili-${d.topic.id}.csv`, toCSV([["#", "Savol", "p", "D", "r", "Kalit", ...it0(d).map((_, i) => `${"ABCDEF"[i]} soni`), "Izoh"], ...d.items.map((it) => [it.index + 1, it.q, fmt2(it.p), fmt2(it.D), fmt2(it.r), "ABCDEF"[it.correct], ...it.counts, it.flags.map((f) => f.text).join("; ")])])) }, "⬇ CSV"))
    );
  }
  const it0 = (d) => d.items[0]?.options || [];
  mount(el, h("div", { class: "row between wrap" }, h("p", { class: "muted" }, "Mavzu testlari savollarining sifat tahlili: qiyinlik, ajrata olish qobiliyati, distraktorlar va ishonchlilik. Javob kalitidagi ehtimoliy xatolar avtomatik aniqlanadi."), seg), method, box);
  draw();
}

// ---------------- Talabalar ekskursiyalari ----------------

// ---------------- AI ovozlar (Gemini TTS) ----------------

async function voicesManager(el) {
  const st = await api.get("admin/tts");
  const fmtMin = (sec) => `${Math.floor(sec / 60)} daq ${Math.round(sec % 60)} s`;
  if (!st.enabled) {
    mount(el, h("div", { class: "alert alert-warn" }, h("b", {}, "AI ovozi o'chiq. "), "Netlify sozlamalarida GEMINI_API_KEY o'zgaruvchisini qo'shing — shundan keyin trenajyor, animatsion darslar va audiokitob o'zbek tilida tabiiy AI ovozida gapiradi."));
    return;
  }
  let voice = st.defaultVoice;
  const audio = new Audio();
  const voiceCards = h(
    "div",
    { class: "voice-cards" },
    st.voices.map((v) =>
      h("div", { class: `voice-card ${v.id === voice ? "active" : ""}`, "data-id": v.id },
        h("span", { class: "vc-avatar" }, v.gender === "female" ? "👩" : "👨"),
        h("b", {}, v.id), h("small", { class: "muted" }, v.label.split("— ")[1]),
        h("div", { class: "row" },
          h("button", { class: "btn small ghost", onclick: async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.textContent = "⏳";
            try {
              audio.src = await audioUrl("Assalomu alaykum! Men TurTahlil akademiyasining AI ovoziman. Bugun turistik korxona balansini iqtisodiy o'qishni o'rganamiz.", { voice: v.id, style: "guide" });
              await audio.play();
            } catch (err) {
              toast(err.message, "error");
            }
            btn.disabled = false;
            btn.textContent = "▶ Tinglash";
          } }, "▶ Tinglash"),
          h("button", { class: "btn small", onclick: async () => {
            try {
              await api.put("admin/tts", { voice: v.id });
              voice = v.id;
              resetTtsInfo();
              await ttsInfo();
              voiceCards.querySelectorAll(".voice-card").forEach((c) => c.classList.toggle("active", c.dataset.id === v.id));
              toast(`Platforma ovozi: ${v.id}`, "ok");
            } catch (err) {
              toast(err.message, "error");
            }
          } }, "Tanlash")))
    )
  );

  // Oldindan tayyorlash navbati
  const log = h("div", { class: "muted small" });
  const bar = h("div", { class: "sm-upload" }, h("div", { class: "sm-upload-fill" }), h("span", {}, "—"));
  let running = false;
  let stopRequested = false;
  const jobs = {
    lessons: () => TOPICS.flatMap((t) => buildScenes(t).flatMap((sc) => chunkText(sc.narration).map((text) => ({ text, style: "narrator" })))),
    ...Object.fromEntries(TOPICS.map((t) => [`book-${t.id}`, () => bookParagraphs(t).flatMap((p) => chunkText(p.text).map((text) => ({ text, style: "narrator" })))])),
  };
  const run = async (key, label) => {
    if (running) return toast("Navbat allaqachon ishlayapti", "warn");
    await ttsInfo();
    const list = jobs[key]();
    running = true;
    stopRequested = false;
    let done = 0;
    let fresh = 0;
    const setP = () => {
      bar.firstChild.style.transform = `scaleX(${done / list.length})`;
      bar.lastChild.textContent = `${label}: ${done} / ${list.length}`;
    };
    setP();
    for (const item of list) {
      if (stopRequested) break;
      for (let attempt = 0; ; attempt++) {
        try {
          const d = await audioInfo(item.text, { style: item.style });
          if (!d.cached) fresh++;
          break;
        } catch (err) {
          if (err.status === 429 && attempt < 40 && !stopRequested) {
            for (let s = 65; s > 0 && !stopRequested; s--) {
              log.textContent = `⏳ Gemini bepul limiti: ${s} soniyadan keyin davom etamiz (${done}/${list.length}). Sahifani ochiq qoldiring.`;
              await new Promise((r) => setTimeout(r, 1000));
            }
            continue;
          }
          log.textContent = `⚠️ ${err.message}`;
          stopRequested = true;
          break;
        }
      }
      done++;
      setP();
      log.textContent = `${fresh} ta yangi ovoz yaratildi, qolganlari keshda bor edi.`;
    }
    running = false;
    toast(stopRequested ? "Navbat to'xtatildi" : `${label}: tayyor!`, stopRequested ? "warn" : "ok");
  };

  mount(
    el,
    h("div", { class: "grid cols-4" },
      h("div", { class: "card stat-card" }, h("div", { class: "stat-icon" }, "🔊"), h("b", {}, "Yoqilgan"), h("span", { class: "muted small" }, `Model: ${st.models[0] || "—"}`)),
      h("div", { class: "card stat-card" }, h("div", { class: "stat-icon" }, "💾"), h("b", {}, st.cached), h("span", { class: "muted small" }, "keshdagi audio")),
      h("div", { class: "card stat-card" }, h("div", { class: "stat-icon" }, "⏱"), h("b", {}, fmtMin(st.seconds)), h("span", { class: "muted small" }, "umumiy davomiylik")),
      h("div", { class: "card stat-card" }, h("div", { class: "stat-icon" }, "📦"), h("b", {}, `${(st.bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`), h("span", { class: "muted small" }, "MP3 hajmi"))),
    st.lastError && h("div", { class: `alert ${st.lastError.status === 429 ? "alert-warn" : "alert-error"}` },
      h("b", {}, `Oxirgi Gemini xatosi (${fmtDate(st.lastError.at)}): `), st.lastError.message,
      st.lastError.quotaId && h("div", { class: "small" }, `Limit: ${st.lastError.quotaId}${st.lastError.model ? ` · model: ${st.lastError.model}` : ""}`),
      st.lastError.status === 429 && h("div", { class: "small" }, st.lastError.daily ? "Bepul tarifdagi kunlik TTS limiti tugagan. Ovozlar ertaga tiklanadi; doimiy foydalanish uchun Google AI Studio'da (Billing) to'lov rejimini yoqing — shunda limitlar ancha oshadi." : "Daqiqalik limit: platforma avtomatik kutib, qayta urinadi. Oldindan tayyorlangan ovozlar limitni sarflamaydi."),
      st.lastError.detail && h("details", { class: "small" }, h("summary", {}, "Batafsil"), h("code", {}, st.lastError.detail))),
    h("div", { class: "card" },
      h("h3", {}, "🎙 Platforma ovozi"),
      h("p", { class: "muted small" }, "Animatsion darslar va audiokitob shu ovoz bilan o'qiladi (trenajyor personajlari esa jinsiga qarab turli ovozlarda gapiradi). Har bir matn bir marta yaratilib, barcha talabalar uchun keshlanadi."),
      voiceCards),
    h("div", { class: "card stack" },
      h("h3", {}, "⚡ Ovozlarni oldindan tayyorlash"),
      h("p", { class: "muted small" }, "Gemini bepul tarifida TTS so'rovlari soni cheklangan. Ovozlarni oldindan tayyorlab qo'ysangiz, talabalar darhol tinglaydi va limit sarflanmaydi. Limit tugasa navbat avtomatik kutib, davom etadi — kerak bo'lsa ertaga qayta ishga tushiring: tayyorlanganlari o'tkazib yuboriladi."),
      h("div", { class: "row wrap" },
        h("button", { class: "btn", onclick: () => run("lessons", "Animatsion darslar") }, `🎬 Animatsion darslar (${jobs.lessons().length})`),
        h("button", { class: "btn ghost danger-text", onclick: () => (stopRequested = true) }, "⏹ To'xtatish")),
      h("div", { class: "row wrap" }, h("span", { class: "muted small" }, "🎧 Audiokitob:"), TOPICS.map((t) => h("button", { class: "chip", title: t.title, onclick: () => run(`book-${t.id}`, `${t.num}-mavzu audiokitobi`) }, `${t.num}-mavzu`))),
      bar,
      log)
  );
}

// ---------------- Video darslar ----------------

async function videosManager(el) {
  const videos = await allVideos({ fresh: true });
  const byTopic = {};
  for (const v of videos) (byTopic[v.topicId] ||= []).push(v);

  const row = (t) => {
    const list = h("div", { class: "video-grid compact" });
    const bar = h("div", { class: "sm-upload hidden" }, h("div", { class: "sm-upload-fill" }), h("span", {}, "0%"));
    const drawList = () => {
      const items = byTopic[t.id] || [];
      list.replaceChildren(
        ...(items.length
          ? items.map((v) =>
              videoCard(v, h("div", { class: "row wrap vc-admin" },
                h("button", { class: "btn small ghost", onclick: async () => {
                  const title = prompt("Video nomi:", v.title);
                  if (title === null) return;
                  try {
                    Object.assign(v, await api.put(`admin/videos/${t.id}/${v.id}`, { title }));
                    invalidateVideos();
                    drawList();
                  } catch (e) {
                    toast(e.message, "error");
                  }
                } }, "✏️"),
                h("button", { class: "btn small ghost danger-text", onclick: async () => {
                  if (!(await confirmDialog(`“${v.title}” videosini o'chirasizmi?`))) return;
                  try {
                    await api.del(`admin/videos/${t.id}/${v.id}`);
                    byTopic[t.id] = byTopic[t.id].filter((x) => x.id !== v.id);
                    invalidateVideos();
                    drawList();
                    toast("Video o'chirildi", "ok");
                  } catch (e) {
                    toast(e.message, "error");
                  }
                } }, "🗑")))
            )
          : [h("p", { class: "muted small" }, "Hali video yo'q")])
      );
    };
    const fileInput = h("input", { type: "file", accept: "video/mp4,video/webm,video/ogg,.mp4,.webm,.mov", class: "hidden", onchange: async () => {
      const f = fileInput.files[0];
      if (!f) return;
      bar.classList.remove("hidden");
      const setP = (x) => {
        bar.firstChild.style.transform = `scaleX(${x})`;
        bar.lastChild.textContent = `${Math.round(x * 100)}%`;
      };
      setP(0);
      try {
        const v = await uploadVideo(t.id, f, { onProgress: setP });
        (byTopic[t.id] ||= []).push(v);
        invalidateVideos();
        drawList();
        toast(`${t.num}-mavzu: video joylandi`, "ok");
      } catch (e) {
        toast(e.message, "error");
      } finally {
        setTimeout(() => bar.classList.add("hidden"), 600);
        fileInput.value = "";
      }
    } });
    const addLink = () => {
      const url = h("input", { type: "url", required: true, placeholder: "https://www.youtube.com/watch?v=..." });
      const title = h("input", { placeholder: "Video nomi", required: true });
      const desc = h("textarea", { rows: 2, placeholder: "Qisqa izoh (ixtiyoriy)" });
      const close = modal(
        `${t.num}-mavzu: video havolasi`,
        h("form", { onsubmit: async (e) => {
          e.preventDefault();
          try {
            const v = await api.post(`admin/videos/${t.id}/link`, { url: url.value.trim(), title: title.value.trim(), description: desc.value.trim() });
            (byTopic[t.id] ||= []).push(v);
            invalidateVideos();
            drawList();
            close();
            toast("Video qo'shildi", "ok");
          } catch (err) {
            toast(err.message, "error");
          }
        } },
          h("p", { class: "muted small" }, "YouTube (oddiy, Shorts yoki youtu.be havola), Vimeo yoki to'g'ridan-to'g'ri .mp4 havolasi. YouTube videolari platformada o'rnatilgan pleyerda ochiladi."),
          h("label", { class: "field" }, h("span", {}, "Havola"), url),
          h("label", { class: "field" }, h("span", {}, "Nomi"), title),
          h("label", { class: "field" }, h("span", {}, "Izoh"), desc),
          h("div", { class: "row end" }, h("button", { class: "btn", type: "submit" }, "Qo'shish")))
      );
    };
    drawList();
    return h(
      "div",
      { class: "card vm-row" },
      h("div", { class: "row between wrap" }, h("div", {}, h("div", { class: "eyebrow" }, `${t.num}-mavzu`), h("h3", {}, t.title)), h("div", { class: "row wrap" }, h("button", { class: "btn small", onclick: addLink }, "🔗 YouTube / havola"), h("button", { class: "btn small ghost", onclick: () => fileInput.click() }, "📤 Video fayl"), fileInput)),
      bar,
      list
    );
  };

  mount(
    el,
    h("div", { class: "alert alert-info" }, h("b", {}, "Har bir mavzuga bir nechta video dars qo'shing. "), "Eng qulayi — videoni YouTube'ga joylab, havolasini qo'shish. Kichik videolarni (MP4/WebM, 80 MB gacha) to'g'ridan-to'g'ri yuklash ham mumkin: muqova rasmi va davomiylik avtomatik aniqlanadi. Videolar mavzu sahifasida va “Mediateka”da chiqadi."),
    h("div", { class: "stack" }, TOPICS.map(row))
  );
}

// ---------------- Natijalar ----------------


/** Guruhlangan ustunli diagramma (foizlarda). series: [{name, values:[count per level]}] */
// ---------------- Tajriba-sinov tahlili ----------------



// ---------------- Talabalar ----------------

async function students(el) {
  const users = await api.get("admin/students");
  const list = users.filter((u) => u.role === "student");
  const teachers = users.filter((u) => u.role === "teacher");
  const groups = [...new Set(list.map((u) => u.group).filter(Boolean))].sort();
  const q = { text: "", group: "" };
  const tbody = h("tbody");

  const setCohort = async (u, cohort) => {
    const res = await api.put(`admin/students/${u.id}`, { cohort });
    u.cohort = res.cohort;
  };

  const draw = () => {
    const rows = list.filter((u) => (!q.group || u.group === q.group) && (!q.text || `${u.name} ${u.email}`.toLowerCase().includes(q.text)));
    tbody.replaceChildren(
      ...rows.map((u) =>
        h(
          "tr",
          {},
          h("td", {}, u.name),
          h("td", {}, u.email),
          h("td", {}, u.group || "—"),
          h("td", {}, u.college || "—"),
          h("td", {}, fmtDate(u.createdAt)),
          h("td", {}, h("select", { class: `cohort-${u.cohort || "unassigned"}`, onchange: async (e) => {
            try {
              await setCohort(u, e.target.value);
              e.target.className = `cohort-${u.cohort}`;
              toast("Saqlandi", "ok");
            } catch (ex) {
              toast(ex.message, "error");
            }
          } }, Object.entries(COHORTS).map(([k, v]) => h("option", { value: k, selected: (u.cohort || "unassigned") === k }, v))), u.cohortSource === "self" && h("div", { class: "muted small" }, "talaba o'zi tanlagan")),
          h("td", {}, h("button", { class: "btn small ghost", title: "Parolni tiklash (vaqtinchalik parol berish)", onclick: async (e) => {
            if (!confirm(`${u.name} uchun yangi vaqtinchalik parol yaratilsinmi? Eski parol ishlamay qoladi.`)) return;
            try {
              const { password } = await api.post(`admin/students/${u.id}/password`, {});
              e.target.closest("td").replaceChildren(h("code", { class: "temp-pass", title: "Talabaga bering; u kirgach Profil sahifasida o'zgartiradi" }, password), h("button", { class: "btn small ghost", onclick: () => navigator.clipboard?.writeText(password).then(() => toast("Nusxa olindi", "ok")) }, "📋"));
            } catch (ex) {
              toast(ex.message, "error");
            }
          } }, "🔑"))
        )
      )
    );
    if (!rows.length) tbody.append(h("tr", {}, h("td", { colspan: 7, class: "muted center" }, "Talabalar topilmadi")));
  };

  const bulkGroup = h("select", {}, h("option", { value: "" }, "Guruhni tanlang"), groups.map((g) => h("option", { value: g }, g)));
  const bulkCohort = h("select", {}, Object.entries(COHORTS).map(([k, v]) => h("option", { value: k }, v)));

  draw();
  mount(
    el,
    h(
      "div",
      { class: "card" },
      h("h3", {}, "Tadqiqot guruhlarini belgilash"),
      h("p", { class: "muted small" }, "Butun o'quv guruhini bir vaqtda Tajriba (TG) yoki Nazorat (NG) guruhiga biriktiring. Trenajyor va test tahlili shu bo'linma kesimida ko'rsatiladi."),
      h("div", { class: "row wrap" }, bulkGroup, "→", bulkCohort, h("button", { class: "btn", onclick: async () => {
        if (!bulkGroup.value) return toast("Guruhni tanlang", "warn");
        const targets = list.filter((u) => u.group === bulkGroup.value);
        await Promise.all(targets.map((u) => setCohort(u, bulkCohort.value)));
        toast(`${targets.length} nafar talaba ${COHORTS[bulkCohort.value]} ga biriktirildi`, "ok");
        draw();
      } }, "Biriktirish"))
    ),
    h(
      "div",
      { class: "card table-wrap" },
      h(
        "div",
        { class: "row wrap" },
        h("input", { type: "search", placeholder: "Ism yoki email bo'yicha qidirish", oninput: (e) => ((q.text = e.target.value.toLowerCase()), draw()) }),
        h("select", { onchange: (e) => ((q.group = e.target.value), draw()) }, h("option", { value: "" }, "Barcha guruhlar"), groups.map((g) => h("option", { value: g }, g))),
        h("div", { class: "grow" }),
        h("span", { class: "muted small" }, `Jami: ${list.length} talaba`),
        h("button", { class: "btn ghost", onclick: () => downloadFile("oquvchilar.csv", toCSV([["F.I.Sh.", "Email", "Guruh", "Muassasa", "Tadqiqot guruhi", "Ro'yxatdan o'tgan"], ...list.map((u) => [u.name, u.email, u.group, u.college, COHORTS[u.cohort || "unassigned"], fmtDate(u.createdAt)])])) }, "⬇ CSV")
      ),
      h("table", { class: "table" }, h("thead", {}, h("tr", {}, h("th", {}, "F.I.Sh."), h("th", {}, "Email"), h("th", {}, "Guruh"), h("th", {}, "Muassasa"), h("th", {}, "Ro'yxatdan o'tgan"), h("th", {}, "Tadqiqot guruhi"), h("th", {}, "Parol"))), tbody)
    ),
    teachers.length > 0 && h("div", { class: "card" }, h("h3", {}, `O'qituvchilar (${teachers.length})`), h("ul", {}, teachers.map((t) => h("li", {}, `${t.name} — ${t.email}${t.college ? ` (${t.college})` : ""}`))))
  );
}

// ---------------- Trenajyor natijalari ----------------

async function trainer(el) {
  const [sessions, { criteria, scenarios }] = await Promise.all([api.get("admin/trainer-sessions"), api.get("trainer/scenarios")]);
  if (!sessions.length) return mount(el, emptyState("🎙", "Hali trenajyor mashg'ulotlari yo'q"));
  const f = { scenario: "", cohort: "" };
  const out = h("div", { class: "stack" });
  const draw = () => {
    const rs = sessions.filter((s) => (!f.scenario || s.scenarioId === f.scenario) && (!f.cohort || (s.user.cohort || "unassigned") === f.cohort));
    const cohortKeys = Object.keys(COHORTS).filter((k) => rs.some((s) => (s.user.cohort || "unassigned") === k));
    out.replaceChildren(
      h(
        "div",
        { class: "card table-wrap" },
        h("h3", {}, "Mezonlar bo'yicha o'rtacha ball"),
        h(
          "table",
          { class: "table" },
          h("thead", {}, h("tr", {}, h("th", {}, "Mezon"), cohortKeys.map((k) => h("th", {}, COHORTS[k])), h("th", {}, `Jami (n=${rs.length})`))),
          h(
            "tbody",
            {},
            [...criteria.map((c) => [`${c.title} (${c.max})`, (s) => s.evaluation.scores[c.key]]), [h("b", {}, "Umumiy ball (100)"), (s) => s.total]].map(([title, get]) =>
              h("tr", {}, h("td", {}, title), [...cohortKeys.map((k) => rs.filter((s) => (s.user.cohort || "unassigned") === k)), rs].map((g) => h("td", {}, g.length ? `${fmt(mean(g.map(get)), 1)} ± ${fmt(sd(g.map(get)), 1)}` : "—")))
            )
          )
        )
      ),
      h(
        "div",
        { class: "card table-wrap" },
        h(
          "table",
          { class: "table" },
          h("thead", {}, h("tr", {}, h("th", {}, "Sana"), h("th", {}, "Talaba"), h("th", {}, "Guruh"), h("th", {}, "Ssenariy"), h("th", {}, "Ball"), h("th", {}, "Davomiylik"), h("th", {}, "Maslahat"), h("th", {}))),
          h(
            "tbody",
            {},
            rs.map((s) =>
              h(
                "tr",
                {},
                h("td", {}, fmtDate(s.createdAt)),
                h("td", {}, s.user.name),
                h("td", {}, s.user.group || "—"),
                h("td", {}, s.scenarioTitle),
                h("td", {}, h("b", { class: scoreClass(s.total) }, s.total)),
                h("td", {}, `${Math.round(s.durationSec / 60)} daq`),
                h("td", {}, s.hintsUsed),
                h("td", {}, h("button", { class: "btn small ghost", onclick: () => showSession(s) }, "Ko'rish"))
              )
            )
          )
        )
      ),
      h("div", { class: "row end" }, h("button", { class: "btn ghost", onclick: () => downloadFile("trenajyor-natijalari.csv", toCSV([["Sana", "Talaba", "Guruh", "Tadqiqot guruhi", "Ssenariy", ...criteria.map((c) => c.title), "Umumiy ball", "Davomiylik (daq)", "Maslahatlar"], ...rs.map((s) => [fmtDate(s.createdAt), s.user.name, s.user.group, COHORTS[s.user.cohort || "unassigned"], s.scenarioTitle, ...criteria.map((c) => s.evaluation.scores[c.key]), s.total, Math.round(s.durationSec / 60), s.hintsUsed])])) }, "⬇ CSV"))
    );
  };
  mount(
    el,
    h(
      "div",
      { class: "card row wrap filter-bar" },
      h("label", { class: "field" }, h("span", {}, "Ssenariy"), h("select", { onchange: (e) => ((f.scenario = e.target.value), draw()) }, h("option", { value: "" }, "Barchasi"), scenarios.map((s) => h("option", { value: s.id }, s.title)))),
      h("label", { class: "field" }, h("span", {}, "Tadqiqot guruhi"), h("select", { onchange: (e) => ((f.cohort = e.target.value), draw()) }, h("option", { value: "" }, "Barchasi"), Object.entries(COHORTS).map(([k, v]) => h("option", { value: k }, v))))
    ),
    out
  );
  draw();
}

// ---------------- Mustaqil ishlar ----------------

async function selfStudy(el) {
  const items = await api.get("admin/self-study");
  if (!items.length) return mount(el, emptyState("🧩", "Hali mustaqil ishlar topshirilmagan"));
  let onlyPending = true;
  const list = h("div", { class: "stack" });
  const draw = () => {
    const rs = items.filter((i) => !onlyPending || i.grade == null || i.resubmitted);
    list.replaceChildren(
      ...rs.map((it) =>
        h(
          "div",
          { class: "card" },
          h("div", { class: "row between wrap" }, h("div", {}, h("b", {}, it.taskTitle), h("div", { class: "muted small" }, `${it.topicTitle} · ${it.user.name} (${it.user.group || "—"}) · ${fmtDate(it.submittedAt)}`)), it.grade != null ? h("span", { class: `badge ${it.resubmitted ? "badge-warn" : "badge-ok"}` }, it.resubmitted ? `Qayta topshirilgan (avval: ${it.grade})` : `Baho: ${it.grade}`) : h("span", { class: "badge badge-warn" }, "Baholanmagan")),
          it.text && h("p", { class: "pre-wrap" }, it.text),
          it.link && h("p", {}, "🔗 ", h("a", { href: it.link, target: "_blank", rel: "noopener noreferrer" }, it.link)),
          gradeForm(it, draw)
        )
      )
    );
    if (!rs.length) list.append(emptyState("✅", "Barcha ishlar baholangan"));
  };
  mount(el, h("label", { class: "check" }, h("input", { type: "checkbox", checked: true, onchange: (e) => ((onlyPending = e.target.checked), draw()) }), "Faqat baholanmaganlarni ko'rsatish"), list);
  draw();
}

function gradeForm(it, redraw) {
  const grade = h("select", {}, [5, 4, 3, 2].map((g) => h("option", { value: g, selected: it.grade === g }, g)));
  const fb = h("textarea", { rows: 2, placeholder: "Talabaga izoh va tavsiyalar" }, it.feedback || "");
  return h(
    "div",
    { class: "row wrap grade-form" },
    h("label", { class: "field" }, h("span", {}, "Baho"), grade),
    h("label", { class: "field grow" }, h("span", {}, "Izoh"), fb),
    h("button", { class: "btn", onclick: async () => {
      try {
        const res = await api.put(`admin/self-study/${it.userId}/${it.taskId}`, { grade: Number(grade.value), feedback: fb.value });
        Object.assign(it, res);
        toast("Baho saqlandi", "ok");
        redraw();
      } catch (ex) {
        toast(ex.message, "error");
      }
    } }, "Baholash")
  );
}





// ---------------- Tadqiqot arxivi (dissertatsiya III bobi) ----------------


// ---------------- Amaliy mashg'ulotlar: AI tekshiruvlari ----------------

async function practiceReviews(el) {
  const { reviews, criteria } = await api.get("admin/practice-reviews");
  if (!reviews.length) return mount(el, emptyState("🤖", "Hali AI tekshiruvlari yo'q", "Talabalar mavzu oxiridagi amaliy mashg'ulotni bajarib, “AI bilan tekshirish” tugmasini bosganda natijalar shu yerda chiqadi."));
  const topicSel = h("select", {}, h("option", { value: "" }, "Barcha mavzular"), TOPICS.filter((t) => t.practice).map((t) => h("option", { value: t.id }, `${t.num}. ${t.title}`)));
  const groupSel = h("select", {}, h("option", { value: "" }, "Barcha guruhlar"), [...new Set(reviews.map((r) => r.user?.group).filter(Boolean))].map((g) => h("option", { value: g }, g)));
  const lastOnly = h("input", { type: "checkbox", checked: true });
  const list = h("div");
  const filtered = () => {
    let rs = reviews.filter((r) => (!topicSel.value || r.topicId === topicSel.value) && (!groupSel.value || r.user?.group === groupSel.value));
    if (lastOnly.checked) {
      const seen = new Set();
      rs = rs.filter((r) => {
        const k = `${r.userId}/${r.topicId}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }
    return rs;
  };
  const draw = () => {
    const rs = filtered();
    const avg = rs.length ? (rs.reduce((s, r) => s + r.total, 0) / rs.length).toFixed(1) : "—";
    const byTopic = TOPICS.filter((t) => t.practice).map((t) => {
      const xs = rs.filter((r) => r.topicId === t.id);
      return [t, xs.length, xs.length ? xs.reduce((s, r) => s + r.total, 0) / xs.length : null];
    }).filter(([, n]) => n);
    list.replaceChildren(
      h("p", { class: "muted" }, `${rs.length} ta natija · o'rtacha ${avg}/10`),
      byTopic.length > 1 && h("div", { class: "card" }, h("h4", {}, "Mavzular bo'yicha o'rtacha AI bahosi"), h("div", { class: "crit-bars" }, byTopic.map(([t, n, m]) => h("div", { class: "crit-row" }, h("span", { class: "crit-name" }, `${t.num}. ${t.title} (${n})`), h("span", { class: "crit-bar" }, h("i", { style: { width: `${m * 10}%` } })), h("b", {}, m.toFixed(1)))))),
      h("div", { class: "card table-wrap" }, h("table", { class: "table" },
        h("thead", {}, h("tr", {}, ["Sana", "Talaba", "Guruh", "Mavzu", "Hisob-kitob", "AI baho", "O'qituvchi", ""].map((t) => h("th", {}, t)))),
        h("tbody", {}, rs.map((r) => {
          const t = TOPICS.find((x) => x.id === r.topicId);
          return h("tr", {}, h("td", {}, fmtDate(r.createdAt)), h("td", {}, r.user?.name), h("td", {}, r.user?.group || "—"), h("td", {}, `${t?.num}. ${t?.title}`), h("td", {}, `${r.calc.correct}/${r.calc.total}`), h("td", {}, h("b", {}, `${r.total}/10`), r.ai ? " 🤖" : " ~"), h("td", {}, r.teacher ? `${r.teacher.grade ?? "—"}/10` : "—"), h("td", {}, h("button", { class: "btn small", onclick: () => practiceModal(r, criteria, () => practiceReviews(el)) }, "Ko'rish")));
        })))),
      h("div", { class: "row end" }, h("button", { class: "btn ghost", onclick: () => downloadFile("amaliy-mashgulotlar-ai.csv", toCSV([["Sana", "Talaba", "Guruh", "Mavzu", "To'g'ri hisob-kitob", "Jami hisob-kitob", ...criteria.map((c) => `${c.name} (${c.max})`), "AI baho (10)", "AI", "O'qituvchi bahosi", "O'qituvchi izohi"], ...rs.map((r) => [r.createdAt.slice(0, 10), r.user?.name, r.user?.group, TOPICS.find((x) => x.id === r.topicId)?.num, r.calc.correct, r.calc.total, ...criteria.map((c) => r.review.scores?.[c.key] ?? ""), r.total, r.ai ? "ha" : "taxminiy", r.teacher?.grade ?? "", r.teacher?.comment ?? ""])])) }, "⬇ CSV (Excel)"))
    );
  };
  [topicSel, groupSel, lastOnly].forEach((x) => x.addEventListener("change", draw));
  mount(el, h("div", { class: "row wrap" }, topicSel, groupSel, h("label", { class: "check" }, lastOnly, "Har bir talabaning faqat oxirgi urinishi")), list);
  draw();
}

function practiceModal(r, criteria, reload) {
  const t = TOPICS.find((x) => x.id === r.topicId);
  const grade = h("input", { type: "number", min: 0, max: 10, step: 0.5, class: "w-xs", value: r.teacher?.grade ?? r.total });
  const comment = h("textarea", { rows: 3, placeholder: "Talabaga izoh (u amaliy mashg'ulot sahifasida ko'rinadi)" }, r.teacher?.comment || "");
  const answers = h("details", {}, h("summary", {}, h("b", {}, "Talaba javoblari")),
    h("ol", { class: "small" }, (t?.practice?.tasks || []).map((task) => {
      const a = r.answers?.tasks?.find((x) => x.id === task.id);
      return h("li", {}, h("b", {}, task.title), ": ", a?.values?.filter(Boolean).join(" · ") || "—", a?.ok ? " ✓" : a?.values?.some(Boolean) ? " ✗" : "", a?.work && h("div", { class: "muted" }, "Yechim yo'li: ", a.work));
    })),
    (t?.practice?.open || []).map((q, i) => h("div", { class: "small" }, h("b", {}, `K${i + 1}. ${q}`), h("p", {}, r.answers?.open?.[i] || "—"))),
    r.answers?.conclusion && h("div", { class: "small" }, h("b", {}, "Xulosa: "), r.answers.conclusion));
  let close;
  close = modal(`${r.user?.name} — ${t?.num}-amaliy mashg'ulot`, h("div", { class: "stack" },
    reviewView({ ...r, criteria, at: r.createdAt }),
    answers,
    h("h3", {}, "O'qituvchi bahosi va izohi"),
    h("div", { class: "row" }, grade, h("span", { class: "muted small" }, "/ 10 (joriy nazorat uchun)")),
    comment,
    h("div", { class: "row end" }, h("button", { class: "btn", onclick: async () => {
      try {
        await api.put(`admin/practice-reviews/${r.userId}/${r.topicId}/${r.id}`, { grade: grade.value === "" ? null : Number(grade.value), comment: comment.value });
        toast("Saqlandi", "ok");
        close();
        reload();
      } catch (e) {
        toast(e.message, "error");
      }
    } }, "💾 Saqlash"))), { wide: true });
}

// ---------------- Tahlil laboratoriyasi hisobotlari ----------------

async function labProjects(el) {
  const { projects, rubric, levels } = await api.get("admin/labs");
  if (!projects.length) return mount(el, emptyState("🔬", "Hali topshirilgan laboratoriya hisobotlari yo'q"));
  let onlyPending = false;
  const list = h("div", { class: "stack" });
  const draw = () => {
    const rs = projects.filter((p) => !onlyPending || p.status === "submitted" || p.changedAfterSubmit);
    list.replaceChildren(
      h("div", { class: "card table-wrap" }, h("table", { class: "table" },
        h("thead", {}, h("tr", {}, ["Talaba", "Guruh", "Korxona", "Topshirilgan", "AI", "Baho", ""].map((t) => h("th", {}, t)))),
        h("tbody", {}, rs.map((p) => h("tr", {},
          h("td", {}, p.user?.name),
          h("td", {}, p.user?.group || "—"),
          h("td", {}, p.title, p.changedAfterSubmit && h("span", { class: "badge badge-warn" }, "o'zgartirilgan")),
          h("td", {}, fmtDate(p.submittedAt)),
          h("td", {}, p.aiReview ? `${p.aiReview.total}/100` : "—"),
          h("td", {}, p.grade ? h("b", {}, `${p.grade.total} · ${p.grade.level}`) : h("span", { class: "badge badge-warn" }, "Kutilmoqda")),
          h("td", {}, h("button", { class: "btn small", onclick: () => gradeLabModal(p, rubric, levels, () => labProjects(el)) }, p.grade ? "Ko'rish" : "Baholash"))))))),
      h("div", { class: "row end" }, h("button", { class: "btn ghost", onclick: () => downloadFile("laboratoriya-hisobotlari.csv", toCSV([["Talaba", "Guruh", "Korxona", ...rubric.map((c) => `${c.title} (${c.max})`), "Jami", "Daraja", "AI bahosi"], ...rs.map((p) => [p.user?.name, p.user?.group, p.title, ...rubric.map((_, i) => p.grade?.scores[i] ?? ""), p.grade?.total ?? "", p.grade?.level ?? "", p.aiReview?.total ?? ""])])) }, "⬇ CSV"))
    );
  };
  mount(el, h("label", { class: "check" }, h("input", { type: "checkbox", onchange: (e) => ((onlyPending = e.target.checked), draw()) }), "Faqat baholanmaganlar"), list);
  draw();
}

function gradeLabModal(p, rubric, levels, reload) {
  const a = analyze(p.data?.prev || {}, p.data?.cur || {});
  const scores = p.grade ? [...p.grade.scores] : p.aiReview ? [...p.aiReview.scores] : rubric.map(() => null);
  const totalEl = h("b");
  const drawTotal = () => {
    const t = scores.reduce((x, y) => x + (Number(y) || 0), 0);
    totalEl.textContent = `${t} / 100 — ${(levels.find((l) => t >= l.min) || levels.at(-1)).label}`;
  };
  drawTotal();
  const fb = h("textarea", { rows: 3, placeholder: "Talabaga izoh va tavsiyalar" }, p.grade?.feedback || "");
  let close;
  close = modal(`${p.title} — ${p.user?.name}`, h("div", { class: "stack" },
    h("div", { class: "mini-grid" }, [["Joriy likvidlik", fmtN(a.k.current)], ["Tez likvidlik", fmtN(a.k.quick)], ["Avtonomiya", fmtN(a.k.autonomy)], ["ROS", pct(a.k.ros)], ["ROA", pct(a.k.roa)], ["ROE", pct(a.k.roe)], ["Zararsizlik tushumi", fmtN(a.k.bep, 0)], ["Xavfsizlik zaxirasi", pct(a.k.safety)]].map(([l, v]) => h("div", { class: "mini" }, h("span", {}, l), h("b", {}, v)))),
    h("details", { open: true }, h("summary", {}, h("b", {}, "Talaba xulosalari")), LAB_SECTIONS.map(([k, t]) => h("div", { class: "small" }, h("b", {}, t), h("p", {}, p.conclusions?.[k] || "—")))),
    p.aiReview && h("details", {}, h("summary", {}, h("b", {}, `🤖 AI tekshiruvi: ${p.aiReview.total}/100`)), h("p", { class: "small" }, p.aiReview.summary), h("ul", { class: "small" }, [...(p.aiReview.mistakes || []), ...(p.aiReview.recommendations || [])].map((x) => h("li", {}, x)))),
    h("h3", {}, "Baholash rubrikasi (100 ball)"),
    p.aiReview && !p.grade && h("p", { class: "muted small" }, "Ballar AI tavsiyasi bilan oldindan to'ldirildi — tekshirib, o'zgartiring."),
    h("div", { class: "stack" }, rubric.map((c, i) => h("div", { class: "rubric-row" }, h("span", {}, `${i + 1}. ${c.title}`), h("div", { class: "row" }, h("input", { type: "number", min: 0, max: c.max, value: scores[i] ?? "", class: "w-xs", oninput: (e) => { scores[i] = e.target.value === "" ? null : Number(e.target.value); drawTotal(); } }), h("span", { class: "muted small" }, `/ ${c.max}`))))),
    h("p", {}, "Jami: ", totalEl),
    h("label", { class: "field" }, h("span", {}, "Izoh"), fb),
    h("div", { class: "row end" }, h("button", { class: "btn", onclick: async () => {
      if (scores.some((x) => x == null)) return toast("Barcha mezonlarni baholang", "warn");
      try {
        await api.put(`admin/labs/${p.userId}/${p.id}/grade`, { scores, feedback: fb.value });
        toast("Baho saqlandi", "ok");
        close();
        reload();
      } catch (e) {
        toast(e.message, "error");
      }
    } }, "💾 Bahoni saqlash"))), { wide: true });
}
