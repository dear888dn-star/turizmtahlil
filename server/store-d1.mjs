// Cloudflare uchun ma'lumotlar ombori: JSON yozuvlar — D1 (SQLite) bazasidagi kalit-qiymat jadvalida,
// ikkilik fayllar (taqdimot va video bo'laklari, AI ovozlari) — R2 bucket'da, R2 ulanmagan bo'lsa —
// D1'ning "bin" jadvalida (base64 bo'laklar, har bir qator D1 chegarasidan — 2 MB — kichik).
// Jadvallar birinchi so'rovda avtomatik yaratiladi (qo'lda SQL ishga tushirish shart emas).

import { Buffer } from "node:buffer";

const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS bin (key TEXT NOT NULL, part INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY (key, part))",
];
const PART = 1_200_000; // base64 belgi (~900 KB ikkilik ma'lumot)
// Prefiks bo'yicha qidiruv: key >= prefix AND key < prefix + U+FFFF (LIKE dan tezroq, indeksdan foydalanadi)
const upper = (prefix) => `${prefix}￿`;

export function d1Store(DB, FILES) {
  let ready = null;
  const init = () => (ready ||= DB.batch(SCHEMA.map((q) => DB.prepare(q))).catch((e) => {
    ready = null;
    throw e;
  }));
  return {
    async get(key) {
      await init();
      const row = await DB.prepare("SELECT value FROM kv WHERE key = ?").bind(key).first();
      return row ? JSON.parse(row.value) : null;
    },
    async set(key, value) {
      await init();
      await DB.prepare("INSERT INTO kv (key, value, updated) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET value = ?2, updated = ?3")
        .bind(key, JSON.stringify(value), Date.now())
        .run();
    },
    async del(key) {
      await init();
      await DB.batch([DB.prepare("DELETE FROM kv WHERE key = ?").bind(key), DB.prepare("DELETE FROM bin WHERE key = ?").bind(key)]);
      if (FILES) await FILES.delete(key).catch(() => {});
    },
    async getBinary(key) {
      if (FILES) {
        const obj = await FILES.get(key);
        return obj ? obj.arrayBuffer() : null;
      }
      await init();
      const { results } = await DB.prepare("SELECT data FROM bin WHERE key = ? ORDER BY part").bind(key).all();
      if (!results.length) return null;
      const buf = Buffer.from(results.map((r) => r.data).join(""), "base64");
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    },
    async setBinary(key, data) {
      if (FILES) return void (await FILES.put(key, data));
      await init();
      const b64 = Buffer.from(data instanceof ArrayBuffer ? new Uint8Array(data) : data).toString("base64");
      const stmts = [DB.prepare("DELETE FROM bin WHERE key = ?").bind(key)];
      for (let i = 0, part = 0; i < b64.length; i += PART, part++) stmts.push(DB.prepare("INSERT INTO bin (key, part, data) VALUES (?, ?, ?)").bind(key, part, b64.slice(i, i + PART)));
      await DB.batch(stmts);
    },
    async list(prefix = "") {
      await init();
      const keys = new Set();
      const { results } = await DB.prepare("SELECT key FROM kv WHERE key >= ? AND key < ?").bind(prefix, upper(prefix)).all();
      for (const r of results) keys.add(r.key);
      const bins = await DB.prepare("SELECT DISTINCT key FROM bin WHERE key >= ? AND key < ?").bind(prefix, upper(prefix)).all();
      for (const r of bins.results) keys.add(r.key);
      if (FILES) {
        let cursor;
        do {
          const page = await FILES.list({ prefix, cursor });
          for (const o of page.objects) keys.add(o.key);
          cursor = page.truncated ? page.cursor : undefined;
        } while (cursor);
      }
      return [...keys];
    },
    async entries(prefix = "") {
      await init();
      const { results } = await DB.prepare("SELECT key, value FROM kv WHERE key >= ? AND key < ? ORDER BY key").bind(prefix, upper(prefix)).all();
      return results.map((r) => [r.key, JSON.parse(r.value)]);
    },
  };
}
