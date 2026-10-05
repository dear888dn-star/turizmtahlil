// Katta ekran uchun QR-kod: talabalar telefon kamerasi bilan skanerlab platformaga kiradi.
// Manzil joriy domendan olinadi (domen o'zgarsa ham QR to'g'ri ishlaydi).
import { h, mount } from "../ui.js";

async function qrSvg(text) {
  const { default: qrcode } = await import("/vendor/qrcode/qrcode.mjs");
  const q = qrcode(0, "H");
  q.addData(text);
  q.make();
  const n = q.getModuleCount();
  let path = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) path += `M${c} ${r}h1v1h-1z`;
  return `<svg viewBox="-4 -4 ${n + 8} ${n + 8}" role="img" aria-label="Platformaga kirish uchun QR-kod" shape-rendering="crispEdges"><rect x="-4" y="-4" width="${n + 8}" height="${n + 8}" fill="#fff"/><path d="${path}" fill="#0f172a"/></svg>`;
}

export async function render(el) {
  const url = `${location.origin}/`;
  const box = h("div", { class: "qr-code" });
  box.innerHTML = await qrSvg(url);
  const close = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (history.length > 1) history.back();
    else location.hash = "#/";
  };
  const full = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())?.catch?.(() => {});
  const onKey = (e) => {
    if (e.key === "f" || e.key === "F") full();
  };
  document.addEventListener("keydown", onKey);
  mount(
    el,
    h("section", { class: "qr-screen" },
      h("div", { class: "qr-tools" },
        h("button", { class: "btn small ghost", onclick: full, title: "To'liq ekran (F)" }, "⛶ To'liq ekran"),
        h("button", { class: "btn small ghost", onclick: close, title: "Yopish" }, "✕ Yopish")),
      h("div", { class: "qr-side" },
        h("div", { class: "qr-tag" }, "Interaktiv ta'lim platformasi"),
        h("h1", {}, "TurTahlil akademiya"),
        h("p", { class: "qr-course" }, "“Turistik korxonalar faoliyati tahlili”"),
        h("ol", { class: "qr-steps" },
          h("li", {}, "Telefon kamerasini QR-kodga qarating"),
          h("li", {}, "Ochilgan havolani bosing"),
          h("li", {}, h("b", {}, "Ro'yxatdan o'ting"), " yoki tizimga kiring")),
        h("div", { class: "qr-url" }, url.replace(/^https?:\/\//, "").replace(/\/$/, ""))),
      box)
  );
  return () => {
    document.removeEventListener("keydown", onKey);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };
}
