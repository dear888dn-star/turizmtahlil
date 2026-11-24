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

// D1 bepul tarifida bitta baza 500 MB. To'lib qolsa, yozish shu xato bilan rad etiladi.
const FULL = /maximum (?:DB|database) size|SQLITE_FULL|database or disk is full/i;
// Qayta yaratilishi mumkin bo'lgan kesh (AI ovozlari): joy kerak bo'lsa, eng eskilari o'chiriladi
const CACHE = { meta: "ttsmeta/", bin: "ttsbin/" };
const MB = 1024 * 1024;

export function d1Store(DB, FILES) {
  let ready = null;
  const init = () => (ready ||= DB.batch(SCHEMA.map((q) => DB.prepare(q))).catch((e) => {
    ready = null;
    throw e;
  }));
  /** AI ovozlari keshidan eng eskilarini o'chiradi; bo'shatilgan hajmni (taxminan, baytda) qaytaradi. */
  const evictCache = async (want) => {
    await init();
    let freed = 0;
    // Avval meta yozuvi yo'q "yetim" audiolar (baza to'lganda yarim saqlanib qolganlar)
    const orphan = await DB.prepare(
      "SELECT COALESCE(SUM(length(data)), 0) AS n FROM bin WHERE key >= ?1 AND key < ?2 AND (?3 || substr(key, ?4)) NOT IN (SELECT key FROM kv WHERE key >= ?3 AND key < ?5)"
    ).bind(CACHE.bin, upper(CACHE.bin), CACHE.meta, CACHE.bin.length + 1, upper(CACHE.meta)).first();
    if (orphan?.n) {
      await DB.prepare("DELETE FROM bin WHERE key >= ?1 AND key < ?2 AND (?3 || substr(key, ?4)) NOT IN (SELECT key FROM kv WHERE key >= ?3 AND key < ?5)")
        .bind(CACHE.bin, upper(CACHE.bin), CACHE.meta, CACHE.bin.length + 1, upper(CACHE.meta)).run();
      freed += orphan.n * 0.75;
    }
    for (let round = 0; round < 60 && freed < want; round++) {
      const { results } = await DB.prepare("SELECT key FROM kv WHERE key >= ? AND key < ? ORDER BY updated LIMIT 20").bind(CACHE.meta, upper(CACHE.meta)).all();
      if (!results.length) break;
      const metas = results.map((r) => r.key);
      const bins = metas.map((k) => CACHE.bin + k.slice(CACHE.meta.length));
      const q = (n) => Array(n).fill("?").join(",");
      const size = await DB.prepare(`SELECT COALESCE(SUM(length(data)), 0) AS n FROM bin WHERE key IN (${q(bins.length)})`).bind(...bins).first();
      await DB.batch([DB.prepare(`DELETE FROM bin WHERE key IN (${q(bins.length)})`).bind(...bins), DB.prepare(`DELETE FROM kv WHERE key IN (${q(metas.length)})`).bind(...metas)]);
      if (FILES) await FILES.delete(bins).catch(() => {});
      freed += (size?.n || 0) * 0.75; // base64 → bayt
    }
    return Math.round(freed);
  };
  /** Yozish: baza to'lgan bo'lsa, AI ovozlari keshidan joy bo'shatib, bir marta qayta urinadi. */
  const roomy = async (fn) => {
    try {
      return await fn();
    } catch (e) {
      if (!FULL.test(String(e?.message || e))) throw e;
      const freed = await evictCache(80 * MB).catch(() => 0);
      if (freed > 0) {
        try {
          return await fn();
        } catch (e2) {
          if (!FULL.test(String(e2?.message || e2))) throw e2;
        }
      }
      throw Object.assign(new Error("Ma'lumotlar bazasi to'lgan (bepul tarifda 500 MB). O'qituvchi paneli → AI ovozlar → «Ma'lumotlar ombori» bo'limida joyni nima egallaganini ko'ring va keraksiz fayllarni o'chiring."), { status: 507 });
    }
  };
  return {
    evictCache,
    /** Ombordagi ma'lumotlar hajmi: prefiks (birinchi "/" gacha) bo'yicha, baytda. */
    async usage() {
      await init();
      const { results: kv } = await DB.prepare("SELECT substr(key, 1, instr(key, '/')) AS p, COUNT(*) AS rows, SUM(length(value)) AS bytes FROM kv GROUP BY p").all();
      const { results: bin } = await DB.prepare("SELECT substr(key, 1, instr(key, '/')) AS p, COUNT(*) AS rows, SUM(length(data)) AS bytes FROM bin GROUP BY p").all();
      return [...kv.map((r) => ({ ...r, kind: "kv" })), ...bin.map((r) => ({ ...r, bytes: Math.round(r.bytes * 0.75), kind: "bin" }))];
    },
    /** Zaxira nusxa uchun: kalit bo'yicha tartiblangan sahifa, qiymatlar xom (JSON matn) holida — protsessor tejaladi. */
    async rawPage(after = "", limit = 400) {
      await init();
      const { results } = await DB.prepare("SELECT key, value FROM kv WHERE key > ? ORDER BY key LIMIT ?").bind(after, limit).all();
      return results.map((r) => [r.key, r.value]);
    },
    /** Zaxiradan tiklash: overwrite=false — faqat bazada yo'q yozuvlar qo'shiladi. */
    async putRaw(rows, overwrite) {
      await init();
      const now = Date.now();
      const q = overwrite
        ? "INSERT INTO kv (key, value, updated) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET value = ?2, updated = ?3"
        : "INSERT INTO kv (key, value, updated) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO NOTHING";
      const res = await roomy(() => DB.batch(rows.map(([k, v]) => DB.prepare(q).bind(k, v, now))));
      return res.reduce((n, r) => n + (r.meta?.changes || 0), 0);
    },
    async get(key) {
      await init();
      const row = await DB.prepare("SELECT value FROM kv WHERE key = ?").bind(key).first();
      return row ? JSON.parse(row.value) : null;
    },
    async set(key, value) {
      await init();
      await roomy(() =>
        DB.prepare("INSERT INTO kv (key, value, updated) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET value = ?2, updated = ?3")
          .bind(key, JSON.stringify(value), Date.now())
          .run()
      );
    },
    async del(key) {
      await init();
      await DB.batch([DB.prepare("DELETE FROM kv WHERE key = ?").bind(key), DB.prepare("DELETE FROM bin WHERE key = ?").bind(key)]);
      if (FILES) await FILES.delete(key).catch(() => {});
    },
    /** Prefiks bo'yicha hammasini bitta so'rovda o'chirish (masalan, eski AI ovozlari keshi). */
    async delPrefix(prefix) {
      await init();
      const res = await DB.batch([
        DB.prepare("DELETE FROM kv WHERE key >= ? AND key < ?").bind(prefix, upper(prefix)),
        DB.prepare("DELETE FROM bin WHERE key >= ? AND key < ?").bind(prefix, upper(prefix)),
      ]);
      if (FILES) {
        let cursor;
        do {
          const page = await FILES.list({ prefix, cursor });
          if (page.objects.length) await FILES.delete(page.objects.map((o) => o.key));
          cursor = page.truncated ? page.cursor : undefined;
        } while (cursor);
      }
      return res.reduce((n, r) => n + (r.meta?.changes || 0), 0);
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
      await roomy(() => DB.batch(stmts));
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
