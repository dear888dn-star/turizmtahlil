// Platformaning pedagogik qatlami (10–18-mavzular). Tuzilishi layer-a.js bilan bir xil.

const Q = (q, options, c) => ({ q, options, c });
const G = (term, def) => ({ term, def });

export const LAYER_B = {
  10: {
    icon: "🧾",
    title: "Debitorlik va kreditorlik qarzlari tahlili",
    glossary: [
      G("Debitorlik qarzi", "Boshqa shaxslarning korxonaga to'lashi lozim bo'lgan qarzlari: xaridorlar, hisobdor shaxslar, berilgan avanslar."),
      G("Kreditorlik qarzi", "Korxonaning boshqa shaxslarga to'lashi lozim bo'lgan qarzlari: yetkazib beruvchilar, ish haqi, soliqlar, olingan avanslar."),
      G("Normal qarz", "Shartnoma muddati o'tmagan, odatiy hisob-kitob jarayonida yuzaga kelgan qarz."),
      G("Muddati o'tgan qarz", "To'lov muddati o'tib ketgan, undirilishi noaniq bo'lgan qarz; likvidlikni pasaytiradi."),
      G("Immobilizatsiya", "Mablag'larning debitorlik qarzlariga “muzlab” qolishi: Debitorlik / Aktivlar (yoki / Aylanma aktivlar)."),
      G("Debitorlik aylanish davri", "Xaridorlar o'rtacha necha kunda to'lashini ko'rsatadi: 360 / (Tushum / Debitorlik o'rtacha)."),
      G("Kredit siyosati", "Mijozlarga to'lov muddati, chegirmalar va undirish tartibini belgilovchi ichki qoidalar."),
    ],
    methods: [
      { type: "venn", id: "t10-venn", title: "Debitorlik yoki kreditorlik?", instruction: "Moddani to'g'ri guruhga joylashtiring.", a: "Debitorlik", b: "Kreditorlik", items: [["Turagentdan olinadigan pul (xaridor qarzi)", "a"], ["Mehmonxonaga to'lanmagan summa", "b"], ["Hisobdor shaxs qarzi", "a"], ["Xodimlarga ish haqi qarzi", "b"], ["Byudjetga soliq qarzi", "b"], ["Muddati o'tgan qismi likvidlikni pasaytiradi", "both"], ["Aylanish davri kunlarda hisoblanadi", "both"]] },
      { type: "case", id: "t10-case", title: "Keys: “Zomin Eco Tour” debitorlari", instruction: "Vaziyatni o'qing va yechim taklif qiling.", text: "“Zomin Eco Tour” korporativ mijozlarga 60 kunlik kechiktirilgan to'lov bilan turlar sotadi. Debitorlik 4 200 mln so'm (30% i muddati o'tgan), kreditorlik 5 000 mln so'm. Mehmonxonalar 15 kun ichida to'lovni talab qilmoqda.", questions: ["Qarzlar nisbatini va xavfni baholang.", "Muddati o'tgan qarzni qanday kamaytirasiz?", "Yangi kredit siyosatining 3 ta asosiy bandi qanday bo'ladi?"], model: "Kreditorlik/debitorlik = 1,19; mijozlardan pul 60 kunda, hamkorlarga to'lov 15 kunda — pul oqimida uzilish. Choralar: qarzlarni muddat bo'yicha inventarizatsiya, da'vo xatlari, muddatidan oldin to'lov uchun 2–3% chegirma, 30–50% oldindan to'lov, yangi mijozlarga limit, shubhali qarzlar rezervi, faktoring." },
    ],
    tests: [
      Q("Debitorlik qarzi nima?", ["Korxonaning boshqalarga qarzi", "Boshqalarning korxonaga qarzi", "Ustav kapitali", "Bank krediti"], 1),
      Q("Debitorlik 4 200, muddati o'tgani 1 260 mln. Ulushi?", ["30%", "33%", "70%", "3,3%"], 0),
      Q("Kreditorlik/debitorlik nisbati 1 dan katta bo'lsa…", ["Firma oladiganidan ko'proq qarzdor", "Firma moliyaviy mustaqil", "Debitorlik ortiqcha", "Hech qanday ma'no yo'q"], 0),
      Q("Debitorlik 4 200, jami aktivlar 15 000. Sarmoya immobilizatsiyasi?", ["0,28", "0,525", "3,57", "28"], 0),
      Q("Tushum 25 200, o'rtacha debitorlik 4 200 mln. Aylanish davri (360 kun)?", ["6 kun", "60 kun", "36 kun", "600 kun"], 1),
      Q("Debitorlikni kamaytirishning samarali chorasi qaysi?", ["To'lov muddatini uzaytirish", "Oldindan to'lov va muddatidan oldin to'lovga chegirma", "Shartnomasiz ishlash", "Kreditorlikni oshirish"], 1),
    ],
    selfStudy: [
      { id: "t10-s1", title: "Kredit siyosati", type: "Amaliy ish", description: "Debitorlik qarzini kamaytirish bo'yicha turistik firma uchun 7 bandli kredit siyosatini ishlab chiqing (limitlar, muddatlar, chegirmalar, undirish bosqichlari, rezervlar)." },
    ],
    resources: [],
  },
  11: {
    icon: "💸",
    title: "Pul oqimlarini baholash va tahlil qilish",
    glossary: [
      G("Pul oqimi", "Davr davomida pul mablag'lari va ularning ekvivalentlarining kirimi va chiqimi."),
      G("Operatsion faoliyat", "Asosiy daromad keltiruvchi faoliyat: turistlardan to'lov, hamkorlarga to'lov, ish haqi, soliqlar."),
      G("Investitsion faoliyat", "Uzoq muddatli aktivlarni sotib olish va sotish: avtobus, dasturiy ta'minot, mehmonxona jihozlari."),
      G("Moliyaviy faoliyat", "Kapital va qarz bilan bog'liq oqimlar: kredit olish va qaytarish, dividendlar, ta'sischi badallari."),
      G("Sof pul oqimi", "Kirim va chiqim o'rtasidagi farq; faoliyat turlari bo'yicha va jami hisoblanadi."),
      G("To'g'ri va bilvosita usul", "To'g'ri usul — real kirim-chiqimlar bo'yicha; bilvosita usul — sof foydani nopul moddalar va aylanma kapital o'zgarishiga tuzatish orqali."),
    ],
    methods: [
      { type: "matching", id: "t11-match", title: "Operatsiya qaysi oqimga tegishli?", instruction: "Operatsiyani pul oqimi turi bilan moslang.", pairs: [["Turistlardan tur uchun to'lov", "Operatsion — kirim"], ["Mehmonxonaga joylashtirish uchun to'lov", "Operatsion — chiqim"], ["Yangi turistik avtobus sotib olish", "Investitsion — chiqim"], ["Bank kreditini olish", "Moliyaviy — kirim"], ["Kreditni qaytarish", "Moliyaviy — chiqim"], ["Eski avtobusni sotish", "Investitsion — kirim"]] },
      { type: "tchart", id: "t11-tchart", title: "T-jadval: foyda va pul", instruction: "Nega korxonada foyda bor-u, pul yetishmasligi mumkin? Foydani oshiruvchi, lekin pulni kamaytiruvchi va aksincha holatlarni yozing.", left: "Foyda bor, pul yo'q holatlari", right: "Pul bor, foyda yo'q holatlari" },
    ],
    tests: [
      Q("Yangi avtobus sotib olish qaysi faoliyatga tegishli?", ["Operatsion", "Investitsion", "Moliyaviy", "Hech biriga"], 1),
      Q("Bank kreditini olish qaysi oqim?", ["Operatsion kirim", "Investitsion kirim", "Moliyaviy kirim", "Moliyaviy chiqim"], 2),
      Q("Operatsion +200, investitsion −250, moliyaviy +220 mln. Jami sof pul oqimi?", ["+170", "+670", "−30", "+420"], 0),
      Q("Pul oqimi koeffitsiyenti (kirim/chiqim) 1 dan kichik bo'lsa…", ["Chiqim kirimdan ko'p — pul qoldig'i kamayadi", "Korxona juda foydali", "Investitsiya yo'q", "Ahamiyatsiz"], 0),
      Q("MHXS (IAS 7) bo'yicha pul oqimlari nechta guruhga bo'linadi?", ["2", "3", "4", "5"], 1),
      Q("Sof sotish 1 200, real pul tushumi 1 050 mln. Tushish koeffitsiyenti?", ["0,875", "1,14", "150", "0,125"], 0),
    ],
    selfStudy: [
      { id: "t11-s1", title: "Oylik pul oqimi budjeti", type: "Amaliy ish", description: "Bir oylik turistik firma pul oqimi budjetini Excel'da tuzing: boshlang'ich qoldiq, kirimlar, chiqimlar (faoliyat turlari bo'yicha), sof oqim va oxirgi qoldiq. Mavsumiylikni hisobga oling." },
    ],
    resources: [],
  },
  12: {
    icon: "💧",
    title: "Moliyaviy holat va likvidlik tahlili",
    glossary: [
      G("Likvidlik", "Aktivlarning tez va yo'qotishsiz pulga aylanish qobiliyati; balans likvidligi — aktivlar majburiyatlarni muddatiga mos qoplay olishi."),
      G("To'lov qobiliyati", "Korxonaning majburiyatlarini o'z vaqtida va to'liq bajara olish qobiliyati."),
      G("Joriy likvidlik (qoplash) koeffitsiyenti", "Joriy aktivlar / Joriy majburiyatlar; tavsiya etilgan daraja 1,5–2 va undan yuqori."),
      G("Tez likvidlik koeffitsiyenti", "(Pul + Qisqa muddatli qo'yilmalar + Undiriladigan debitorlik) / Joriy majburiyatlar; ≈ 0,7–1."),
      G("Absolyut likvidlik koeffitsiyenti", "(Pul + Qisqa muddatli qo'yilmalar) / Joriy majburiyatlar; ≈ 0,2–0,25."),
      G("Avtonomiya koeffitsiyenti", "Xususiy kapital / Balans jami; ≥ 0,5 moliyaviy mustaqillikni bildiradi."),
      G("Mutlaq likvid balans", "A1 ≥ P1, A2 ≥ P2, A3 ≥ P3, A4 ≤ P4 shartlari bajarilgan balans."),
    ],
    methods: [
      { type: "matching", id: "t12-match", title: "Koeffitsiyent va me'yor", instruction: "Koeffitsiyentni tavsiya etilgan daraja bilan moslang.", pairs: [["Joriy likvidlik", "1,5–2 va undan yuqori"], ["Tez likvidlik", "≈ 0,7–1"], ["Absolyut likvidlik", "≈ 0,2–0,25"], ["Avtonomiya koeffitsiyenti", "≥ 0,5"], ["O'z aylanma mablag'lari bilan ta'minlanganlik", "≥ 0,1"]] },
      { type: "case", id: "t12-case", title: "Keys: mavsum oldidan likvidlik", instruction: "Vaziyatni tahlil qiling.", text: "Samarqanddagi “Registan Plaza” mehmonxonasida aprel boshida: pul 500 mln, debitorlik 1 500 mln (300 mln muddati o'tgan), zaxiralar 4 000 mln, joriy majburiyatlar 2 800 mln so'm. Bank yangi kredit uchun likvidlik ko'rsatkichlarini so'ramoqda.", questions: ["Joriy, tez va absolyut likvidlikni hisoblang.", "Bank uchun qaysi ko'rsatkich eng zaif?", "Likvidlikni oshirish uchun 3 ta chora taklif qiling."], model: "Joriy = 6 000 / 2 800 = 2,14 (yaxshi); tez = 1 700 / 2 800 = 0,61 (past); absolyut = 0,18 (biroz past). Joriy aktivlarning katta qismi zaxiralarda. Choralar: muddati o'tgan debitorlikni undirish, ortiqcha zaxiralarni qisqartirish, korporativ mijozlardan avans, qisqa muddatli qarzni uzoq muddatliga refinanslash." },
    ],
    tests: [
      Q("Joriy aktivlar 6 000, joriy majburiyatlar 2 800 mln. Qoplash koeffitsiyenti?", ["0,47", "2,14", "3 200", "1,14"], 1),
      Q("Tez likvidlikda nima uchun muddati o'tgan debitorlik chiqariladi?", ["Undirilishi noaniq bo'lgani uchun", "U pulga teng bo'lgani uchun", "Soliq talabi", "Hisob osonlashishi uchun"], 0),
      Q("Absolyut likvidlik formulasi?", ["Joriy aktivlar / Joriy majburiyatlar", "Pul va qisqa muddatli qo'yilmalar / Joriy majburiyatlar", "Zaxiralar / Aktivlar", "Foyda / Tushum"], 1),
      Q("Mutlaq likvid balans uchun qaysi shart noto'g'ri?", ["A1 ≥ P1", "A2 ≥ P2", "A3 ≥ P3", "A4 ≥ P4"], 3),
      Q("Likvidlik va to'lov qobiliyati farqi nimada?", ["Ular bir xil", "Likvidlik — aktivlarning pulga aylanishi, to'lov qobiliyati — majburiyatlarni o'z vaqtida bajarish", "Likvidlik faqat banklarga tegishli", "To'lov qobiliyati faqat soliqqa tegishli"], 1),
      Q("Avtonomiya koeffitsiyenti 0,6 bo'lsa…", ["Aktivlarning 60% i xususiy kapital hisobidan — mustaqillik yetarli", "Korxona bankrot", "Qarz 60%", "Likvidlik 60%"], 0),
    ],
    selfStudy: [
      { id: "t12-s1", title: "Likvidlik risklari xaritasi", type: "Amaliy ish", description: "Bir turistik korxona uchun 5 ta likvidlik riskini (mavsumiylik, valyuta, debitorlar, kredit, avans qaytarish) va har biriga bittadan boshqaruv chorasini yozing." },
    ],
    resources: [],
  },
  13: {
    icon: "📊",
    title: "Moliyaviy natijalar tahlili",
    glossary: [
      G("Sof tushum", "Sotishdan tushgan pul tushumidan QQS va aksizlar chegirilgan summa."),
      G("Yalpi foyda", "Sof tushum − Sotilgan xizmatlar tannarxi."),
      G("Davr xarajatlari", "Sotish, ma'muriy va boshqa operatsion xarajatlar; yalpi foydadan chegiriladi."),
      G("Asosiy faoliyat foydasi", "Yalpi foyda − Davr xarajatlari + Boshqa operatsion daromadlar."),
      G("Soliq to'lagunga qadar foyda", "Asosiy faoliyat foydasi ± Moliyaviy faoliyat natijasi (foizlar, dividendlar, kurs farqi)."),
      G("Sof foyda", "Soliq to'lagunga qadar foyda − Foyda solig'i (2026-yilda 15%)."),
      G("Yalpi marja", "Yalpi foydaning sof tushumdagi ulushi (%); narx va tannarx nisbatining sifat ko'rsatkichi."),
    ],
    methods: [
      { type: "ordering", id: "t13-order", title: "Moliyaviy natijalar zinapoyasi", instruction: "Moliyaviy natijalar shakllanishini to'g'ri ketma-ketlikda joylashtiring.", items: ["Sotishdan tushgan tushum", "Sof tushum (QQS chegirilgan)", "Yalpi foyda (− tannarx)", "Asosiy faoliyat foydasi (− davr xarajatlari)", "Soliq to'lagunga qadar foyda (± moliyaviy faoliyat)", "Sof foyda (− foyda solig'i)"] },
      { type: "insert", id: "t13-insert", title: "INSERT: foyda sifati", instruction: "Har bir fikrni belgilang: ✓, +, −, ?", sentences: ["Sof foydaning o'sishi har doim ham samaradorlik oshganini bildirmaydi.", "Tannarx tushumdan sekin o'ssa, yalpi marja yaxshilanadi.", "Valyuta kursi farqidan olingan foyda asosiy faoliyat natijasi hisoblanadi.", "MHXS bo'yicha favqulodda moddalar alohida ko'rsatilmaydi.", "2026-yilda O'zbekistonda foyda solig'ining asosiy stavkasi 15%."] },
    ],
    tests: [
      Q("Yalpi foyda qanday aniqlanadi?", ["Sof tushum − Tannarx", "Tushum − Soliqlar", "Sof foyda + Soliq", "Aktivlar − Majburiyatlar"], 0),
      Q("Sof tushum 7 500, tannarx 6 100 mln. Yalpi foyda?", ["13 600", "1 400", "1 000", "6 100"], 1),
      Q("Yalpi foyda 1 400, sotish xarajatlari 280, ma'muriy 210, boshqa daromad 90. Asosiy faoliyat foydasi?", ["1 000", "910", "1 190", "820"], 0),
      Q("2026-yilda foyda solig'ining asosiy stavkasi?", ["12%", "15%", "20%", "7,5%"], 1),
      Q("Moliyaviy natijalarni tahlil qilishning asosiy manbai?", ["Kadrlar hisoboti", "Moliyaviy natijalar to'g'risidagi hisobot", "Statistik byulleten", "Bank ko'chirmasi"], 1),
      Q("Tushum 124% ga, tannarx 119,5% ga o'sdi. Yalpi marja…", ["Yaxshilangan", "Yomonlashgan", "O'zgarmagan", "Aniqlab bo'lmaydi"], 0),
    ],
    selfStudy: [
      { id: "t13-s1", title: "Moliyaviy natijalar blok-sxemasi", type: "Ijodiy ish", description: "“Tushum → sof tushum → yalpi foyda → asosiy faoliyat → soliqdan oldin → sof foyda” ko'rinishidagi blok-sxemani real yoki shartli raqamlar bilan tayyorlang (Canva, PowerPoint)." },
    ],
    resources: [{ title: "Soliq kodeksi — lex.uz", url: "https://lex.uz/docs/4674893" }],
  },
  14: {
    icon: "💰",
    title: "Foyda ko'rsatkichlari va omilli tahlil",
    glossary: [
      G("Foyda", "Daromadlarning xarajatlardan ortig'i; tadbirkorlik faoliyatining yakuniy moliyaviy natijasi."),
      G("Yalpi daromad", "Yaratilgan mahsulot qiymatidan sarflangan ishlab chiqarish vositalari qiymati chegirilgan qism: YD = M − c = v + m."),
      G("Foydaning baholash funksiyasi", "Foyda korxona faoliyati samaradorligini baholovchi umumlashtiruvchi ko'rsatkich sifatida xizmat qiladi."),
      G("Foydaning taqsimlash funksiyasi", "Foyda mulkdor, xodimlar, investorlar va davlat (soliqlar) o'rtasida taqsimlanadi."),
      G("Birlamchi omillar", "Foydaga bevosita ta'sir qiluvchi omillar: sof tushum hajmi va rentabellik darajasi."),
      G("Ikkilamchi omillar", "Birlamchi omillarni shakllantiruvchi omillar: turistik guruhlar soni, turistlar soni, narx, tarkib va h.k."),
    ],
    methods: [
      { type: "matching", id: "t14-match", title: "Foyda funksiyalari", instruction: "Funksiyani turistik firmadagi misol bilan moslang.", pairs: [["Baholash funksiyasi", "Ikki filialning samaradorligini foyda bo'yicha solishtirish"], ["Taqsimlash funksiyasi", "Sof foydadan dividend va rivojlanish fondiga ajratish"], ["Nazorat funksiyasi", "Mulkdor menejerlar ishini foyda dinamikasi orqali kuzatadi"], ["Rag'batlantirish funksiyasi", "Reja ortig'i bajarilganda xodimlarga mukofot"]] },
      { type: "brainstorm", id: "t14-bs", title: "Aqliy hujum: foydani oshirish rezervlari", instruction: "Turistik firma foydasini oshirishning ichki rezervlarini “sotish, narx, xarajat, turistlar tarkibi, resurs samaradorligi” bo'yicha yozing.", minIdeas: 8, examples: ["Yuqori marjali mualliflik turlari", "Dinamik narxlash", "To'g'ridan-to'g'ri bron (komissiyasiz)", "Mehmonxonalar bilan yillik kontrakt", "Guruhlar to'liqligini oshirish", "Qo'shimcha xizmatlar (ekskursiya, transfer)", "Mavsumdan tashqari takliflar", "Raqamli marketing samaradorligi"] },
    ],
    tests: [
      Q("YD = M − c formulasida “c” nima?", ["Ish haqi", "Sarflangan ishlab chiqarish vositalari qiymati", "Qo'shimcha mahsulot", "Soliq"], 1),
      Q("Yalpi mahsulot 2 000, c = 1 300 mln. Yalpi daromad?", ["3 300", "700", "1 300", "0,65"], 1),
      Q("Foyda funksiyalariga nima kirmaydi?", ["Baholash", "Taqsimlash", "Rag'batlantirish", "Inventarizatsiya"], 3),
      Q("Foydaning birlamchi omillari qaysi?", ["Sof tushum va rentabellik", "Turistlar soni va narx", "Ish haqi va soliq", "Aktivlar va passivlar"], 0),
      Q("Sof tushum 28% ga, foyda 35% ga o'sdi. Sof tushumning foyda o'sishidagi ulushi?", ["28%", "80%", "35%", "20%"], 1),
      Q("Ikkilamchi omillar tahlilida qaysi usul qo'llanadi?", ["Zanjirli almashtirish", "Inventarizatsiya", "Audit", "Kassa tekshiruvi"], 0),
    ],
    selfStudy: [
      { id: "t14-s1", title: "Foyda rezervlari xaritasi", type: "Amaliy ish", description: "Foydani oshirishning ichki omillarini “sotish”, “narx”, “xarajat”, “turistlar tarkibi”, “resurs samaradorligi” guruhlari bo'yicha tizimlashtiring va har biriga o'lchanadigan ko'rsatkich bering." },
    ],
    resources: [],
  },
  15: {
    icon: "📈",
    title: "Rentabellik ko'rsatkichlari tahlili",
    glossary: [
      G("Rentabellik", "Foydaning resurs, xarajat yoki tushumga nisbati (%); samaradorlikning nisbiy ko'rsatkichi."),
      G("Faoliyat rentabelligi", "Foyda / Xizmatlar tannarxi × 100."),
      G("Sotish rentabelligi (ROS)", "Foyda / Sof tushum × 100; har 100 so'm tushumdagi foyda."),
      G("Aktivlar rentabelligi (ROA)", "Sof foyda / Aktivlar o'rtacha qiymati × 100."),
      G("O'z kapitali rentabelligi (ROE)", "Sof foyda / O'z kapitali o'rtacha qiymati × 100; mulkdor uchun eng muhim ko'rsatkich."),
      G("DuPont modeli", "ROE = ROS × Aktivlar aylanishi × Moliyaviy leverej; rentabellik o'zgarishi sabablarini ajratadi."),
      G("RevPAR", "Mehmonxonada mavjud har bir xonaga tushum: ADR × bandlik darajasi; mehmonxona samaradorligining xalqaro ko'rsatkichi."),
    ],
    methods: [
      { type: "matching", id: "t15-match", title: "Rentabellik turlari", instruction: "Ko'rsatkichni formulasi bilan moslang.", pairs: [["Faoliyat rentabelligi", "Foyda / Tannarx × 100"], ["Sotish rentabelligi (ROS)", "Foyda / Sof tushum × 100"], ["Aktivlar rentabelligi (ROA)", "Sof foyda / Aktivlar × 100"], ["O'z kapitali rentabelligi (ROE)", "Sof foyda / O'z kapitali × 100"], ["Aktivlar aylanishi", "Sof tushum / Aktivlar"]] },
      { type: "fsmu", id: "t15-fsmu", title: "FSMU: ROE va qarz", instruction: "Quyidagi fikr bo'yicha FSMU texnikasini bajaring.", statement: "Qarz olish o'z kapitali rentabelligini (ROE) oshiradi, shuning uchun turistik firma imkon qadar ko'proq qarz olishi kerak." },
    ],
    tests: [
      Q("Sof foyda 72, tannarx 900 mln. Faoliyat rentabelligi?", ["8%", "12,5%", "80%", "0,8%"], 0),
      Q("Sof foyda 180, sof tushum 2 400. ROS?", ["7,5%", "6%", "12%", "13,3%"], 0),
      Q("Sof foyda 180, aktivlar 3 000. ROA?", ["7,5%", "6%", "12%", "60%"], 1),
      Q("DuPont modeliga ko'ra ROE = ?", ["ROS × Aktivlar aylanishi × Moliyaviy leverej", "ROA + ROS", "Foyda − Soliq", "Tushum / Xodimlar"], 0),
      Q("ROE > ROA bo'lishi nimani anglatadi?", ["Korxona qarz kapitalidan foydalanadi (leverej)", "Korxona zararda", "Aktivlar kamaygan", "Soliq oshgan"], 0),
      Q("Mehmonxonaning RevPAR ko'rsatkichi qanday hisoblanadi?", ["ADR × bandlik darajasi", "Xonalar soni × xodimlar", "Foyda / Aktivlar", "Tushum − Tannarx"], 0),
    ],
    selfStudy: [
      { id: "t15-s1", title: "Rentabellik paneli", type: "Raqamli ish", description: "Turistik firma uchun 5 ta rentabellik ko'rsatkichidan iborat boshqaruv panelini (Excel / Google Sheets) tuzing: formula, joriy qiymat, maqsadli trend (oshish / barqaror / nazorat)." },
    ],
    resources: [],
  },
  16: {
    icon: "🎯",
    title: "Zararsizlik (foydalilik) nuqtasi tahlili",
    glossary: [
      G("Zararsizlik nuqtasi", "Tushum barcha xarajatlarni qoplaydigan va foyda nolga teng bo'lgan sotish hajmi (break-even point)."),
      G("Doimiy xarajatlar", "Sotish hajmiga bog'liq bo'lmagan xarajatlar: ijara, ma'muriy xodimlar ish haqi, amortizatsiya, reklama."),
      G("O'zgaruvchan xarajatlar", "Sotish hajmiga mutanosib o'zgaradigan xarajatlar: mehmonxona, transport, ovqatlanish, gid xizmati (har bir turist uchun)."),
      G("Marjinal daromad", "Tushum − O'zgaruvchan xarajatlar; doimiy xarajatlar va foydani qoplash manbai."),
      G("Xavfsizlik zaxirasi", "Haqiqiy tushumning zararsizlik tushumidan ortig'i (%): sotish qanchaga kamaysa ham zarar bo'lmasligi."),
      G("Maqsadli foyda hajmi", "Rejalashtirilgan foydaga erishish uchun zarur sotish hajmi: (Doimiy xarajat + Maqsadli foyda) / Bir birlik marjinal daromad."),
    ],
    methods: [
      { type: "venn", id: "t16-venn", title: "Doimiy yoki o'zgaruvchan xarajat?", instruction: "Turistik firma xarajatini tegishli guruhga joylashtiring.", a: "Doimiy", b: "O'zgaruvchan", items: [["Ofis ijarasi", "a"], ["Har bir turist uchun mehmonxona to'lovi", "b"], ["Buxgalter oyligi", "a"], ["Aviachipta (turpaket tarkibida)", "b"], ["Sayt va CRM obunasi", "a"], ["Muzey kirish chiptalari", "b"], ["Zararsizlik nuqtasini hisoblashda qatnashadi", "both"]] },
      { type: "case", id: "t16-case", title: "Keys: “Ipak yo'li” turpaketi", instruction: "Hisoblang va qaror qabul qiling.", text: "Turpaket narxi 3 000 000 so'm, bir turistga o'zgaruvchan xarajat 2 100 000 so'm, mavsumiy doimiy xarajat 90 mln so'm. Marketing bo'limi narxni 10% pasaytirib, sotuvni 30% oshirishni taklif qilmoqda (rejada 160 turist).", questions: ["Hozirgi zararsizlik nuqtasi va 160 turistdagi foyda qancha?", "Narx pasaytirilsa zararsizlik nuqtasi va foyda qanday o'zgaradi?", "Taklifni qabul qilasizmi?"], model: "Hozir: Md = 0,9 mln → Zn = 100 turist; 160 turistda F = 160 × 0,9 − 90 = 54 mln. Taklif: narx 2,7 mln, Md = 0,6 mln → Zn = 150 turist; 208 turistda F = 208 × 0,6 − 90 = 34,8 mln. Foyda kamayadi va xavfsizlik zaxirasi 37,5% dan 28% ga tushadi — taklif foydasiz, faqat mavsumdan tashqari bo'sh o'rinlar uchun qo'llash mumkin." },
    ],
    tests: [
      Q("Zararsizlik nuqtasida foyda qancha?", ["Maksimal", "Nolga teng", "Manfiy", "Marjinal daromadga teng"], 1),
      Q("Marjinal daromad = ?", ["Tushum − Doimiy xarajat", "Tushum − O'zgaruvchan xarajat", "Foyda − Soliq", "Tushum − Barcha xarajatlar"], 1),
      Q("Narx 3,0 mln, o'zgaruvchan xarajat 2,1 mln, doimiy 90 mln. Zararsizlik nuqtasi?", ["30 turist", "100 turist", "43 turist", "150 turist"], 1),
      Q("Qaysi xarajat o'zgaruvchan?", ["Ofis ijarasi", "Har bir turist uchun mehmonxona to'lovi", "Direktor oyligi", "Amortizatsiya"], 1),
      Q("Narx pasaysa (boshqa shartlar o'zgarmasa) zararsizlik nuqtasi…", ["Kamayadi", "Oshadi", "O'zgarmaydi", "Nolga tushadi"], 1),
      Q("Xavfsizlik zaxirasi nimani bildiradi?", ["Sotish qanchaga kamaysa ham zarar bo'lmasligini", "Bankdagi rezerv pulni", "Soliq imtiyozini", "Sug'urta summasini"], 0),
    ],
    selfStudy: [
      { id: "t16-s1", title: "Narx ssenariylari", type: "Amaliy ish", description: "Bir turistik xizmat uchun narx −10%, 0%, +10% bo'lgan uch ssenariyda zararsizlik nuqtasi, foyda va xavfsizlik zaxirasini Excel'da hisoblang va grafik chizing." },
    ],
    resources: [],
  },
  17: {
    icon: "🏛️",
    title: "Xarajatlar va chetdan jalb qilingan mablag'lar ko'rsatkichlari",
    glossary: [
      G("Moliyaviy salohiyat", "Korxonaning o'z va jalb qilingan moliyaviy resurslari hajmi va tarkibi bilan belgilanadigan imkoniyati."),
      G("Xarajatlar tarkibi", "Xarajatlarning moddalar (tannarx, sotish, ma'muriy, moliyaviy) bo'yicha taqsimoti va ularning ulushi."),
      G("Xarajatlar darajasi", "Xarajatlarning sof tushumga nisbati (%); 1 so'm tushumga qancha xarajat to'g'ri kelishini ko'rsatadi."),
      G("Qarz kapitali narxi", "Qarz uchun to'lanadigan foiz stavkasi; foiz xarajatlari foyda solig'i bazasini kamaytirgani uchun samarali stavka = stavka × (1 − foyda solig'i)."),
      G("Kreditorlikning tarkibiy koeffitsiyenti", "Kreditorlik qarzining jami jalb qilingan mablag'lardagi ulushi."),
      G("Turistik soliq", "Joylashtirish vositalarida har bir sutka uchun undiriladigan mahalliy soliq; 2026-yil 1-sentyabrdan xorijliklar uchun BHMning 15% i."),
    ],
    methods: [
      { type: "cluster", id: "t17-cluster", title: "Klaster: turistik firma xarajatlari", instruction: "Turistik firma xarajatlarini guruhlab klaster tuzing.", center: "Turistik firma xarajatlari", sample: ["Turpaket tannarxi (mehmonxona, transport, ovqat, gid)", "Sotish xarajatlari (reklama, OTA komissiyasi)", "Ma'muriy xarajatlar (ofis, xodimlar)", "Moliyaviy xarajatlar (kredit foizlari, kurs farqi)", "Soliqlar va yig'imlar (turistik soliq)", "Raqamli xarajatlar (CRM, sayt, bron tizimi)"] },
      { type: "insert", id: "t17-insert", title: "INSERT: kitobdagi tahririy nomuvofiqlik", instruction: "Har bir fikrni belgilang: ✓, +, −, ?", sentences: ["Kitob mundarijasida XVII bob “xarajatlar” deb nomlangan.", "17.1–17.2-paragraflar mazmuni IX bobdagi chetdan jalb qilingan mablag'lar mavzusini takrorlaydi.", "Shuning uchun platformada xarajatlar tahlili 13-, 16- va 18-mavzular bilan to'ldiriladi.", "Qarz foizlari foyda solig'i bazasini kamaytiradi.", "Turistik soliq korxonaning o'z daromadi hisoblanadi."] },
    ],
    tests: [
      Q("Balans 9 700, jami jalb qilingan mablag' 5 200 mln. Umumiy to'planish koeffitsiyenti?", ["0,536", "1,87", "0,278", "0,088"], 0),
      Q("Xarajatlar darajasi qanday hisoblanadi?", ["Xarajatlar / Sof tushum × 100", "Foyda / Xarajat", "Xarajat − Tushum", "Aktivlar / Xarajatlar"], 0),
      Q("Kredit stavkasi 18%, foyda solig'i 15%. Soliqdan keyingi samarali stavka?", ["18%", "15,3%", "3%", "33%"], 1),
      Q("Jami majburiyat 5 200, uzoq muddatli 2 700, aylanma aktivlar 6 000. Aylanma aktivlardagi tashqi mablag' ulushi?", ["0,417", "0,866", "0,45", "0,73"], 0),
      Q("2026-yil 1-sentyabrdan xorijiy fuqarolar uchun turistik soliq bir sutka uchun qancha?", ["BHMning 15% i (66 000 so'm)", "BHMning 1% i", "1 760 so'm", "Undirilmaydi"], 0),
      Q("Kitobdagi XVII bob paragraflari amalda qaysi mavzuni yoritadi?", ["Chetdan jalb qilingan mablag'lar ko'rsatkichlarini", "Pul oqimlarini", "Nomoddiy aktivlarni", "Mehnat unumdorligini"], 0),
    ],
    selfStudy: [
      { id: "t17-s1", title: "Kreditorlikni muddat bo'yicha guruhlash", type: "Amaliy ish", description: "Kreditorlik qarzlarini muddat bo'yicha guruhlang (1 oygacha, 1–2 oy, 2–3 oy, 3 oy–1 yil, 1 yildan ortiq), har bir guruh uchun risk darajasini va to'lov rejasini belgilang." },
      { id: "t17-s2", title: "Turpaket xarajatlari kalkulyatsiyasi", type: "Amaliy ish", description: "5 kunlik “Samarqand–Buxoro” turpaketi uchun xarajatlar kalkulyatsiyasini tuzing: o'zgaruvchan va doimiy xarajatlar, 2026-yilgi turistik soliq, QQS (yoki soddalashtirilgan 6% rejim) va narx." },
    ],
    resources: [{ title: "Markaziy bank asosiy stavkasi — cbu.uz", url: "https://cbu.uz" }],
  },
  18: {
    icon: "👥",
    title: "Ish haqi xarajatlari va mehnat unumdorligi tahlili",
    glossary: [
      G("Ish haqi fondi", "Hisobot davrida xodimlarga hisoblangan barcha mehnatga haq to'lovlari yig'indisi."),
      G("Mehnat unumdorligi", "Bir xodimga (yoki bir ishchiga, bir soatga) to'g'ri keladigan xizmat hajmi."),
      G("Qo'nimsizlik koeffitsiyenti", "O'z xohishi bilan va intizom buzilishi sababli ketgan xodimlar sonining o'rtacha xodimlar soniga nisbati."),
      G("Ish vaqti fondi (IVF)", "Ishchilar soni × ishlangan kunlar × ish kuni davomiyligi (soat)."),
      G("Mehnatga haq to'lashning eng kam miqdori", "2026-yil 1-sentyabrdan oyiga 1 360 000 so'm (PF-115, 23.06.2026)."),
      G("Bazaviy hisoblash miqdori (BHM)", "Soliq, yig'im va jarimalarni hisoblash uchun asos; 2026-yil 1-sentyabrdan 440 000 so'm."),
    ],
    methods: [
      { type: "matching", id: "t18-match", title: "Mehnat ko'rsatkichlari", instruction: "Ko'rsatkichni formulasi bilan moslang.", pairs: [["Kadrlar bilan ta'minlanish", "Haqiqiy xodimlar / Reja × 100"], ["Qo'nimsizlik koeffitsiyenti", "(O'z xohishi + intizom bo'yicha ketganlar) / O'rtacha xodimlar"], ["Ish vaqti fondi", "Ishchilar × Kunlar × Soat"], ["Bir xodim unumdorligi", "Xizmat hajmi / Xodimlar soni"], ["Ish haqi darajasi", "Ish haqi fondi / Tushum × 100"]] },
      { type: "tchart", id: "t18-tchart", title: "T-jadval: unumdorlik va ish haqi", instruction: "Mehnat unumdorligi o'sishi ish haqi o'sishidan tez bo'lsa va aksincha bo'lsa, korxona uchun oqibatlarini yozing.", left: "Unumdorlik ish haqidan tez o'ssa", right: "Ish haqi unumdorlikdan tez o'ssa" },
    ],
    tests: [
      Q("Reja 820, haqiqat 814 xodim. Ta'minlanish?", ["99,27%", "100,7%", "0,73%", "6"], 0),
      Q("O'rtacha 400 xodim, o'z xohishi bilan 12, intizom bo'yicha 8 kishi ketgan. Qo'nimsizlik?", ["3%", "5%", "2%", "20%"], 1),
      Q("120 ishchi × 250 kun × 8 soat. Ish vaqti fondi?", ["240 000 soat", "30 000 soat", "2 400 soat", "378 soat"], 0),
      Q("Xizmat hajmi 18 000 mln, 60 xodim. Bir xodim unumdorligi?", ["300 mln", "3 000 mln", "30 mln", "1 080 mln"], 0),
      Q("Bir xodim unumdorligiga ta'sir qiluvchi ikki asosiy omil?", ["Ishchilar ulushi va bir ishchi unumdorligi", "Soliq va kredit", "Aktivlar va passivlar", "Narx va valyuta kursi"], 0),
      Q("2026-yil 1-sentyabrdan mehnatga haq to'lashning eng kam miqdori?", ["1 271 000 so'm", "1 360 000 so'm", "440 000 so'm", "1 000 000 so'm"], 1),
    ],
    selfStudy: [
      { id: "t18-s1", title: "Unumdorlik KPIlari", type: "Amaliy ish", description: "Turistik korxonada mehnat unumdorligini oshirishning 8 ta chorasi va ularni o'lchaydigan KPIlarni tuzing (masalan, bir menejerga sotilgan turlar, bir xona uchun xodimlar soni)." },
    ],
    resources: [{ title: "PF-115 (23.06.2026) — lex.uz", url: "https://www.lex.uz/en/docs/-8283656" }],
  },
};
