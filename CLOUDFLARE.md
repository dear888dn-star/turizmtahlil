# TurTahlil'ni Cloudflare'ga joylash

Platforma **Cloudflare Worker** sifatida ishlaydi (`wrangler.jsonc`, `worker/index.js`):

- **Sahifalar, taqdimotlar va rasmlar** — `public/` dagi statik fayllar. Ular uchun so'rovlar bepul va cheklanmagan.
- **Server qismi (`/api/*`)** — bepul tarifda kuniga 100 000 ta so'rov.
- **Ma'lumotlar** — **D1** bazasi (`turtahlil-db`). U birinchi deploy'da avtomatik yaratiladi, jadval esa birinchi so'rovda yaratiladi.
- **Fayllar** (AI ovozlari, o'qituvchi yuklagan fayllar) — R2 ulangan bo'lsa R2'da, aks holda shu D1 bazasida saqlanadi.

GitHub'ning `main` tarmog'iga har bir push Cloudflare'da avtomatik deploy qiladi. Kredit yechilmaydi.

## 1. Loyihani ulash (bir marta)

Cloudflare → **Workers & Pages** → **Create** → **Import a repository** → `turizmtahlil`.

- **Build command:** bo'sh qoldiring
- **Deploy command:** `npx wrangler deploy`

Qolgan sozlamalar (`nodejs_compat`, D1 baza, statik fayllar) `wrangler.jsonc` dan avtomatik olinadi.

## 2. Maxfiy kalitlar

Worker → **Settings** → **Variables and Secrets** → **Add**. Har birining turi: **Secret**.

| Nomi | Majburiy | Qiymati |
|---|---|---|
| `JWT_SECRET` | ✅ | Uzun tasodifiy satr (40+ belgi) |
| `TEACHER_CODE` | ✅ | O'qituvchi ro'yxatdan o'tishi uchun maxfiy kod |
| `GEMINI_API_KEY` | tavsiya | [aistudio.google.com](https://aistudio.google.com) → Get API key (bepul). AI tekshiruv, trenajyor, AI Ustoz va AI ovozni yoqadi |
| `ANTHROPIC_API_KEY` | yo'q | Claude kaliti (pullik) |

Kalitlarni qo'shgandan keyin **Deployments** → oxirgi deploy → **Retry**. Kalitlar keyingi deploy'larda ham saqlanib qoladi (`keep_vars`).

Tekshirish uchun `https://<worker-nomi>.<akkaunt>.workers.dev/api/health` manzilini oching. U yerda `"platform":"Cloudflare"` ko'rinishi kerak.

So'ng saytda **Ro'yxatdan o'tish → O'qituvchi** ni tanlab, `TEACHER_CODE` bilan profil yarating.

## 3. R2 fayl ombori (ixtiyoriy)

R2 shart emas: AI ovozlari va o'qituvchi yuklagan fayllar R2 bo'lmasa D1 bazasida saqlanadi (5 GB gacha bepul). R2 faqat ko'p hajmli videolar yuklanadigan bo'lsa kerak bo'ladi.

18 ta dars taqdimoti platformaga o'rnatilgan, ular R2'siz ham ishlaydi.

Yoqish uchun:
1. Cloudflare'da R2 faollashtirilgan bo'lishi kerak (**R2 Object Storage** bo'limi).
2. `wrangler.jsonc` ga quyidagi qatorni qo'shing:

   ```
   "r2_buckets": [{ "binding": "FILES", "bucket_name": "turtahlil-files" }],
   ```

   Bucket keyingi deploy'da avtomatik yaratiladi.

## Bepul tarif chegaralari va platformaning moslashuvi

- **Server so'rovlari: kuniga 100 000 ta.** Talaba progressi 15 soniyada bir marta yig'ib saqlanadi, sahifa va taqdimotlar esa server so'rovi hisoblanmaydi. Shuning uchun 100–200 nafar talaba bemalol sig'adi. Limit oshib ketsa, sayt faqat ertasi kungacha to'xtaydi (Toshkent vaqti bilan soat 5:00 gacha).
- **Har bir so'rovga 10 ms protsessor vaqti:**
  - parol PBKDF2 (60 000 iteratsiya) bilan shifrlanadi;
  - AI ovozi MP3 ga siqilmasdan WAV formatida saqlanadi;
  - reyting va o'qituvchi paneli barcha ma'lumotni bir necha umumiy so'rov bilan oladi.

  Agar baribir "Exceeded CPU limit" xatosi chiqsa, `server/auth.mjs` faylidagi `PBKDF2_ITER` qiymatini kamaytiring.
- **D1: 5 GB, R2: 10 GB** (bepul).

## Netlify (zaxira versiya)

Netlify versiyasi o'zgarishsiz saqlangan:
- server ulagichi: `netlify/functions/api.mjs`;
- sozlamalar: `netlify.toml`;
- ma'lumotlar: Netlify Blobs.

Ikkala versiya ham bitta umumiy server kodidan (`server/` papka) foydalanadi.

Netlify kreditlari tejalishi uchun Netlify'dagi saytda **Stop builds** ni yoqing yoki saytni GitHub'dan uzing. Aks holda GitHub'ga har bir push Netlify'da ham deploy qiladi (har biri 15 kredit).

## Lokal sinov (Cloudflare muhitida)

```bash
npm install
npx wrangler dev --port 8788 --var TEACHER_CODE:ustoz-local --var JWT_SECRET:local-secret-1234567890
# http://localhost:8788
```

Agar loyiha Cloudflare **Pages** sifatida yaratilgan bo'lsa, `functions/api/[[path]].js` ulagichi ishlaydi. Bu holda bog'lanishlarni (D1 — `DB`, R2 — `FILES`) va `nodejs_compat` bayrog'ini panelda qo'lda qo'shish kerak.
