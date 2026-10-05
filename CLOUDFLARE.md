# TurTahlil'ni Cloudflare Pages'ga joylash

Platformaning asosiy versiyasi Cloudflare Pages'da ishlaydi:

- **Sahifalar, taqdimotlar va rasmlar** statik fayllar sifatida beriladi. Bepul tarifda ular uchun so'rovlar va trafik cheklanmagan.
- **Server qismi (`/api/*`)** `functions/api/[[path]].js` faylida. Bepul tarifda kuniga 100 000 ta so'rov beriladi.
- **Ma'lumotlar** (akkauntlar, progress, AI tekshiruvlari, laboratoriya, baholar) **D1** bazasida saqlanadi. Bazadagi jadval birinchi so'rovda avtomatik yaratiladi.
- **Fayllar** (o'qituvchi yuklagan taqdimot va videolar, AI ovozlari) **R2** fayl omborida saqlanadi.

GitHub'ga har bir push Cloudflare'da avtomatik deploy qiladi. Bepul tarifda oyiga 500 ta deploy beriladi va hech qanday kredit yechilmaydi.

## 1. Loyihani yaratish

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. GitHub'dan `turizmtahlil` repozitoriysini tanlang.
3. Sozlamalar:
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** `npm install`
   - **Build output directory:** `public`
   - **Root directory:** bo'sh qoldiring
4. **Save and Deploy** tugmasini bosing. Birinchi deploy tugaganda sahifalar ochiladi, lekin kirish va ro'yxatdan o'tish hali ishlamaydi. Ular keyingi qadamlardan so'ng ishlaydi.

## 2. D1 ma'lumotlar bazasi (majburiy)

1. **Workers & Pages** → **D1 SQL Database** → **Create**. Nomi: `turtahlil-db`.
2. SQL kod kiritish shart emas: jadval avtomatik yaratiladi.

## 3. R2 fayl ombori (tavsiya etiladi)

1. Chap menyu → **R2 Object Storage** → **Create bucket**. Nomi: `turtahlil-files`.
2. R2 faqat quyidagilar uchun kerak:
   - o'qituvchi yuklaydigan qo'shimcha taqdimot va videolar;
   - AI ovozlari.

   18 ta dars taqdimoti platformaga allaqachon o'rnatilgan, ular R2'siz ham ishlaydi.

## 4. Bog'lanishlar (Bindings)

Pages loyihangiz → **Settings** → **Bindings** → **Add**:

| Turi | Variable name | Tanlang |
|---|---|---|
| D1 database | `DB` | `turtahlil-db` |
| R2 bucket | `FILES` | `turtahlil-files` |

Nomlar aynan shunday, katta harflar bilan yozilishi kerak.

## 5. Node.js moslik bayrog'i (majburiy)

**Settings** → **Runtime** bo'limida:

- **Compatibility flags:** `nodejs_compat` qo'shing (Production va Preview uchun).
- **Compatibility date:** `2026-09-01` yoki undan keyingi sana.

## 6. Maxfiy kalitlar

**Settings** → **Variables and Secrets** → **Add**. Har birining turi: **Secret**.

| Nomi | Majburiy | Qiymati |
|---|---|---|
| `JWT_SECRET` | ✅ | Uzun tasodifiy satr (40+ belgi) |
| `TEACHER_CODE` | ✅ | O'qituvchi ro'yxatdan o'tishi uchun maxfiy kod |
| `GEMINI_API_KEY` | tavsiya | [aistudio.google.com](https://aistudio.google.com) → Get API key (bepul). AI tekshiruv, trenajyor, AI Ustoz va AI ovozni yoqadi |
| `ANTHROPIC_API_KEY` | yo'q | Claude kaliti (pullik). O'rnatilsa, Gemini o'rniga ishlatiladi |

## 7. Qayta deploy

**Deployments** → oxirgi deploy → **Retry deployment**. Bog'lanishlar va kalitlar faqat yangi deploy'dan keyin kuchga kiradi.

Tekshirish uchun `https://<loyiha-nomi>.pages.dev/api/health` manzilini oching. U yerda `"platform":"Cloudflare Pages"` yozuvi va `"blobs":"ishlayapti"` (ombor ishlayapti) ko'rinishi kerak.

So'ng saytda **Ro'yxatdan o'tish → O'qituvchi** ni tanlab, `TEACHER_CODE` bilan profil yarating.

## Bepul tarif chegaralari va platformaning moslashuvi

- **Server so'rovlari: kuniga 100 000 ta.** Talaba progressi 15 soniyada bir marta yig'ib saqlanadi, sahifa va taqdimotlar esa server so'rovi hisoblanmaydi. Shuning uchun 100–200 nafar talaba bemalol sig'adi. Limit oshib ketsa, sayt faqat ertasi kungacha to'xtaydi (Toshkent vaqti bilan soat 5:00 gacha).
- **Har bir so'rovga 10 ms protsessor vaqti:**
  - parol PBKDF2 (60 000 iteratsiya) bilan shifrlanadi;
  - AI ovozi MP3 ga siqilmasdan WAV formatida saqlanadi;
  - reyting va o'qituvchi paneli barcha ma'lumotni bir necha umumiy so'rov bilan oladi.

  Agar baribir "Exceeded CPU limit" xatosi chiqsa, `server/auth.mjs` faylidagi `PBKDF2_ITER` qiymatini kamaytiring.
- **D1: 5 GB, R2: 10 GB.**

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
npx wrangler pages dev public --d1 DB=turtahlil-db --r2 FILES=turtahlil-files \
  --compatibility-date 2026-09-01 --compatibility-flags nodejs_compat \
  --binding TEACHER_CODE=ustoz-local --binding JWT_SECRET=local-secret-1234567890
# http://localhost:8788
```
