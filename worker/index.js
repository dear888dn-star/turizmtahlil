// Cloudflare Worker: /api/* — server (D1 + R2), qolgan hamma narsa — public/ dagi statik fayllar.
import { handleApi } from "./cloudflare.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env);
    return env.ASSETS.fetch(request);
  },
};
