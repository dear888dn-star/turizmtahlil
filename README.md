# TurTahlil akademiya

**"Turistik korxonalar faoliyati tahlili"** fani bo'yicha interaktiv ta'lim platformasi. Platforma 61010400 – Turizm yo'nalishi bakalavriat talabalari uchun mo'ljallangan: O'zMU Jizzax filiali, fan kodi TKFT1706, VII semestr, 6 kredit.

Asosiy manba: A.N. Xoliqulov, *"Turistik korxonalar faoliyati tahlili"*, o'quv qo'llanma (Samarqand, STEP-SEL, 2024). Unga fan dasturi (2026–2027), 18 ta dars taqdimoti va amaliy mashg'ulotlar to'plami qo'shilgan. Barcha boshlang'ich fayllar `manbalar/` papkasida.

## Imkoniyatlar

| Bo'lim | Tavsif |
|---|---|
| 📚 **Mavzular (18)** | Qo'llanma matni kirill yozuvidan lotin yozuviga avtomatik o'girilgan. Har bir mavzuda: bo'limlar (jadval va formulalar asl joylashuvida), dars taqdimoti (PDF ko'ruvchi), animatsion dars, audiokitob, tushunchalar kartalari, interaktiv metodlar, qo'llanmadagi savollar va tayanch iboralar, test, amaliy mashg'ulot va mustaqil ish. Fan dasturi bo'yicha ta'lim natijalari va 100 ballik baholash tizimi ham kiritilgan. |
| 🔄 **Dolzarb ma'lumotlar** | Qo'llanmadagi eskirgan statistika va me'yoriy hujjatlar 2026-yil oktabr holatiga tekshirilgan: 18 ta yangilanish, rasmiy manbalar bilan. Manbalar: UN Tourism, WTTC, Statistika qo'mitasi, lex.uz, Markaziy bank. Mavzu matnida eskirgan jumla sariq rangda belgilanadi, yonida yangi qiymat ko'rsatiladi. Yangilash uchun `public/data/updates.js` faylini tahrirlang. |
| 🧮 **Amaliy mashg'ulotlar + AI tekshiruv** | 18 mashg'ulotda 57 ta hisob-kitob masalasi bor; javob darhol tekshiriladi va namunaviy yechim ko'rsatiladi. Masalalardan tashqari keyslar va xulosa yozish qismi ham bor. **🤖 AI tekshiruvi** 10 ballik mezon bo'yicha baholaydi: formulalar 3, aniqlik 3, tahlil 2, keys 1, mustaqillik 1. U har bir topshiriqqa izoh, xatolar va tavsiyalar beradi. Natijalar o'qituvchi panelida ko'rinadi, o'qituvchi o'z bahosi va izohini qo'shadi. |
| 🔬 **Tahlil laboratoriyasi** | Ikki yillik balans va moliyaviy natijalar kiritiladi (3 ta namuna korxona yoki o'z ma'lumotlaringiz). Platforma avtomatik hisoblaydi: gorizontal va vertikal tahlil, likvidlik, A1–A4/P1–P4, moliyaviy barqarorlik, aylanish, ROS/ROA/ROE, DuPont, zararsizlik nuqtasi (grafik bilan) va 2026-yil me'yorlari bo'yicha "svetofor". Talaba xulosa yozadi. AI 9 mezonli 100 ballik rubrika bo'yicha feedback beradi, yakuniy bahoni o'qituvchi qo'yadi. |
| 🎙️ **Tahlilchi trenajyori** | 8 ta ssenariy bor. AI direktor, bank kredit mutaxassisi, investor, auditor yoki tadbirkor rolini o'ynaydi, talaba esa tahlil natijalarini himoya qiladi. Ovozli rejim bor. Oxirida 5 mezon bo'yicha 100 ballik AI bahosi chiqadi. |
| 🛂 **Tahlilchi pasporti** | XP, 8 daraja (Stajyor → Tahlil ustasi), nishonlar, reyting va sertifikat (`#/cert/TT-XXXXXXXX`). |
| 🎮 **Live**, 🔁 **Takrorlash**, 🤖 **AI Ustoz**, 🧩 **Mustaqil ta'lim**, 🎬 **Mediateka** | Avvalgi platformadan o'tkazilgan va yangi fanga moslangan bo'limlar. |
| 📊 **O'qituvchi paneli** | AI tekshiruvlari (filtr, o'rtacha baho, CSV), laboratoriya hisobotlarini baholash, mustaqil ishlar, trenajyor natijalari, talabalar, test tahlili, taqdimot va videolar, AI ovozlar, Live. |

So'rovnomalar funksiyasi bu platformada **yo'q**.

## Ma'lumot fayllari

- `public/data/book.js` — o'quv qo'llanma matni. Qayta yaratish: `python3 scripts/import-pdf.py manbalar/<qo'llanma>.pdf`. Kirill→lotin o'girish moduli: `scripts/translit.py`.
- `public/data/layer-a.js`, `layer-b.js` — glossariy, testlar (to'g'ri javob — `c` indeksi), interaktiv metodlar va mustaqil ishlar.
- `public/data/practice.js` — amaliy mashg'ulot masalalari va javoblari. Barcha javoblar qayta hisoblab tekshirilgan. Amaliy to'plamdagi ikki xato kalit tuzatilgan:
  - 16-mavzuning natural zararsizlik nuqtasi to'g'risi ≈1 925,3 birlik;
  - 18-mavzuning ish vaqti fondi to'g'risi 227 456,8 soat.
- `public/data/updates.js` — dolzarb ma'lumotlar.
- `public/slides/NN.pdf` — dars taqdimotlari (`manbalar/*.pptx` dan PDF ga o'girilgan).
- `public/js/finance.js` — moliyaviy ko'rsatkichlar formulalari va namuna korxonalar.

## Texnologiyalar

- Frontend oddiy HTML/CSS/JavaScript (ES modullar), yig'ish bosqichi yo'q.
- Backend: Netlify Functions (`netlify/functions/api.mjs`), ma'lumotlar Netlify Blobs'da saqlanadi.
- AI: Google Gemini (bepul kalit) yoki Claude API. Kalit bo'lmasa, AI tekshiruvi avtomatik qoidalar asosida taxminiy baho beradi, trenajyor esa demo-rejimda ishlaydi.

## Netlify'ga joylashtirish

1. [app.netlify.com](https://app.netlify.com) sahifasida **Add new site → Import an existing project → GitHub** ni tanlang va `turizmtahlil` repozitoriysini ko'rsating. Sozlamalar `netlify.toml` dan olinadi.
2. **Environment variables** bo'limiga quyidagilarni kiriting:
   - `JWT_SECRET` (majburiy) — uzun tasodifiy satr;
   - `TEACHER_CODE` (majburiy) — o'qituvchilar ro'yxatdan o'tishi uchun kod;
   - `GEMINI_API_KEY` (tavsiya) — [aistudio.google.com](https://aistudio.google.com) saytidan bepul olinadi. U AI tekshiruv, trenajyor, AI Ustoz va AI ovozni yoqadi;
   - ixtiyoriy: `ANTHROPIC_API_KEY` va `ANTHROPIC_MODEL`.
3. **Deploy** tugmasini bosing, so'ng saytda **Ro'yxatdan o'tish → O'qituvchi** orqali `TEACHER_CODE` bilan kiring.

Sozlamalar holatini tekshirish uchun `https://<sayt>.netlify.app/api/health` manzilini oching.

## Lokal ishga tushirish

```bash
npm install
cp .env.example .env   # ixtiyoriy: GEMINI_API_KEY
npm run dev            # http://localhost:8888, o'qituvchi kodi: ustoz-local
```
