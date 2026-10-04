// Dolzarb ma'lumotlar: o'quv qo'llanmadagi (2024; ko'p raqamlar 2000–2010-yillarga oid) eskirgan
// faktlarning tekshirilgan yangi qiymatlari. Har bir yozuvda:
//   match  — kitob matnidagi eskirgan jumla parchasi (mavzu matnida belgilanadi);
//   topics — qaysi mavzu(lar)da ko'rsatiladi (0 = kirish);
//   old    — kitobdagi da'vo; now — tekshirilgan dolzarb ma'lumot; sources — rasmiy manbalar.
// Yangilash: CHECKED sanasini o'zgartiring va yozuvlarni tahrirlang (kod o'zgarmaydi).

export const CHECKED = "2026-10-04";

export const UPDATES = [
  {
    id: "world-arrivals",
    topics: [0, 1],
    area: "Jahon turizmi",
    match: "bugun dunyoda bir yilda 700 mln. kishi",
    old: "Dunyoda bir yilda 700 mln kishi sayohat qiladi, turizmga 600 mlrd AQSH dollaridan ko'proq sarflanadi.",
    now: "2025-yilda xalqaro turistlar soni 1,52 mlrd kishiga yetdi (2024-yilga nisbatan +4%, ~60 mln ko'p). Xalqaro turizm tushumlari — taxminan 1,9 trln AQSH dollari (+5%), transport bilan birga turizm eksporti — rekord 2,2 trln dollar.",
    sources: [
      { title: "UN Tourism — International tourist arrivals up 4% in 2025 (20.01.2026)", url: "https://www.untourism.int/un-tourism-world-tourism-barometer-data" },
    ],
  },
  {
    id: "world-forecast-2020",
    topics: [0],
    area: "Jahon turizmi",
    match: "2020 yilga borib xalqaro turistik sayohatlar",
    old: "2020-yilga borib xalqaro sayohatlar 1,6 mlrd ga, daromad 2 trln dollarga yetadi (prognoz).",
    now: "Prognoz pandemiya sababli 2020-yilda bajarilmadi: 2020-yilda xalqaro sayohatlar ~73% ga qisqardi. To'liq tiklanish 2024-yilda qayd etildi, 2025-yilda esa 1,52 mlrd kishi bilan yangi rekord o'rnatildi.",
    sources: [
      { title: "UN Tourism — World Tourism Barometer, January 2026", url: "https://www.e-unwto.org/doi/abs/10.18111/wtobarometereng.2026.24.1.1" },
    ],
  },
  {
    id: "world-gdp",
    topics: [0],
    area: "Jahon turizmi",
    match: "yalpi milliy mahsulotning 11 % ini",
    old: "Turizm jahon YaMMning 11%, har 16 ish o'rnidan birini tashkil qiladi.",
    now: "WTTC ma'lumotiga ko'ra, 2025-yilda sayohat va turizmning jahon YaIMga hissasi 11,6 trln AQSH dollari (jahon iqtisodiyotining 9,8%) bo'ldi; soha 366 mln ish o'rnini ta'minladi va dunyodagi har uchta yangi ish o'rnidan biri turizmga to'g'ri keldi.",
    sources: [
      { title: "WTTC — Travel & Tourism Economic Impact Research", url: "https://wttc.org/research/economic-impact" },
    ],
  },
  {
    id: "world-top",
    topics: [0],
    area: "Jahon turizmi",
    match: "Bir yilda Fransiyaga xalqaro turizm sifatida 75,2 mln kishi",
    old: "Fransiyaga yiliga 75,2 mln, Ispaniyaga 50,1, AQSHga 45,5 mln kishi keladi.",
    now: "2025-yilda: Fransiya — 102 mln, Ispaniya — 96,8 mln, AQSH — 72,4 mln xalqaro turist. Fransiya 30 yildan ortiq vaqtdan beri eng ko'p tashrif buyuriladigan mamlakat.",
    sources: [
      { title: "Euronews — France welcomed record visitor numbers in 2025 (20.02.2026)", url: "https://www.euronews.com/2026/02/20/france-welcomed-record-visitor-numbers-in-2025-retaining-its-title-as-worlds-most-visited-" },
    ],
  },
  {
    id: "uz-heritage",
    topics: [0, 1],
    area: "O'zbekiston turizmi",
    match: "4000 dan ziyod tarixiy-madaniy yodgorliklar",
    old: "O'zbekistonda 4000 dan ziyod tarixiy-madaniy yodgorlik bor.",
    now: "Moddiy madaniy meros obyektlari davlat ro'yxatida 8 mingdan ortiq (taxminan 8,4 ming) obyekt bor: arxeologiya yodgorliklari (~4,8 ming), me'morchilik yodgorliklari (~2,3 ming), monumental san'at asarlari va diqqatga sazovor joylar.",
    sources: [
      { title: "Madaniy meros agentligi ma'lumotlari (gazeta.uz, 2025)", url: "https://www.gazeta.uz/oz/2025/03/30/monuments/" },
    ],
  },
  {
    id: "uz-unesco",
    topics: [0, 1],
    area: "O'zbekiston turizmi",
    match: "Shahrisabz va Samarqand shaharlari YUNESCO",
    old: "YUNESKO ro'yxatida Ichan-Qal'a, Buxoro, Shahrisabz va Samarqand bor.",
    now: "2026-yil iyul holatiga O'zbekistonning 8 ta obyekti YUNESKO Butunjahon merosi ro'yxatida: Ichan-Qal'a (1990), Buxoro tarixiy markazi (1993), Shahrisabz tarixiy markazi (2000), Samarqand — madaniyatlar chorrahasi (2001), G'arbiy Tyan-Shan (2016, tabiiy), Turonning qishi sovuq cho'llari (2023, tabiiy), Ipak yo'llari: Zarafshon–Qoraqum yo'lagi (2023) va Toshkent modernizm me'morchiligi (2026).",
    sources: [
      { title: "UNESCO World Heritage — Uzbekistan", url: "https://whc.unesco.org/en/statesparties/uz" },
      { title: "Gazeta.uz — Tashkent modernism added to UNESCO list (26.07.2026)", url: "https://www.gazeta.uz/en/2026/07/26/tashkent-modernism-unesco/" },
    ],
  },
  {
    id: "uz-hotels",
    topics: [1],
    area: "O'zbekiston turizmi",
    match: "Hozirgi kunda O‘zbekistonda 350 dan ortiq mehmonhonalar",
    old: "O'zbekistonda 350 dan ortiq mehmonxona bor.",
    now: "Mamlakatda mehmonxona, xostel va oilaviy mehmon uylarini qo'shganda 6,9 mingga yaqin joylashtirish vositasi (~185,6 ming o'rin) faoliyat yuritadi; xalqaro tarmoq mehmonxonalari 2026-yil 1-avgust holatiga 51 taga yetdi. 2026-yildan “O'zbekiston merosi mehmonxonalari” dasturi boshlandi.",
    sources: [
      { title: "Kun.uz — O'zbekiston 2026-yilda 12 mln xorijiy mehmonni qabul qilishni rejalashtirmoqda (25.02.2026)", url: "https://kun.uz/news/2026/02/25/ozbekiston-2026-yilda-12-mln-xorijiy-mehmonni-qabul-qilishni-rejalashtirmoqda" },
      { title: "Spot.uz — 2026-yildan “O'zbekiston merosi mehmonxonalari” dasturi", url: "https://www.spot.uz/oz/2025/12/26/tourism" },
    ],
  },
  {
    id: "uz-flow",
    topics: [1],
    area: "O'zbekiston turizmi",
    match: "E’tirof etish kerakki, mamlakatimizning xalqaro turizm bozoridagi ulushi juda kam",
    old: "Mamlakatimizning xalqaro turizm bozoridagi ulushi juda kam (raqamlarsiz).",
    now: "2025-yilda O'zbekistonga turistik maqsadda 11,7 mln xorijiy fuqaro keldi (2024-yilga nisbatan +46,8%) — tarixiy rekord; turizm xizmatlari eksporti ~4,9 mlrd AQSH dollari (xizmatlar eksportining qariyb yarmi). 2026-yil yanvar–avgustida 9,1 mln xorijiy turist (+21,1%) qayd etildi. UN Tourism O'zbekistonni 2025-yilda eng tez o'sayotgan yo'nalishlar qatoriga kiritdi.",
    sources: [
      { title: "Milliy statistika qo'mitasi (kun.uz, 15.09.2026)", url: "https://kun.uz/news/2026/09/15/ozbekistonga-turistlar-oqimi-21-foizga-oshdi" },
      { title: "Euronews — Uzbekistan among fastest-growing destinations (19.12.2025)", url: "https://www.euronews.com/2025/12/19/unwto-uzbekistan-ranks-among-worlds-fastest-growing-tourism-destinations-in-2025" },
    ],
  },
  {
    id: "uz-governance",
    topics: [1],
    area: "Davlat boshqaruvi",
    match: "“O‘zbekturizm” milliy kompaniyasi tashkil topdi",
    old: "Turizmda davlat siyosatini “O'zbekturizm” milliy kompaniyasi amalga oshiradi.",
    now: "“O'zbekturizm” milliy kompaniyasi 2016-yil dekabrida Turizmni rivojlantirish davlat qo'mitasiga aylantirilgan. Hozirda sohani 2025-yil 19-noyabrdagi PQ-348-son qaror bilan faoliyati tashkil etilgan O'zbekiston Respublikasi Turizm qo'mitasi boshqaradi. Qarorda 2030-yilgacha maqsadlar: yiliga 20 mln xorijiy turist (2026-yilda 12 mln), turizmning YaIMdagi ulushini 3,5% dan 7% ga oshirish, turizm eksportini 6 mlrd dollardan oshirish.",
    sources: [
      { title: "lex.uz — PQ-348, 19.11.2025", url: "https://lex.uz/uz/docs/-7851788" },
      { title: "lex.uz — VMQ-105, 16.03.2026 (Turizm qo'mitasi faoliyati)", url: "https://lex.uz/uz/docs/-8086307" },
    ],
  },
  {
    id: "unwto-name",
    topics: [1],
    area: "Davlat boshqaruvi",
    match: "“Xalqaro turizm tashkiloti” (UNWTO)ning a’zosi",
    old: "O'zbekiston 1993-yildan UNWTO a'zosi.",
    now: "Fakt to'g'ri. Qo'shimcha: 2024-yildan tashkilot “UN Tourism” (BMT Turizm tashkiloti) nomi bilan ataladi; 2023-yil oktyabrida Samarqandda UN Tourism Bosh assambleyasining 25-sessiyasi o'tkazildi.",
    sources: [
      { title: "UN Tourism", url: "https://www.untourism.int" },
    ],
  },
  {
    id: "fin-forms",
    topics: [3, 4],
    area: "Moliyaviy hisobot",
    match: "140-sonli “Buxgalteriya hisoboti va balansi to‘g‘risidagi Nizom”",
    old: "Moliyaviy hisobot Moliya vazirligining 2002-yil 27-dekabrdagi 140-son buyrug'i (ro'yxat № 1209) asosida tuziladi.",
    now: "2025-yil 1-yanvardan moliyaviy hisobotlar tarkibi, mazmuni va topshirish muddatlari Iqtisodiyot va moliya vazirining 2024-yil 8-oktabrdagi 181-son buyrug'i bilan tasdiqlangan Nizom (ro'yxat № 3567, 04.11.2024) asosida belgilanadi; 1-son BHMS “Moliyaviy hisobotni taqdim etish va hisob siyosati” yangi tahrirda (ro'yxat № 3544, 06.08.2024). Yillik hisobot: BHMS bo'yicha — keyingi yilning 1-martigacha, MHXS bo'yicha — 1-maygacha. Mikrofirma va kichik korxonalar faqat balans va moliyaviy natijalar to'g'risidagi hisobotni topshiradi.",
    sources: [
      { title: "lex.uz — Nizom, ro'yxat № 3567 (04.11.2024)", url: "https://www.lex.uz/uz/docs/-7194594" },
      { title: "lex.uz — 1-son BHMS, ro'yxat № 3544 (06.08.2024)", url: "https://lex.uz/uz/docs/-7050497" },
    ],
  },
  {
    id: "fin-ifrs",
    topics: [3, 4, 11],
    area: "Moliyaviy hisobot",
    match: "Xalqaro standartlarda pul oqimlari uch guruhga",
    old: "Kitobda MHXS (xalqaro standartlar) faqat taqqoslash uchun eslatiladi.",
    now: "PQ-4611 (24.02.2020) bo'yicha aksiyadorlik jamiyatlari, tijorat banklari, sug'urta tashkilotlari va yirik soliq to'lovchilar MHXS bo'yicha hisobot tuzadi. 2026-yilda 425 ta tashkilot jamoat ahamiyatiga molik deb topildi — ular 2027-yil 1-yanvardan MHXSga o'tadi. MHXS (IAS 7) bo'yicha pul oqimlari uch guruhga bo'linadi: operatsion, investitsiya va moliyaviy faoliyat.",
    sources: [
      { title: "Kun.uz — 425 ta tashkilot jamoat ahamiyatiga molik deb topildi (27.06.2026)", url: "https://kun.uz/news/2026/06/27/ozbekistonda-425-ta-tashkilot-jamoat-ahamiyatiga-molik-deb-topildi-113ad9" },
      { title: "Markaziy bank — MHXSga o'tishning yangi bosqichi", url: "https://cbu.uz/uz/press_center/news/3269208/" },
    ],
  },
  {
    id: "fin-extraordinary",
    topics: [13, 14],
    area: "Moliyaviy hisobot",
    match: "favqulotda olinadigan foyda va to‘lanadigan zararning",
    old: "Moliyaviy natijalar tarkibida favqulodda foyda va zararlar alohida ko'rsatiladi; manba — “OKUD bo'yicha 2-shakl”.",
    now: "MHXS (IAS 1, 87-band) “favqulodda moddalar”ni alohida ko'rsatishni taqiqlaydi — ular boshqa operatsion yoki moliyaviy daromad/xarajatlar tarkibida aks ettiriladi. Milliy hisobotda amaldagi shakl bo'yicha tekshiring. Hisobot nomi: “Moliyaviy natijalar to'g'risidagi hisobot” (181-son buyruq bilan tasdiqlangan Nizom, 2025).",
    sources: [
      { title: "lex.uz — 1-son BHMS (2024)", url: "https://lex.uz/uz/docs/-7050497" },
    ],
  },
  {
    id: "tax-rates",
    topics: [13, 14],
    area: "Soliqlar",
    match: "Undan qo‘shilgan qiymat solig‘i, aksizlarni to‘lab sof tushumni aniqlash mumkin",
    old: "Kitobda soliq stavkalari keltirilmagan; misollardagi “foyda solig'i” eski stavkalarga tayangan.",
    now: "2026-yilda asosiy stavkalar: foyda solig'i — 15%; QQS — 12%; jismoniy shaxslar daromad solig'i — 12%; ijtimoiy soliq — 12%; aylanmadan olinadigan soliq — 4% (YaTT va o'zini o'zi band qilganlar uchun 1 mlrd so'mgacha — 1%). 2026-yil 1-iyundan umumiy ovqatlanish, savdo va xizmat ko'rsatish korxonalari soddalashtirilgan 6% QQS rejimini tanlashi mumkin. Turoperatorlarning xorijiy turistlarga xizmatlari eksport sifatida QQSdan ozod.",
    sources: [
      { title: "Kun.uz — 2026-yilda asosiy soliqlar bo'yicha stavkalar o'zgarmaydi (18.12.2025)", url: "https://kun.uz/news/2025/12/18/2026-yilda-asosiy-soliqlar-boyicha-stavkalar-ozgarmaydi" },
      { title: "Kun.uz — Hotels and tour operators incentives extended (18.08.2026)", url: "https://kun.uz/en/news/2026/08/18/uzbekistan-extends-tax-and-customs-incentives-for-hotels-and-tour-operators" },
    ],
  },
  {
    id: "tourist-tax",
    topics: [13, 17],
    area: "Soliqlar",
    match: "Endi ular tarkibidan sof foydani aniqlab olish uchun",
    old: "Turistik (sayyohlik) soliq kitobda ko'rib chiqilmagan.",
    now: "Turistik soliq joylashtirish vositalari orqali har bir sutka uchun undiriladi: 2026-yil 1-sentyabrdan xorijiy fuqarolar uchun BHMning 15% (66 000 so'm), O'zbekiston fuqarolari uchun 0,4% (1 760 so'm); 16 yoshgacha bo'lganlar ozod. Mehmonxonalar uchun yer va mol-mulk soliqlari 10 baravar kamaytirilgan stavkada to'lanadigan imtiyoz 2030-yilgacha uzaytirildi.",
    sources: [
      { title: "Reikartz — Tourist tax in Uzbekistan (2026)", url: "https://reikartz.com/en/rules/tourist-tax-uzbekistan/" },
      { title: "Kun.uz — Hotels and tour operators incentives extended (18.08.2026)", url: "https://kun.uz/en/news/2026/08/18/uzbekistan-extends-tax-and-customs-incentives-for-hotels-and-tour-operators" },
    ],
  },
  {
    id: "wages",
    topics: [18],
    area: "Mehnat va ish haqi",
    match: "Respublikamizda 2003-2015 yillarda Yalpi ichki mahsulot",
    old: "Ish haqi tahlili 2003–2015-yillar makroiqtisodiy ma'lumotlariga tayangan.",
    now: "2026-yil 1-sentyabrdan (PF-115, 23.06.2026): mehnatga haq to'lashning eng kam miqdori — oyiga 1 360 000 so'm, bazaviy hisoblash miqdori (BHM) — 440 000 so'm. Mehnat munosabatlari 2023-yil 30-apreldan kuchga kirgan yangi Mehnat kodeksi bilan tartibga solinadi. Ish haqi fondi tahlilida shu ko'rsatkichlardan foydalaning.",
    sources: [
      { title: "lex.uz — PF-115, 23.06.2026", url: "https://www.lex.uz/en/docs/-8283656" },
    ],
  },
  {
    id: "cbu-rate",
    topics: [9, 17],
    area: "Moliya bozori",
    match: "Chetdan jalb qilingan mablag‘lar bilan bog‘liq ko‘rsatkichlarni aniqlash",
    old: "Kredit va qarz mablag'lari tahlilida foiz stavkalari keltirilmagan.",
    now: "Markaziy bankning asosiy stavkasi — yillik 14% (16.09.2026 qarori bilan o'zgarishsiz qoldirildi; avgustda inflyatsiya 6,2%). Mehmonxona qurilishi uchun milliy valyutada 10 yilgacha yillik 16% li imtiyozli kreditlar ajratiladi. Qarz kapitali narxini baholashda shu stavkalardan foydalaning.",
    sources: [
      { title: "Kun.uz — Markaziy bank asosiy stavkani 14 foiz darajada o'zgarishsiz qoldirdi (16.09.2026)", url: "https://kun.uz/news/2026/09/16/markaziy-bank-asosiy-stavkani-14-foiz-darajada-ozgarishsiz-qoldirdi" },
    ],
  },
  {
    id: "tourism-law",
    topics: [1],
    area: "Davlat boshqaruvi",
    match: "Hukumat tomonidan turizm sohasini modernizatsiya qilish",
    old: "Turizmning normativ-huquqiy bazasi umumiy tarzda tilga olinadi.",
    now: "Asosiy hujjatlar: “Turizm to'g'risida”gi Qonun (O'RQ-549, 18.07.2019; oxirgi o'zgartirishlar 30.12.2025, O'RQ-1109); “O'zbekiston — 2030” strategiyasi (PF-158, 11.09.2023); PQ-348 (19.11.2025) — turizmni 2030-yilgacha jadal rivojlantirish.",
    sources: [
      { title: "lex.uz — Turizm to'g'risidagi Qonun", url: "https://lex.uz/uz/docs/-4428097" },
      { title: "lex.uz — PQ-348, 19.11.2025", url: "https://lex.uz/uz/docs/-7851788" },
    ],
  },
];

export const updatesFor = (num) => UPDATES.filter((u) => u.topics.includes(num));
