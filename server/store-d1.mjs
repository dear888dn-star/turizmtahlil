// Cloudflare uchun ma'lumotlar ombori: JSON yozuvlar — D1 (SQLite) bazasidagi kalit-qiymat jadvalida,
// ikkilik fayllar (taqdimot va video bo'laklari, AI ovozlari) — R2 bucket'da.
// Jadval birinchi so'rovda avtomatik yaratiladi (qo'lda SQL ishga tushirish shart emas).

const SCHEMA = "CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated INTEGER NOT NULL)";
// Prefiks bo'yicha qidiruv: key >= prefix AND key < prefix + U+FFFF (LIKE dan tezroq, indeksdan foydalanadi)
const upper = (prefix) => `${prefix}￿`;

export function d1Store(DB, FILES) {
  let ready = null;
  const init = () => (ready ||= DB.prepare(SCHEMA).run().catch((e) => {
    ready = null;
    throw e;
  }));
  const needFiles = () => {
    if (!FILES) throw Object.assign(new Error("Fayl ombori (R2) ulanmagan: Cloudflare Pages → Settings → Bindings bo'limida FILES nomli R2 bucket qo'shing"), { status: 503 });
    return FILES;
  };
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
      await DB.prepare("DELETE FROM kv WHERE key = ?").bind(key).run();
      if (FILES) await FILES.delete(key).catch(() => {});
    },
    async getBinary(key) {
      const obj = await needFiles().get(key);
      return obj ? obj.arrayBuffer() : null;
    },
    async setBinary(key, data) {
      await needFiles().put(key, data);
    },
    async list(prefix = "") {
      await init();
      const keys = new Set();
      const { results } = await DB.prepare("SELECT key FROM kv WHERE key >= ? AND key < ?").bind(prefix, upper(prefix)).all();
      for (const r of results) keys.add(r.key);
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
