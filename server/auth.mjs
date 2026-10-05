// Parollarni PBKDF2-SHA256 (WebCrypto) bilan xeshlash va HMAC imzoli tokenlar.
// WebCrypto Node.js'da ham, Cloudflare Workers'da ham bir xil ishlaydi. Iteratsiyalar soni Cloudflare'ning
// bepul tarifidagi protsessor vaqti chegarasiga mos tanlangan (Workers 100 000 dan ortig'ini qo'llab-quvvatlamaydi).
import crypto from "node:crypto";

const PBKDF2_ITER = 60_000;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 kun

let generatedSecret = null;

/** JWT_SECRET o'rnatilmagan bo'lsa, omborda saqlangan avtomatik kalit ishlatiladi (api.mjs: ensureSecret). */
export function setGeneratedSecret(s) {
  generatedSecret = s;
}

function secret() {
  const s = process.env.JWT_SECRET || generatedSecret;
  if (s) return s;
  if (process.env.VGT_LOCAL_DATA) return "local-dev-secret";
  throw new Error("JWT_SECRET muhit o'zgaruvchisi o'rnatilmagan");
}

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.webcrypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.webcrypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations, hash: "SHA-256" }, key, 256);
  return Buffer.from(bits);
}

/** Xesh formati: "pbkdf2:<iteratsiya>:<hex>". */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = `pbkdf2:${PBKDF2_ITER}:${(await pbkdf2(password, salt, PBKDF2_ITER)).toString("hex")}`;
  return { salt, hash };
}

export async function verifyPassword(password, salt, hash) {
  let candidate;
  let expected;
  const m = /^pbkdf2:(\d+):([0-9a-f]+)$/.exec(String(hash));
  if (m) {
    candidate = await pbkdf2(password, salt, Number(m[1]));
    expected = Buffer.from(m[2], "hex");
  } else {
    // Eski (scrypt) xesh — faqat Node.js muhitida yaratilgan profillar uchun
    const { promisify } = await import("node:util");
    candidate = await promisify(crypto.scrypt)(password, salt, 64);
    expected = Buffer.from(String(hash), "hex");
  }
  return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
}

const b64 = (s) => Buffer.from(s).toString("base64url");
const sign = (data) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");

export function createToken(user) {
  const payload = b64(JSON.stringify({ uid: user.id, role: user.role, pv: user.pwdV || 0, exp: Date.now() + TOKEN_TTL_MS }));
  return `${payload}.${sign(payload)}`;
}

export function readToken(token) {
  if (!token || typeof token !== "string") return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

export const newId = () => crypto.randomUUID();
