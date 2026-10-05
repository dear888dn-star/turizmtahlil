// Ma'lumotlar ombori interfeysi. Muhitga qarab ulanadi:
//   Netlify  — server/store-netlify.mjs (Netlify Blobs yoki lokal .data/ papka)
//   Cloudflare — server/store-d1.mjs (D1 ma'lumotlar bazasi + R2 fayllar)
// Ombor metodlari: get(key), set(key, value), del(key), getBinary(key), setBinary(key, data), list(prefix),
// ixtiyoriy: entries(prefix) → [[key, value], ...] (bitta so'rovda; bo'lmasa get bilan yig'iladi).

let backend = null;

export function useStore(store) {
  backend = store;
}

export function db() {
  if (!backend) throw new Error("Ma'lumotlar ombori ulanmagan");
  return backend;
}

/** Prefiks bo'yicha barcha yozuvlar: [[kalit, qiymat], ...] */
export async function getEntries(prefix) {
  const store = db();
  if (store.entries) return store.entries(prefix);
  const keys = await store.list(prefix);
  const values = await Promise.all(keys.map((k) => store.get(k)));
  return keys.map((k, i) => [k, values[i]]).filter(([, v]) => v != null);
}

export async function getMany(prefix) {
  return (await getEntries(prefix)).map(([, v]) => v);
}
