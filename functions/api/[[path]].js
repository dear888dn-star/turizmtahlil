// Cloudflare Pages Functions ulagichi (agar loyiha Pages sifatida yaratilsa). Asosiy usul — Worker: worker/index.js.
import { handleApi } from "../../worker/cloudflare.js";

export const onRequest = ({ request, env }) => handleApi(request, env);
