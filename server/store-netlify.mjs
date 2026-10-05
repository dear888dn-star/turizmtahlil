// Netlify uchun ma'lumotlar ombori: Netlify Blobs, lokal rejimda .data/ papkasidagi JSON fayllar.
// Interfeys (get/set/del/getBinary/setBinary/list) server/store.mjs da tavsiflangan.
import { getStore } from "@netlify/blobs";
import fs from "node:fs/promises";
import path from "node:path";

const STORE_NAME = "turtahlil";

function fileStore(dir) {
  const file = (key) => path.join(dir, encodeURIComponent(key) + ".json");
  const binFile = (key) => path.join(dir, encodeURIComponent(key) + ".bin");
  return {
    async get(key) {
      try {
        return JSON.parse(await fs.readFile(file(key), "utf8"));
      } catch (e) {
        if (e.code === "ENOENT") return null;
        throw e;
      }
    },
    async set(key, value) {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(file(key), JSON.stringify(value));
    },
    async del(key) {
      await fs.rm(file(key), { force: true });
      await fs.rm(binFile(key), { force: true });
    },
    async getBinary(key) {
      try {
        const buf = await fs.readFile(binFile(key));
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      } catch (e) {
        if (e.code === "ENOENT") return null;
        throw e;
      }
    },
    async setBinary(key, data) {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(binFile(key), Buffer.from(data));
    },
    async list(prefix = "") {
      let names = [];
      try {
        names = await fs.readdir(dir);
      } catch {
        return [];
      }
      const keys = names.filter((n) => /\.(json|bin)$/.test(n)).map((n) => decodeURIComponent(n.replace(/\.(json|bin)$/, "")));
      return [...new Set(keys)].filter((k) => k.startsWith(prefix));
    },
  };
}

function blobStore() {
  // Netlify Functions muhitida ombor avtomatik ulanadi. Avtomatik ulanmasa, NETLIFY_SITE_ID va
  // NETLIFY_BLOBS_TOKEN (shaxsiy kirish tokeni) orqali qo'lda ulanadi.
  const manual = process.env.NETLIFY_SITE_ID && process.env.NETLIFY_BLOBS_TOKEN ? { siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_BLOBS_TOKEN } : {};
  const store = getStore({ name: STORE_NAME, consistency: "strong", ...manual });
  return {
    get: (key) => store.get(key, { type: "json" }),
    set: (key, value) => store.setJSON(key, value),
    del: (key) => store.delete(key),
    getBinary: (key) => store.get(key, { type: "arrayBuffer" }),
    setBinary: (key, data) => store.set(key, data),
    async list(prefix = "") {
      const { blobs } = await store.list({ prefix });
      return blobs.map((b) => b.key);
    },
  };
}

/** Netlify yoki lokal (fayl) ombori. */
export function netlifyStore() {
  const localDir = process.env.VGT_LOCAL_DATA;
  return localDir ? fileStore(path.join(localDir, STORE_NAME)) : blobStore();
}
