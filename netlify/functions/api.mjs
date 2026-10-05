// Netlify Functions ulagichi (zaxira versiya). Asosiy server kodi: server/app.mjs.
import { handle } from "../../server/app.mjs";
import { useStore } from "../../server/store.mjs";
import { netlifyStore } from "../../server/store-netlify.mjs";

let ready = false;

export default async function handler(req) {
  if (!ready) {
    useStore(netlifyStore());
    ready = true;
  }
  return handle(req);
}

export const config = { path: "/api/*" };
