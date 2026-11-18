// Talabaning bajargan mustaqil ishlari — PDF hujjat (titul varag'i, mundarija, har bir ish alohida sahifada).
// PDF brauzerda yaratiladi (jsPDF), server so'rovi sarflanmaydi. O'zbekcha harflar (o‘, g‘) va kirill uchun
// Unicode shrift (DejaVu Serif) ishlatiladi. Kutubxona va shrift faqat birinchi yuklab olishda yuklanadi.
import { COURSE, TOPICS } from "../data/topics.js";

const GRADE_NAMES = { 5: "a'lo", 4: "yaxshi", 3: "qoniqarli", 2: "qoniqarsiz" };
const PAGE = { w: 210, h: 297, left: 30, right: 15, top: 20, bottom: 20 };
const FONT = "DejaVuSerif";

let libPromise = null;
function loadLib() {
  libPromise ||= (async () => {
    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "/vendor/jspdf/jspdf.umd.min.js";
        s.onload = resolve;
        s.onerror = () => reject(new Error("PDF kutubxonasini yuklab bo'lmadi. Internetni tekshirib, qayta urinib ko'ring."));
        document.head.append(s);
      });
    }
    const toB64 = (buf) => {
      const bytes = new Uint8Array(buf);
      let bin = "";
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return btoa(bin);
    };
    const [regular, bold] = await Promise.all(
      ["DejaVuSerif.ttf", "DejaVuSerif-Bold.ttf"].map(async (f) => {
        const r = await fetch(`/vendor/fonts/${f}`);
        if (!r.ok) throw new Error("PDF shriftini yuklab bo'lmadi");
        return toB64(await r.arrayBuffer());
      })
    );
    return { jsPDF: window.jspdf.jsPDF, regular, bold };
  })();
  libPromise.catch(() => (libPromise = null));
  return libPromise;
}

// Shriftda yo'q belgilar (emoji va h.k.) olib tashlanadi, apostroflar bir xillashtiriladi
const clean = (s) =>
  String(s ?? "")
    .replace(/[\u{10000}-\u{10FFFF}️​-‍]/gu, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, "    ")
    .trim();

const fmtDay = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
};

/** Topshirilgan ishlarni fan dasturidagi tartibda (mavzu, keyin topshiriq) joylashtiradi. */
function orderedWorks(submissions) {
  const byId = new Map(submissions.map((s) => [s.taskId, s]));
  const out = [];
  for (const topic of TOPICS) {
    for (const task of topic.selfStudy) {
      const sub = byId.get(task.id);
      if (sub) {
        out.push({ topic, task, sub });
        byId.delete(task.id);
      }
    }
  }
  // Dasturdan olib tashlangan topshiriqlar ham yo'qolmasin
  for (const sub of byId.values()) out.push({ topic: null, task: null, sub });
  return out;
}

/**
 * PDF yaratib, yuklab beradi.
 * student: { name, group, college }, submissions: /api/self-study (yoki o'qituvchi uchun admin/self-study) yozuvlari.
 */
export async function downloadSelfStudyPdf(student, submissions) {
  const works = orderedWorks(submissions || []);
  if (!works.length) throw new Error("Hali birorta mustaqil ish topshirilmagan");
  const { jsPDF, regular, bold } = await loadLib();
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.addFileToVFS("DejaVuSerif.ttf", regular);
  doc.addFont("DejaVuSerif.ttf", FONT, "normal");
  doc.addFileToVFS("DejaVuSerif-Bold.ttf", bold);
  doc.addFont("DejaVuSerif-Bold.ttf", FONT, "bold");
  doc.setProperties({ title: `${clean(student.name)} — mustaqil ishlar`, subject: COURSE.title, author: clean(student.name), creator: "TurTahlil akademiya" });

  const width = PAGE.w - PAGE.left - PAGE.right;
  const cx = PAGE.left + width / 2;
  let y = PAGE.top;
  const font = (size, style = "normal", color = [20, 24, 33]) => {
    doc.setFont(FONT, style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const lineH = (size) => size * 0.3528 * 1.45; // pt → mm, 1.45 qator oralig'i
  const ensure = (need) => {
    if (y + need > PAGE.h - PAGE.bottom) {
      doc.addPage();
      y = PAGE.top;
    }
  };
  /** Matnni kenglikka bo'lib, sahifadan oshsa keyingisiga o'tkazib yozadi. */
  const para = (text, size = 12, style = "normal", { indent = 0, color, gap = 2, align = "left" } = {}) => {
    font(size, style, color);
    const h = lineH(size);
    for (const block of clean(text).split(/\n{2,}|\n/)) {
      const lines = doc.splitTextToSize(block || " ", width - indent);
      for (const ln of lines) {
        ensure(h);
        if (align === "center") doc.text(ln, cx, y + h * 0.75, { align: "center" });
        else doc.text(ln, PAGE.left + indent, y + h * 0.75);
        y += h;
      }
    }
    y += gap;
  };

  // ---------- Titul varag'i ----------
  const college = clean(student.college) || "O'zMU Jizzax filiali";
  const kafedra = (COURSE.program.match(/“[^”]+”\s+kafedrasi/) || [""])[0];
  y = 28;
  para(college.toUpperCase(), 13, "bold", { align: "center", gap: 1 });
  if (kafedra) para(kafedra, 12, "normal", { align: "center" });
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.6);
  doc.line(PAGE.left, y + 2, PAGE.w - PAGE.right, y + 2);
  y = 100;
  para(`“${COURSE.title.toUpperCase()}”`, 17, "bold", { align: "center", gap: 3 });
  para("fanidan", 13, "normal", { align: "center", gap: 10 });
  para("BAJARGAN MUSTAQIL ISHLARI", 20, "bold", { align: "center", color: [29, 78, 216], gap: 4 });
  para(`(${works.length} ta mustaqil ish)`, 12, "normal", { align: "center", color: [90, 98, 112] });

  const rows = [
    ["Talaba (F.I.Sh.):", clean(student.name)],
    ["Guruh:", clean(student.group) || "—"],
    ["Fan o'qituvchisi:", COURSE.teacher || "—"],
  ];
  y = 190;
  const lx = PAGE.left + width * 0.42;
  for (const [label, value] of rows) {
    font(13, "bold");
    doc.text(label, lx, y);
    font(13, "normal");
    const v = doc.splitTextToSize(value, PAGE.w - PAGE.right - lx);
    doc.text(v, lx, y + 6.5);
    y += 6.5 + v.length * 6.5 + 4;
  }
  font(12, "normal");
  doc.text(`${COURSE.city ? `${COURSE.city} – ` : ""}${new Date().getFullYear()}`, cx, PAGE.h - 22, { align: "center" });

  // ---------- Mundarija (sahifa raqamlari ishlar yozilgandan keyin to'ldiriladi) ----------
  doc.addPage();
  const tocPage = doc.getNumberOfPages();
  const pages = [];

  // ---------- Ishlar ----------
  works.forEach(({ topic, task, sub }, i) => {
    doc.addPage();
    y = PAGE.top;
    pages.push(doc.getNumberOfPages());
    const title = clean(task?.title || sub.taskTitle || "Mustaqil ish");
    para(`${i + 1}. ${title}`, 14, "bold", { gap: 1 });
    const meta = [topic ? `${topic.num}-mavzu: ${topic.title}` : clean(sub.topicTitle), task?.type, sub.submittedAt && `topshirilgan: ${fmtDay(sub.submittedAt)}`].filter(Boolean).join(" · ");
    para(meta, 10.5, "normal", { color: [90, 98, 112], gap: 3 });
    doc.setDrawColor(210, 216, 226);
    doc.setLineWidth(0.3);
    doc.line(PAGE.left, y, PAGE.w - PAGE.right, y);
    y += 4;
    if (task?.description) {
      para("Topshiriq:", 12, "bold", { gap: 0.5 });
      para(task.description, 11.5, "normal", { color: [60, 66, 80], gap: 4 });
    }
    para("Bajarilgan ish:", 12, "bold", { gap: 0.5 });
    if (sub.text) para(sub.text, 12, "normal", { gap: 3 });
    else para("(matn kiritilmagan — ish havola orqali topshirilgan)", 11.5, "normal", { color: [90, 98, 112], gap: 3 });
    if (sub.link) {
      para("Havola:", 12, "bold", { gap: 0.5 });
      font(11.5, "normal", [29, 78, 216]);
      const lines = doc.splitTextToSize(clean(sub.link), width);
      for (const ln of lines) {
        ensure(lineH(11.5));
        doc.textWithLink(ln, PAGE.left, y + lineH(11.5) * 0.75, { url: sub.link });
        y += lineH(11.5);
      }
      y += 3;
    }
    // Baho va o'qituvchi izohi
    const graded = Number.isFinite(sub.grade) && !sub.resubmitted;
    const gradeText = graded ? `${sub.grade} (${GRADE_NAMES[sub.grade] || ""})` : sub.resubmitted ? "qayta topshirilgan — o'qituvchi ko'rib chiqishi kutilmoqda" : "hali baholanmagan";
    ensure(18);
    y += 2;
    const boxTop = y;
    y += 3;
    font(12, "bold");
    doc.text("Baho: ", PAGE.left + 4, y + 4.5);
    const bw = doc.getTextWidth("Baho: ");
    font(12, "normal");
    doc.text(gradeText, PAGE.left + 4 + bw, y + 4.5);
    y += 7;
    if (sub.feedback) {
      font(11, "bold");
      doc.text("O'qituvchi izohi:", PAGE.left + 4, y + 4);
      y += 5.5;
      font(11, "normal");
      for (const ln of doc.splitTextToSize(clean(sub.feedback), width - 8)) {
        if (y + lineH(11) > PAGE.h - PAGE.bottom) break; // quti bitta sahifada qolsin
        doc.text(ln, PAGE.left + 4, y + lineH(11) * 0.75);
        y += lineH(11);
      }
    }
    y += 3;
    doc.setDrawColor(29, 78, 216);
    doc.setLineWidth(0.4);
    doc.roundedRect(PAGE.left, boxTop, width, y - boxTop, 2, 2, "S");
  });

  // ---------- Mundarija ----------
  doc.setPage(tocPage);
  y = PAGE.top;
  para("MUNDARIJA", 15, "bold", { align: "center", gap: 6 });
  const col = { n: PAGE.left, title: PAGE.left + 9, grade: PAGE.w - PAGE.right - 24, page: PAGE.w - PAGE.right };
  font(10.5, "bold", [90, 98, 112]);
  doc.text("№", col.n, y);
  doc.text("Mavzu va mustaqil ish", col.title, y);
  doc.text("Baho", col.grade, y, { align: "center" });
  doc.text("Bet", col.page, y, { align: "right" });
  y += 2.5;
  doc.setDrawColor(210, 216, 226);
  doc.line(PAGE.left, y, PAGE.w - PAGE.right, y);
  y += 5;
  works.forEach(({ topic, task, sub }, i) => {
    const name = `${topic ? `${topic.num}-mavzu. ` : ""}${clean(task?.title || sub.taskTitle)}`;
    font(11, "normal");
    const lines = doc.splitTextToSize(name, col.grade - col.title - 12);
    if (y + lines.length * 5 > PAGE.h - PAGE.bottom) return; // juda ko'p ish bo'lsa, birinchi sahifaga sig'gani
    doc.text(`${i + 1}.`, col.n, y);
    doc.text(lines, col.title, y);
    const graded = Number.isFinite(sub.grade) && !sub.resubmitted;
    doc.text(graded ? String(sub.grade) : "—", col.grade, y, { align: "center" });
    doc.text(String(pages[i]), col.page, y, { align: "right" });
    y += lines.length * 5 + 2.5;
  });
  const gradedList = works.filter(({ sub }) => Number.isFinite(sub.grade) && !sub.resubmitted);
  if (gradedList.length && y + 12 < PAGE.h - PAGE.bottom) {
    y += 4;
    const avg = gradedList.reduce((s, w) => s + w.sub.grade, 0) / gradedList.length;
    para(`Topshirilgan: ${works.length} ta · baholangan: ${gradedList.length} ta · o'rtacha baho: ${avg.toFixed(1).replace(".", ",")}`, 11, "bold");
  }

  // ---------- Sahifa raqamlari (titul varag'idan tashqari) ----------
  const total = doc.getNumberOfPages();
  for (let p = 2; p <= total; p++) {
    doc.setPage(p);
    font(9.5, "normal", [120, 128, 140]);
    doc.text(String(p), PAGE.w - PAGE.right, PAGE.h - 10, { align: "right" });
    doc.text(`${clean(student.name)} · ${COURSE.title}`, PAGE.left, PAGE.h - 10);
  }

  const safe = clean(student.name).replace(/[‘’'ʻʼ`]/g, "").replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "") || "talaba";
  doc.save(`Mustaqil_ishlar_${safe}.pdf`);
}
