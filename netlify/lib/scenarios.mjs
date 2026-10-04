// "Tahlilchi trenajyori" ssenariylari: talaba turistik korxona moliyaviy tahlilchisi / maslahatchisi rolida,
// AI esa rahbar, mulkdor, bank xodimi, investor yoki auditor rolini o'ynaydi.
// Har bir ssenariy: vaziyat (brief), talabaga ko'rinadigan raqamlar (facts), muhokama bosqichlari (route),
// personaj (persona), kutilmagan hodisalar (twists) va demo-rejim uchun kalit so'zlar.

export const CRITERIA = [
  { key: "communication", title: "Kasbiy muloqot va xulosani tushunarli yetkazish", max: 20 },
  { key: "knowledge", title: "Tahlil usullari va ko'rsatkichlarni bilish", max: 20 },
  { key: "problem", title: "Hisob-kitob va raqamlar bilan asoslash", max: 20 },
  { key: "digital", title: "Boshqaruv qarori va amaliy takliflar", max: 20 },
  { key: "service", title: "Professional etika va mas'uliyat", max: 20 },
];

export const SCENARIOS = [
  {
    id: "profit-drop",
    title: "Tushum o'sdi, foyda kamaydi",
    category: "Moliyaviy natijalar",
    level: "Boshlang'ich",
    icon: "📉",
    location: "Samarqand, “Silk Road Travel” turoperatori",
    duration: 12,
    language: "o'zbek",
    topics: ["t1", "t13", "t14"],
    role: "Siz firmaga taklif qilingan moliyaviy tahlilchisiz.",
    brief: "Firma direktori Bahodir aka hayron: tushum bir yilda 9,6 mlrd so'mdan 11,5 mlrd so'mga oshdi, lekin sof foyda kamaydi. U sizdan sababini oddiy tilda tushuntirib, 3 ta aniq chora taklif qilishingizni so'rayapti.",
    facts: [
      ["Sof tushum", "9 600 → 11 500 mln so'm"],
      ["Tannarx (mehmonxona, transport, gid)", "8 160 → 9 890 mln so'm"],
      ["Sotish xarajatlari", "420 → 520 mln so'm"],
      ["Ma'muriy xarajatlar", "380 → 420 mln so'm"],
      ["Moliyaviy xarajatlar (kredit foizi)", "35 → 70 mln so'm"],
      ["Sof foyda", "527 → 518 mln so'm"],
    ],
    objectives: [
      "Yalpi marjani ikki yil uchun hisoblab, o'zgarishini tushuntirish",
      "Xarajatlar tushumdan tez o'sganini raqamlar bilan ko'rsatish",
      "Foyda kamayishining asosiy omillarini ajratish",
      "3 ta aniq boshqaruv chorasini taklif qilish",
    ],
    route: [
      { title: "Yalpi marja", hint: "(Tushum − Tannarx) / Tushum: 15,0% → 14,0%" },
      { title: "Xarajatlar dinamikasi", hint: "Tannarx +21,2%, tushum +19,8%; kredit foizi 2 baravar" },
      { title: "Choralar", hint: "Mehmonxonalar bilan yillik kontrakt, narx siyosati, qarzni qayta ko'rib chiqish" },
    ],
    persona: "Sen “Silk Road Travel” direktori Bahodir akasan, 52 yosh, tajribali, lekin moliyaviy atamalarni yaxshi bilmaysan. Sodda savollar berasan: “Marja degani nima?”, “Unda narxni ko'tarsak bo'ladimi?”. Raqamlarsiz umumiy gaplarga ishonmaysan va “aniq qancha?” deb so'raysan. Agar tahlilchi aniq raqam va mantiq bilan tushuntirsa — rozi bo'lasan, buyruq berishga tayyor bo'lasan.",
    opening: "Bahodir aka: Assalomu alaykum, uka. Ko'rib turibsiz — sotuv yaxshi, turistlar ko'p. Lekin buxgalter foyda kamaydi deyapti. Qanday qilib? Tushunmayapman.",
    twists: [
      { afterTurn: 3, text: "Buxgalter xonaga kirib, ikkita mehmonxona 2026-yil mavsumi uchun narxlarni yana 8% oshirishini aytdi." },
      { afterTurn: 6, text: "Bahodir aka: “Raqobatchilar narxni pasaytiryapti. Biz ham 10% chegirma qilsak, sotuv ko'payadi-ku?” deb so'radi." },
    ],
    keywords: ["marja", "tannarx", "15", "14", "foiz", "kontrakt", "narx", "xarajat", "sof foyda", "kredit"],
    fallback: [
      "Bahodir aka: Marja degani nima? Oddiy qilib tushuntiring-chi.",
      "Bahodir aka: Demak, xarajat tez o'sgan ekan. Qaysi biri eng ko'p o'sgan?",
      "Bahodir aka: Mehmonxonalar yana narx oshirmoqchi... Nima qilamiz?",
      "Bahodir aka: Chegirma qilsak-chi? Sotuv ko'payadi-ku.",
      "Bahodir aka: Yaxshi, 3 ta chorani qisqacha takrorlang, men buyruq tayyorlatay.",
      "Bahodir aka: Rahmat, uka. Endi tushundim.",
    ],
  },
  {
    id: "bank-credit",
    title: "Bankdan kredit: likvidlikni himoya qilish",
    category: "Likvidlik va to'lov qobiliyati",
    level: "O'rta",
    icon: "🏦",
    location: "Toshkent, tijorat banki kredit bo'limi",
    duration: 15,
    language: "o'zbek",
    topics: ["t12", "t9", "t8"],
    role: "Siz “Registan Plaza” mehmonxonasining moliya menejerisiz va 3 mlrd so'mlik aylanma kredit so'rayapsiz.",
    brief: "Bank kredit mutaxassisi mehmonxonaning likvidlik ko'rsatkichlari pastligini aytib, kreditni rad etishga moyil. Siz ko'rsatkichlarni to'g'ri talqin qilib, kreditni qaytarish manbasini asoslashingiz kerak.",
    facts: [
      ["Joriy aktivlar", "4 200 mln so'm"],
      ["Joriy majburiyatlar", "6 650 mln so'm"],
      ["Pul mablag'lari", "1 650 mln so'm"],
      ["Xususiy kapital / aktivlar", "26 050 / 44 000 mln so'm"],
      ["Sof foyda", "1 800 → 3 780 mln so'm"],
      ["Bandlik (occupancy)", "58% → 66%; mavsum: aprel–oktabr"],
    ],
    objectives: [
      "Joriy, tez va absolyut likvidlikni hisoblash va talqin qilish",
      "Avtonomiya koeffitsiyenti (0,59) kuchli tomon ekanini ko'rsatish",
      "Kreditni qaytarish manbai (mavsumiy pul oqimi) va garovni asoslash",
      "Likvidlikni yaxshilash rejasini taklif qilish",
    ],
    route: [
      { title: "Likvidlik", hint: "Joriy ≈ 0,63; absolyut ≈ 0,25 — joriy past, chunki kreditorlik va qisqa muddatli qarz katta" },
      { title: "Barqarorlik", hint: "Avtonomiya ≈ 0,59 (≥ 0,5), foyda 2 baravar o'sgan" },
      { title: "Qaytarish rejasi", hint: "Mavsumiy pul oqimi, 14% asosiy stavka, garov — bino" },
    ],
    persona: "Sen tijorat banki kredit mutaxassisi Dilnoza Rahimovasan, 35 yosh, qat'iy va professional. Raqamlarni bilasan: “Joriy likvidlik 1 dan past — bu xavf” deysan. Har bir da'voga dalil so'raysan, pul oqimi prognozi, garov va mavsumiylik haqida savollar berasan. Asosli javob bo'lsa, shartlar bilan rozilik berishga tayyorsan (masalan, kredit limiti kamroq yoki muddatli). Bank asosiy stavkasi 14%, kredit stavkasi taxminan 20–22%.",
    opening: "Dilnoza: Xush kelibsiz. Hujjatlaringizni ko'rdim. Ochig'ini aytsam, joriy likvidlik 1 dan ancha past. Nega bank sizga 3 milliard bermasligi kerak emas?",
    twists: [
      { afterTurn: 3, text: "Dilnoza: “Kreditorlik qarzingiz bir yilda 2,85 dan 4,55 milliardga oshibdi. Yetkazib beruvchilarga to'lay olmayapsizmi?”" },
      { afterTurn: 6, text: "Dilnoza: “Yaxshi. Agar 2 milliard 12 oyga bersak, oylik to'lov jadvalini qanday ko'rasiz?”" },
    ],
    keywords: ["likvidlik", "joriy", "absolyut", "avtonomiya", "pul oqimi", "mavsum", "garov", "kreditorlik", "0,6", "foyda"],
    fallback: [
      "Dilnoza: Raqamlar bilan gapiring: joriy likvidlik qancha?",
      "Dilnoza: Kreditorlik nega bunchalik oshgan?",
      "Dilnoza: Kreditni qaysi pul hisobidan qaytarasiz?",
      "Dilnoza: Garov sifatida nima taklif qilasiz?",
      "Dilnoza: 2 milliard 12 oyga — to'lov jadvalini ayting.",
      "Dilnoza: Yaxshi, arizangizni kredit qo'mitasiga kiritaman.",
    ],
  },
  {
    id: "receivables",
    title: "Debitorlar “muzlatgan” pul",
    category: "Debitorlik va kreditorlik",
    level: "O'rta",
    icon: "🧾",
    location: "Jizzax, “Zomin Eco Tour”",
    duration: 12,
    language: "o'zbek",
    topics: ["t10", "t11"],
    role: "Siz firmaning moliyaviy maslahatchisisiz.",
    brief: "Firma korporativ mijozlarga 60 kunlik kechiktirilgan to'lov bilan tur sotadi. Pul yetishmayapti: mehmon uylari uchun kommunal to'lovlar va xodimlar oyligi kechikmoqda. Ta'sischi Nilufar opa nima qilishni so'rayapti.",
    facts: [
      ["Yillik sof tushum", "25 200 mln so'm (shartli)"],
      ["Debitorlik qarzi", "4 200 mln so'm, 30% muddati o'tgan"],
      ["Kreditorlik qarzi", "5 000 mln so'm"],
      ["Aylanma aktivlar / jami aktivlar", "8 000 / 15 000 mln so'm"],
      ["Hamkor mehmonxonalar talabi", "15 kun ichida to'lov"],
    ],
    objectives: [
      "Debitorlik aylanish davri (60 kun) va muddati o'tgan qarz ulushini hisoblash",
      "Immobilizatsiya koeffitsiyentlarini talqin qilish",
      "Kredit siyosati: limit, avans, chegirma, undirish bosqichlari",
      "Pul oqimidagi uzilishni yopish rejasini taklif qilish",
    ],
    route: [
      { title: "Diagnostika", hint: "360 / (25 200 / 4 200) = 60 kun; muddati o'tgan 30%" },
      { title: "Xavf", hint: "Kreditorlik/debitorlik = 1,19; aylanma mablag'larning 52,5% i debitorlarda" },
      { title: "Kredit siyosati", hint: "30–50% avans, 2% chegirma, limitlar, da'vo, faktoring" },
    ],
    persona: "Sen “Zomin Eco Tour” ta'sischisi Nilufar opasan, 40 yosh, mijozlarni yo'qotishdan qo'rqasan: “Agar avans so'rasak, korporativ mijozlar ketib qoladi”. Hissiy, lekin mantiqli dalilga ko'nasan. Maslahatchidan aniq, bosqichma-bosqich reja kutasan.",
    opening: "Nilufar opa: Hamma to'lov kechikadi... Sotuv bor, lekin kassada pul yo'q. Xodimlarga oylik bera olmayapman. Nima qilay?",
    twists: [
      { afterTurn: 3, text: "Eng katta korporativ mijoz (1,2 mlrd so'm qarzdor) yana 30 kunga muddat uzaytirishni so'radi." },
      { afterTurn: 5, text: "Bank faktoring xizmatini taklif qildi: qarz summasining 4% i evaziga pulni darhol beradi." },
    ],
    keywords: ["60 kun", "aylanish", "muddati o'tgan", "avans", "chegirma", "limit", "faktoring", "immobilizatsiya", "kredit siyosati", "shartnoma"],
    fallback: [
      "Nilufar opa: Bu qarzlar qanchalik xavfli? Raqam bilan ayting.",
      "Nilufar opa: Avans so'rasam mijozlar ketadi-ku...",
      "Nilufar opa: Katta mijoz yana muddat so'rayapti. Rozi bo'laymi?",
      "Nilufar opa: Faktoring foydalimi? 4% ko'p emasmi?",
      "Nilufar opa: Rejani qisqacha bosqichma-bosqich ayting.",
      "Nilufar opa: Rahmat, ertadan boshlayman.",
    ],
  },
  {
    id: "breakeven-tour",
    title: "Yangi turpaket: zararsizlik nuqtasi",
    category: "Zararsizlik nuqtasi",
    level: "Boshlang'ich",
    icon: "🎯",
    location: "Buxoro, turagentlik",
    duration: 10,
    language: "o'zbek",
    topics: ["t16", "t13"],
    role: "Siz turagentlik iqtisodchisisiz.",
    brief: "Marketing menejeri Sardor yangi “Buxoro gastronomik turi”ni ishga tushirmoqchi va narxni pasaytirib ko'proq sotishni taklif qiladi. Siz zararsizlik nuqtasini hisoblab, qaror bo'yicha tavsiya berasiz.",
    facts: [
      ["Turpaket narxi", "3 000 000 so'm"],
      ["Bir turistga o'zgaruvchan xarajat", "2 100 000 so'm"],
      ["Mavsumiy doimiy xarajatlar", "90 mln so'm"],
      ["Rejadagi sotuv", "160 turist"],
      ["Marketing taklifi", "narx −10%, sotuv +30%"],
    ],
    objectives: [
      "Bir turistga marjinal daromad va zararsizlik nuqtasini (100 turist) hisoblash",
      "Hozirgi va taklif qilingan variantdagi foydani solishtirish (54 va 34,8 mln)",
      "Xavfsizlik zaxirasini baholash",
      "Asosli qaror taklif qilish",
    ],
    route: [
      { title: "Hozirgi holat", hint: "Md = 0,9 mln; Zn = 100 turist; F = 54 mln" },
      { title: "Taklif", hint: "Md = 0,6 mln; Zn = 150; 208 turistda F = 34,8 mln" },
      { title: "Qaror", hint: "Chegirmani faqat bo'sh o'rinlarga / mavsumdan tashqari" },
    ],
    persona: "Sen marketing menejeri Sardorsan, 28 yosh, g'ayratli, “ko'proq sotuv = ko'proq foyda” deb ishonasan. Hisob-kitobga e'tiroz bildirasan: “Lekin 48 ta qo'shimcha turist!”. Raqamlar bilan isbotlansa, murosaga kelasan va alternativa so'raysan.",
    opening: "Sardor: Salom! G'oyam zo'r: narxni 10% tushiramiz — 2,7 million — va sotuv kamida 30% oshadi. Rahbarga taqdim qilishdan oldin siz tasdiqlab bering, iltimos.",
    twists: [
      { afterTurn: 3, text: "Sardor: “Raqobatchi firma xuddi shu turni 2,6 millionga sotyapti!”" },
    ],
    keywords: ["marjinal", "zararsizlik", "100", "150", "doimiy", "o'zgaruvchan", "54", "xavfsizlik", "foyda", "turist"],
    fallback: [
      "Sardor: Zararsizlik nuqtasi degani nima, nechta turist kerak?",
      "Sardor: Chegirma bilan 208 ta turist sotsak-chi? Foyda ko'p bo'ladi-ku!",
      "Sardor: Raqobatchi 2,6 millionga sotyapti, nima qilamiz?",
      "Sardor: Unda qanday murosali variant taklif qilasiz?",
      "Sardor: Tushundim, rahbarga shu hisob bilan boramiz.",
    ],
  },
  {
    id: "hotel-investor",
    title: "Investor bilan uchrashuv: rentabellik",
    category: "Rentabellik va DuPont",
    level: "Murakkab",
    icon: "💼",
    location: "Samarqand, “Registan Plaza” mehmonxonasi",
    duration: 15,
    language: "o'zbek",
    topics: ["t15", "t6", "t14"],
    role: "Siz mehmonxonaning moliya direktorisiz.",
    brief: "Xorijiy investor mehmonxonaga ulush sotib olishni o'ylamoqda. U ROE, ROA va aktivlardan foydalanish samaradorligini so'raydi, hamda rentabellikni 2028-yilgacha oshirish rejasini kutadi.",
    facts: [
      ["Sof tushum", "21 400 → 25 900 mln so'm"],
      ["Sof foyda", "1 800 → 3 780 mln so'm"],
      ["Jami aktivlar (o'rtacha)", "≈ 42 925 mln so'm"],
      ["Xususiy kapital (o'rtacha)", "≈ 25 425 mln so'm"],
      ["Bandlik / ADR", "66% / 1,15 mln so'm"],
      ["Asosiy stavka (CBU)", "14%"],
    ],
    objectives: [
      "ROS (14,6%), ROA (8,8%), ROE (14,9%) ni hisoblash",
      "DuPont: ROE = ROS × aylanish × leverej ko'rinishida tushuntirish",
      "ROE ni asosiy stavka (14%) bilan solishtirish",
      "Rentabellikni oshirish rejasi: RevPAR, xarajatlar, kapitaldan foydalanish",
    ],
    route: [
      { title: "Rentabellik", hint: "ROS 14,6%; ROA 8,8%; ROE 14,9%" },
      { title: "DuPont", hint: "0,146 × 0,603 × 1,69 ≈ 0,149" },
      { title: "Reja", hint: "RevPAR o'sishi, MICE, energiya tejash, yer/mol-mulk solig'i imtiyozi 2030-yilgacha" },
    ],
    persona: "Sen Dubaydagi investitsiya fondi vakili Mr. Khalid Al-Mansuri san. O'zbek tilida, ba'zan inglizcha atamalar bilan gapirasan (ROE, payback, RevPAR). Pragmatik va shubhali: “Nega pulimni bankka 14% ga qo'ymasligim kerak?” deysan. Aniq raqam, risk va o'sish rejasini so'raysan.",
    opening: "Khalid: Good afternoon. Mehmonxona chiroyli. Lekin menga raqamlar kerak: sizning return on equity qancha va nega u bank depozitidan yaxshiroq?",
    twists: [
      { afterTurn: 3, text: "Khalid: “Aktivlar aylanishi 0,6 — bu juda past emasmi? Mehmonxona yarmi bo'sh turadimi?”" },
      { afterTurn: 6, text: "Khalid: “Agar men 5 mln dollar kiritsam, qarzni yopasizmi yoki kengaytirasizmi? ROE qanday o'zgaradi?”" },
    ],
    keywords: ["roe", "roa", "ros", "dupont", "leverej", "aylanish", "14", "revpar", "bandlik", "rentabellik"],
    fallback: [
      "Khalid: ROE qancha? Raqamni ayting.",
      "Khalid: Bank 14% beradi. Sizdagi risk-chi?",
      "Khalid: Aktivlar aylanishi past ekan — nega?",
      "Khalid: Agar men pul kiritsam, ROE qanday o'zgaradi?",
      "Khalid: 2028-yilgacha rejangizni 3 ta raqamda ayting.",
      "Khalid: Thank you. Men o'ylab ko'raman.",
    ],
  },
  {
    id: "audit-balance",
    title: "Auditor savollari: balans va hisobotlar",
    category: "Moliyaviy hisobotlar",
    level: "O'rta",
    icon: "🔎",
    location: "Toshkent, auditorlik tashkiloti",
    duration: 12,
    language: "o'zbek",
    topics: ["t3", "t4", "t5"],
    role: "Siz turistik firmaning bosh buxgalteri / tahlilchisisiz.",
    brief: "Auditor 2025-yil hisobotlarini tekshirmoqda va hisobotlararo nomuvofiqliklarni topdi. Siz ularni tushuntirishingiz, amaldagi me'yorlarni (181-son buyruq bilan tasdiqlangan Nizom, 1-son BHMS) bilishingizni ko'rsatishingiz kerak.",
    facts: [
      ["Sof foyda (moliyaviy natijalar)", "450 mln so'm"],
      ["To'langan dividend", "150 mln so'm"],
      ["Taqsimlanmagan foyda o'sishi (balans)", "260 mln so'm"],
      ["Pul mablag'lari", "foyda bor, lekin −100 mln so'm"],
      ["Hisobot topshirilgan sana", "2026-yil 12-mart (BHMS bo'yicha)"],
    ],
    objectives: [
      "450 − 150 = 300 ≠ 260 farqini aniqlash va sababini izlash",
      "Foyda bo'lsa ham pul kamayishini pul oqimlari orqali tushuntirish",
      "Hisobot topshirish muddati (1-mart) buzilganini tan olish",
      "Ichki nazorat bo'yicha choralar taklif qilish",
    ],
    route: [
      { title: "Hisobotlararo bog'liqlik", hint: "300 − 260 = 40 mln farq: tuzatish, rezerv yoki xato" },
      { title: "Pul oqimi", hint: "Debitorlik o'sishi, investitsiyalar, kredit qaytarish" },
      { title: "Me'yorlar", hint: "BHMS — 1-martgacha, MHXS — 1-maygacha" },
    ],
    persona: "Sen auditor Javlon Karimovsan, 45 yosh, xushmuomala, lekin juda sinchkov. Har bir raqamning manbasini so'raysan, “Qaysi hujjat asosida?” deysan. Noaniq javobga qo'shimcha savol berasan; asosli tushuntirishni qayd etasan.",
    opening: "Javlon: Assalomu alaykum. Bir nechta savol bor. Sof foyda 450, dividend 150, lekin taqsimlanmagan foyda faqat 260 millionga oshgan. 40 million qayerda?",
    twists: [
      { afterTurn: 4, text: "Javlon: “Yana bir narsa: yillik hisobot 12-martda topshirilgan. Muddat qachon edi?”" },
    ],
    keywords: ["300", "40", "taqsimlanmagan", "dividend", "pul oqimi", "debitorlik", "1-mart", "bhms", "nizom", "tuzatish"],
    fallback: [
      "Javlon: 40 million farq qayerdan? Hujjat bilan tushuntiring.",
      "Javlon: Foyda bor, lekin pul kamaygan. Nega?",
      "Javlon: Hisobot muddati qachon edi?",
      "Javlon: Kelgusida bunday xatolarning oldini qanday olasiz?",
      "Javlon: Rahmat, izohlaringizni dalolatnomaga kiritaman.",
    ],
  },
  {
    id: "staff-productivity",
    title: "Xodimlar va mehnat unumdorligi",
    category: "Mehnat ko'rsatkichlari",
    level: "O'rta",
    icon: "👥",
    location: "Xiva, mehmonxona va turagentlik",
    duration: 12,
    language: "o'zbek",
    topics: ["t18"],
    role: "Siz HR-tahlilchisiz.",
    brief: "Mulkdor ish haqi xarajatlari tez o'sayotganidan xavotirda va 10% xodimni qisqartirmoqchi. Siz mehnat unumdorligi va qo'nimsizlik ko'rsatkichlari asosida muqobil yechim taklif qilasiz.",
    facts: [
      ["Xizmat hajmi", "18 000 → 20 700 mln so'm"],
      ["Xodimlar soni", "60 → 63 kishi"],
      ["Ish haqi fondi", "3 240 → 3 900 mln so'm"],
      ["Qo'nimsizlik", "o'rtacha 400 xodimdan 20 kishi (tarmoq bo'yicha)"],
      ["Eng kam oylik (01.09.2026)", "1 360 000 so'm"],
    ],
    objectives: [
      "Bir xodim unumdorligi (300 → 328,6 mln, +9,5%) ni hisoblash",
      "Ish haqi fondi o'sishi (+20,4%) bilan solishtirish",
      "Qisqartirishning xavflarini (servis sifati, qo'nimsizlik) asoslash",
      "Unumdorlikni oshiruvchi muqobil choralar (KPI, mavsumiy shtat, raqamlashtirish)",
    ],
    route: [
      { title: "Unumdorlik", hint: "18 000/60 = 300; 20 700/63 = 328,6 (+9,5%)" },
      { title: "Ish haqi", hint: "O'rtacha oylik ish haqi 4,5 → 5,16 mln (+14,6%) — unumdorlikdan tez" },
      { title: "Yechim", hint: "KPI bonus, mavsumiy shtat, PMS/CRM orqali avtomatlashtirish" },
    ],
    persona: "Sen mehmonxona mulkdori Rustam aka san, 55 yosh, tejamkor, “ortiqcha odam ko'p” deb hisoblaysan. Raqamlar bilan isbotlansa, fikringni o'zgartirasan, lekin aniq KPI va natija so'raysan.",
    opening: "Rustam aka: Ish haqi har yili oshyapti. Men 6 ta xodimni qisqartirmoqchiman. Siz nima deysiz?",
    twists: [
      { afterTurn: 3, text: "Rustam aka: “Lekin eng kam oylik ham oshdi-ku, xarajat yana ko'payadi!”" },
    ],
    keywords: ["unumdorlik", "300", "328", "9,5", "ish haqi fondi", "qo'nimsizlik", "kpi", "mavsumiy", "avtomatlashtirish", "o'rtacha"],
    fallback: [
      "Rustam aka: Raqam bilan ayting, xodimlar yaxshi ishlayaptimi?",
      "Rustam aka: Unda nega ish haqi fondi tez o'smoqda?",
      "Rustam aka: Eng kam oylik oshdi — xarajat yana oshadi.",
      "Rustam aka: Qisqartirmasak, nima qilamiz? Aniq taklif bering.",
      "Rustam aka: Mayli, KPI tizimini sinab ko'ramiz.",
    ],
  },
  {
    id: "tax-regime-2026",
    title: "2026-yil: soliq rejimini tanlash",
    category: "Xarajatlar va soliqlar",
    level: "Murakkab",
    icon: "⚖️",
    location: "Jizzax, kichik mehmon uyi va turagentlik",
    duration: 12,
    language: "o'zbek",
    topics: ["t17", "t13", "t16"],
    role: "Siz tadbirkorga maslahat beruvchi iqtisodchisiz.",
    brief: "Kichik turistik biznes egasi 2026-yildagi o'zgarishlar (QQS bo'yicha soddalashtirilgan 6% rejim, aylanmadan olinadigan soliq, turistik soliq stavkalari) asosida qaysi rejimni tanlashni bilmaydi. Siz xarajatlar tarkibi va mijozlar turiga qarab tavsiya berasiz (yakuniy qaror soliq maslahatchisi bilan tasdiqlanishini ham eslatib).",
    facts: [
      ["Yillik tushum", "≈ 3,15 mlrd so'm"],
      ["Mijozlar", "60% korporativ (QQS to'lovchi), 40% jismoniy shaxslar"],
      ["Xarajatlar", "kirish QQSi bor xaridlar ~40%"],
      ["Variantlar", "umumiy QQS 12% yoki soddalashtirilgan QQS 6% (01.06.2026–01.01.2030, kirish QQSi hisobga olinmaydi)"],
      ["Turistik soliq (01.09.2026)", "xorijliklar — 66 000 so'm/sutka, fuqarolar — 1 760 so'm/sutka"],
    ],
    objectives: [
      "Ikki QQS rejimining farqini tushuntirish (6% da kirish QQSi hisobga olinmaydi)",
      "Korporativ mijozlar uchun QQS hisobga olinishini hisobga olish",
      "Turistik soliq tushum emasligi va alohida undirilishini tushuntirish",
      "Asosli tavsiya va keyingi qadamlar (soliq maslahatchisi, lex.uz)",
    ],
    route: [
      { title: "Rejimlar", hint: "12% (kirish QQSi hisobga olinadi) vs 6% (hisobga olinmaydi)" },
      { title: "Mijozlar", hint: "Korporativ mijozlar QQSni hisobga oladi" },
      { title: "Tavsiya", hint: "Taqqoslash jadvali + rasmiy maslahat" },
    ],
    persona: "Sen tadbirkor Shoxrux san, 33 yosh, internetda turli gaplarni o'qigan va chalkashgan: “Hamma 6% ga o'tyapti, biz ham o'tamizmi?”. Oddiy, amaliy savollar berasan. Aniq taqqoslash bo'lsa — qoniqasan.",
    opening: "Shoxrux: Assalomu alaykum! 2026-yilda soliqlar o'zgardi deyishyapti. 6% QQS degani nima, bizga foydalimi?",
    twists: [
      { afterTurn: 3, text: "Shoxrux: “Turistik soliqni o'z hisobimizga daromad qilib yozsak bo'ladimi?”" },
    ],
    keywords: ["qqs", "6%", "12%", "kirish qqs", "korporativ", "turistik soliq", "66 000", "1 760", "maslahat", "foyda solig'i"],
    fallback: [
      "Shoxrux: 6% bilan 12% ning farqi nimada?",
      "Shoxrux: Korporativ mijozlarimga bu qanday ta'sir qiladi?",
      "Shoxrux: Turistik soliqni daromad qilsak bo'ladimi?",
      "Shoxrux: Xo'sh, siz qaysi birini tavsiya qilasiz?",
      "Shoxrux: Rahmat, soliq maslahatchisi bilan ham gaplashaman.",
    ],
  },
];

// Ovozli rejim: personajlar jinsi (ovoz tanlash uchun)
const SPEAKERS = {
  "profit-drop": { "Bahodir aka": "m" },
  "bank-credit": { Dilnoza: "f" },
  receivables: { "Nilufar opa": "f" },
  "breakeven-tour": { Sardor: "m" },
  "hotel-investor": { Khalid: "m" },
  "audit-balance": { Javlon: "m" },
  "staff-productivity": { "Rustam aka": "m" },
  "tax-regime-2026": { Shoxrux: "m" },
};

export function publicScenario(s) {
  // Talabaga persona tafsilotlari emas, faqat vaziyat ko'rsatiladi.
  const { persona, keywords, fallback, ...rest } = s;
  const speakers = Object.fromEntries(Object.entries(SPEAKERS[s.id] || {}).map(([k, v]) => [k, v === "m" ? "male" : "female"]));
  return { ...rest, speakers };
}

const factsText = (s) => (s.facts || []).map(([k, v]) => `- ${k}: ${v}`).join("\n");

export function personaSystemPrompt(s) {
  return `Sen "Tahlilchi trenajyori" deb nomlangan ta'limiy simulyatorda rol o'ynaysan. Trenajyor OTM talabalarini ("Turistik korxonalar faoliyati tahlili" fani) real kasbiy vaziyatlarda moliyaviy tahlil natijalarini taqdim etish va himoya qilishga o'rgatadi.

VAZIYAT: ${s.title} (${s.location}).
${s.brief}

VAZIYATDAGI RAQAMLAR (talaba ham ko'radi):
${factsText(s)}

TALABANING ROLI: ${s.role}

SENING ROLING (personaj): ${s.persona}

MULOQOT TILI: ${s.language}.

QOIDALAR:
1. Faqat personaj nomidan gapir. Hech qachon o'zingni sun'iy intellekt yoki trenajyor deb atama, talabaning o'rniga hisob-kitob qilma va tayyor yechim aytma.
2. Javoblaring qisqa va tabiiy: 1–4 jumla.
3. Talaba raqam va mantiq bilan asoslasa — vaziyat yumshaydi; noaniq, umumiy yoki noto'g'ri gaplarga — e'tiroz bildirasan, aniq raqam so'raysan.
4. Talaba hisobda xato qilsa (yuqoridagi raqamlarga zid), personaj sifatida shubha bildir ("Menimcha, bu raqam boshqacha chiqadi-ku?").
5. Kvadrat qavsdagi [Vaziyat: ...] va [Bosqich: ...] yozuvlari rejissyor ko'rsatmalari; ularga personaj sifatida tabiiy reaksiya bildir.
6. Mavzudan chetga chiquvchi xabarlarga hayron bo'lib, suhbatni vaziyatga qaytar.
7. Faqat oddiy matn yoz: markdown belgilarini (*, **, #, _) ishlatma.
8. Vaziyat mantiqan hal bo'lganda, so'nggi javob oxirida alohida qatorda [[YAKUNLANDI]] belgisini qo'y.`;
}

export function evaluationPrompt(s, transcript, meta) {
  return `Sen "Turistik korxonalar faoliyati tahlili" fani bo'yicha tajribali o'qituvchi va moliyaviy tahlil ekspertisan. Quyida "Tahlilchi trenajyori"dagi mashg'ulot yozuvi keltirilgan. Talabaning faoliyatini xolis va pedagogik jihatdan foydali tarzda bahola.

SSENARIY: ${s.title} — ${s.location}
Talaba roli: ${s.role}
Vaziyat: ${s.brief}
Raqamlar:
${factsText(s)}
Maqsadlar:
${s.objectives.map((o, i) => `${i + 1}. ${o}`).join("\n")}
Kutilgan tahlil yo'nalishi: ${(s.route || []).map((r) => `${r.title}: ${r.hint}`).join("; ")}

BAHOLASH MEZONLARI (har biri 0–20 ball):
${CRITERIA.map((c) => `- ${c.key}: ${c.title}`).join("\n")}

QO'SHIMCHA: talaba ${meta.hintsUsed} marta "Ustoz maslahati"dan foydalandi; davomiyligi ${meta.durationMin} daqiqa.

MASHG'ULOT YOZUVI:
${transcript}

Faqat talaba ("TAHLILCHI" deb belgilangan) xabarlarini bahola. Raqamlar to'g'ri hisoblanganini tekshir. Fikr-mulohazani o'zbek tilida, "siz" deb yoz, yozuvdan aniq misollar keltir. Talaba juda kam yozgan bo'lsa, ballar past bo'lsin.
"standard" maydonida talabaning tahlili fan dasturidagi ta'lim natijalariga (ko'rsatkichlarni hisoblash, omillarni aniqlash, asosli boshqaruv qarori taklif qilish) qanchalik mos kelganini 2–4 jumlada baholang.`;
}

export const EVALUATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    scores: {
      type: "object",
      additionalProperties: false,
      properties: Object.fromEntries(CRITERIA.map((c) => [c.key, { type: "integer" }])),
      required: CRITERIA.map((c) => c.key),
    },
    summary: { type: "string" },
    standard: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    improvements: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
  },
  required: ["scores", "summary", "standard", "strengths", "improvements", "recommendations"],
};

export function hintPrompt(s) {
  return `Sen tajribali moliyaviy tahlilchi-ustozsan. Talaba "Tahlilchi trenajyori"da quyidagi vaziyatda mashq qilmoqda va maslahat so'radi.

VAZIYAT: ${s.title} — ${s.brief}
Raqamlar:
${factsText(s)}
Talaba roli: ${s.role}
Maqsadlar: ${s.objectives.join("; ")}

Suhbatning hozirgi holatiga qarab, talabaga keyingi qadam uchun BITTA aniq maslahat ber (2–3 jumla, o'zbek tilida): qaysi ko'rsatkichni hisoblash yoki qaysi dalilni keltirish kerak. Tayyor javobni yozib berma. Markdownsiz yoz.`;
}
