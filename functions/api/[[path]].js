// Cloudflare Pages Functions ulagichi: /api/* so'rovlari. Asosiy server kodi: server/app.mjs.
// Kerakli bog'lanishlar (Settings → Bindings): D1 baza — DB, R2 bucket — FILES.
// Maxfiy o'zgaruvchilar (Settings → Variables and Secrets): JWT_SECRET, TEACHER_CODE, GEMINI_API_KEY va h.k.
import { handle } from "../../server/app.mjs";
import { useStore } from "../../server/store.mjs";
import { d1Store } from "../../server/store-d1.mjs";

let store = null;

export async function onRequest({ request, env }) {
  // Matnli o'zgaruvchilar va maxfiy kalitlar server kodiga process.env orqali beriladi
  for (const [k, v] of Object.entries(env)) if (typeof v === "string") process.env[k] = v;
  process.env.CF_PAGES ||= "1";
  // MP3 ga siqish protsessor vaqtini ko'p oladi — bepul tarifda AI ovozi WAV formatida saqlanadi
  process.env.TTS_FORMAT ||= "wav";
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Ma'lumotlar bazasi ulanmagan: Cloudflare Pages → Settings → Bindings bo'limida DB nomli D1 bazasini qo'shing va qayta deploy qiling." }), { status: 503, headers: { "content-type": "application/json; charset=utf-8" } });
  }
  store ||= d1Store(env.DB, env.FILES);
  useStore(store);
  return handle(request);
}
