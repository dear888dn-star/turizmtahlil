// Mavzular bo'yicha savollar banki (Live viktorina uchun): har bir mavzuda kamida 30 ta savol.
// Tarkibi:
//   1) mavzu testlari (layer-a.js / layer-b.js);
//   2) glossariy asosidagi savollar: "atama → ta'rif" va "ta'rif → atama";
//   3) amaliy mashg'ulot masalalaridan hisob-kitob savollari — YANGI raqamlar bilan (practice-variants.js),
//      javoblar formula bo'yicha hisoblanadi, shuning uchun testlardagi namunaviy raqamlar takrorlanmaydi;
//   4) formula savollari;
//   5) qo'shimcha nazariy savollar (EXTRA, pastda).
import { practiceFor, fmt } from "./practice-variants.js";

const Q = (q, options, c) => ({ q, options, c });

// ---------- Qo'shimcha nazariy savollar (har bir mavzuga 6 ta) ----------
export const EXTRA = {
  1: [
    Q("Iqtisodiy tahlil predmeti nima?", ["Korxonaning faqat soliq hisobotlari", "Xo'jalik jarayonlari, ularning samaradorligi va moliyaviy natijalari", "Faqat xodimlar soni", "Reklama kampaniyalari"], 1),
    Q("Tahlil natijalari birinchi navbatda nima uchun xizmat qiladi?", ["Boshqaruv qarorlarini asoslash uchun", "Buxgalteriya yozuvlarini almashtirish uchun", "Soliq stavkasini belgilash uchun", "Narxlarni davlat tomonidan tasdiqlash uchun"], 0),
    Q("Turizm salohiyatiga nima kirmaydi?", ["Tarixiy-madaniy yodgorliklar", "Joylashtirish vositalari va infratuzilma", "Korxonaning soliq qarzi", "Tabiiy-rekreatsion resurslar"], 2),
    Q("Tahlilni tashkil qilishning birinchi bosqichi qaysi?", ["Xulosa yozish", "Boshqaruv qarorini qabul qilish", "Ko'rsatkichlarni hisoblash", "Tahlil maqsadi va obyektini aniqlash"], 3),
    Q("Tushum 12% ga oshib, sof foyda kamaygan bo'lsa, tahlilchi birinchi navbatda nimani tekshiradi?", ["Xarajatlar (tannarx va davr xarajatlari) dinamikasini", "Xodimlarning yoshini", "Ofis manzilini", "Sayt dizaynini"], 0),
    Q("Tahlil natijalaridan qaysi tashqi foydalanuvchi korxonaning kredit qobiliyatiga qiziqadi?", ["Korxona oshxonasi", "Bank va kreditorlar", "Turistik gid", "Mehmonxona qabulxonasi"], 1),
  ],
  2: [
    Q("Mutlaq farq qanday aniqlanadi?", ["Hisobot qiymati / bazis qiymat", "Hisobot qiymati − bazis qiymat", "Bazis qiymat × 100", "Hisobot qiymati + bazis qiymat"], 1),
    Q("O'sish sur'ati 112% bo'lsa, qo'shimcha o'sish sur'ati necha foiz?", ["112%", "88%", "12%", "1,12%"], 2),
    Q("Foyda = Daromad − Xarajat — bu qanday model?", ["Additiv", "Multiplikativ", "Kasrli", "Aralash"], 0),
    Q("Zanjirli almashtirishda hali almashtirilmagan omillar qanday darajada olinadi?", ["Haqiqiy (hisobot) darajasida", "Tasodifiy qiymatda", "Nolga teng", "Bazis (reja) darajasida"], 3),
    Q("Indeks usulida tushumning umumiy indeksi omil indekslari bilan qanday bog'langan?", ["Ularning yig'indisiga teng", "Ularning ko'paytmasiga teng", "Ularning ayirmasiga teng", "Bog'liq emas"], 1),
    Q("Omillar ta'sirlari yig'indisi nimaga teng bo'lishi kerak?", ["Natijaviy ko'rsatkichning umumiy o'zgarishiga", "Bazis qiymatga", "Nolga", "Haqiqiy qiymatga"], 0),
  ],
  3: [
    Q("Moliyaviy natijalar to'g'risidagi hisobot nimani ko'rsatadi?", ["Muayyan sanadagi aktivlar va passivlarni", "Davr mobaynidagi daromadlar, xarajatlar va foydani", "Faqat pul qoldig'ini", "Xodimlar ro'yxatini"], 1),
    Q("Pul oqimlari to'g'risidagi hisobotdagi uch faoliyat turi qaysi?", ["Operatsion, investitsion, moliyaviy", "Ichki, tashqi, aralash", "Reja, haqiqat, prognoz", "Asosiy, yordamchi, xizmat"], 0),
    Q("Bilvosita usulda operatsion pul oqimi hisoblanganda amortizatsiya nima qilinadi?", ["Sof foydadan ayriladi", "Hisobga olinmaydi", "Sof foydaga qo'shiladi", "Soliqqa ko'paytiriladi"], 2),
    Q("Debitorlik qarzining oshishi operatsion pul oqimiga qanday ta'sir qiladi?", ["Oshiradi", "Ta'sir qilmaydi", "Ikki baravar oshiradi", "Kamaytiradi"], 3),
    Q("Tashqi axborot manbaiga misol qaysi?", ["Statistika qo'mitasi va bank ma'lumotlari", "Korxona boshqaruv hisobi", "Ichki buyruqlar", "Xodimlar tabeli"], 0),
    Q("Moliyaviy hisobot rahbar tomonidan imzolanishidan oldin nima tekshirilishi kerak?", ["Ofis jihozlari", "Hisobotlararo bog'liqlik (ko'rsatkichlar mosligi)", "Xodimlar ta'tili", "Reklama byudjeti"], 1),
  ],
  4: [
    Q("Aktivlar nimani ifodalaydi?", ["Korxona mablag'larining manbalarini", "Faqat qarzlarni", "Korxona mablag'larining tarkibi va joylashuvini", "Faqat ustav kapitalini"], 2),
    Q("Passivlar nimani ifodalaydi?", ["Mablag'larning manbalari: xususiy kapital va majburiyatlar", "Faqat pul mablag'larini", "Asosiy vositalarni", "Zaxiralarni"], 0),
    Q("Quyidagilardan qaysi biri aktivga tegishli?", ["Ustav kapitali", "Kreditorlik qarzi", "Taqsimlanmagan foyda", "Debitorlik qarzi"], 3),
    Q("Netto-balans qanday balans?", ["Tartibga soluvchi moddalar chegirilgan balans", "Faqat pul mablag'lari aks etgan balans", "Rejadagi balans", "Konsolidatsiyalangan balans"], 0),
    Q("Balans qaysi sanaga tuziladi?", ["Davr mobaynida", "Muayyan sanaga (masalan, yil oxiri)", "Faqat yil boshiga", "Har kuni avtomatik"], 1),
    Q("Uzoq muddatli kredit balansning qaysi qismida aks etadi?", ["Aylanma aktivlarda", "Xususiy kapitalda", "Majburiyatlarda (passivda)", "Uzoq muddatli aktivlarda"], 2),
  ],
  5: [
    Q("Gorizontal tahlilda qaysi ko'rsatkichlar hisoblanadi?", ["Mutlaq o'zgarish va o'sish sur'ati", "Faqat ulushlar", "Faqat rentabellik", "Faqat likvidlik"], 0),
    Q("Vertikal tahlilda modda ulushi qanday aniqlanadi?", ["Modda × balans jami", "Modda / Balans jami × 100", "Balans jami − modda", "Modda / o'tgan yil moddasi"], 1),
    Q("Balansni iqtisodiy o'qish nimani anglatadi?", ["Balansni ovoz chiqarib o'qish", "Balansni tarjima qilish", "Moddalarni qayta raqamlash", "Balans ma'lumotlari asosida moliyaviy holat haqida xulosa chiqarish"], 3),
    Q("Debitorlik tushumdan ancha tez o'ssa, bu nimadan dalolat beradi?", ["Inkasso (undirish) intizomi bo'yicha xavfdan", "Likvidlikning keskin oshishidan", "Kapital ortiqchaligidan", "Soliq imtiyozidan"], 0),
    Q("A2 guruhiga qaysi aktivlar kiradi?", ["Pul mablag'lari", "Asosiy vositalar", "Tez sotiladigan aktivlar (qisqa muddatli debitorlik)", "Nomoddiy aktivlar"], 2),
    Q("P1 guruhiga nima kiradi?", ["Ustav kapitali", "Eng shoshilinch majburiyatlar (kreditorlik qarzi)", "Uzoq muddatli kreditlar", "Taqsimlanmagan foyda"], 1),
  ],
  6: [
    Q("Eskirish va yaroqlilik koeffitsiyentlari yig'indisi nechaga teng?", ["1 (100%)", "0", "2", "Har xil bo'ladi"], 0),
    Q("Chiqib ketish koeffitsiyenti qanday hisoblanadi?", ["Chiqqan AV / Yil oxiridagi AV", "Kiritilgan AV / Yil boshidagi AV", "Eskirish / Boshlang'ich qiymat", "Chiqqan AV / Yil boshidagi AV"], 3),
    Q("Yangilanish koeffitsiyenti chiqib ketish koeffitsiyentidan yuqori bo'lsa…", ["Asosiy vositalar qisqarmoqda", "Asosiy vositalar kengaymoqda", "Eskirish oshmoqda", "Hech narsa o'zgarmaydi"], 1),
    Q("Asosiy vositalar rentabelligi qanday aniqlanadi?", ["Foyda / AVning o'rtacha yillik qiymati × 100", "Sotish / Foyda", "AV / Xodimlar soni", "Eskirish / Foyda"], 0),
    Q("Turistik transport korxonasida quvvatdan foydalanish koeffitsiyenti qanday hisoblanadi?", ["Texnik quvvat / Amalda ishlatilgan", "Amalda ishlatilgan o'rindiq-km / Texnik quvvat", "Avtobuslar soni / Haydovchilar soni", "Yoqilg'i / Masofa"], 1),
    Q("Fond qaytimining oshishi nimani bildiradi?", ["AVdan foydalanish samaradorligi pasaygan", "Eskirish oshgan", "Har bir so'm AVga ko'proq xizmat to'g'ri kelmoqda", "AV qiymati oshgan"], 2),
  ],
  7: [
    Q("Gudvill nima?", ["Korxona brendi, obro'si va mijozlar bazasining balans qiymatidan ortiq bahosi", "Asosiy vositalarning eskirishi", "Qisqa muddatli kredit", "Zaxiralar qoldig'i"], 0),
    Q("NA eskirish koeffitsiyenti qanday hisoblanadi?", ["NA / Jami aktivlar", "Foyda / NA", "NA eskirishi / NA qiymati", "NA / Sotish hajmi"], 2),
    Q("NA rentabelligi (RNA) formulasi qaysi?", ["Q / NAo'r", "F / NAo'r", "D / NAo'r", "NAo'r / F"], 1),
    Q("Turistik firma uchun nomoddiy aktivga misol qaysi?", ["Avtobus", "Ofis binosi", "Ofis mebeli", "Tovar belgisi (brend) va dasturiy ta'minot litsenziyasi"], 3),
    Q("RNA = (F/D) × (D/Q) × (Q/NA) modelidagi Q/NA omili nimani anglatadi?", ["NA aylanuvchanligini", "Foydaning daromaddagi hissasini", "Sotish daromadliligini", "Eskirish darajasini"], 0),
    Q("NA aylanuvchanligi oshsa (boshqa omillar o'zgarmasa), RNA qanday o'zgaradi?", ["Kamayadi", "Oshadi", "O'zgarmaydi", "Nolga tushadi"], 1),
  ],
  8: [
    Q("Aylanma mablag'larga nima kiradi?", ["Zaxiralar, debitorlik, pul mablag'lari", "Binolar va inshootlar", "Uzoq muddatli investitsiyalar", "Ustav kapitali"], 0),
    Q("Aylanish koeffitsiyenti oshsa, bir aylanish davomiyligi…", ["Oshadi", "O'zgarmaydi", "Qisqaradi", "Ikki baravar oshadi"], 2),
    Q("Bo'shagan mablag' qanday hisoblanadi?", ["Kunlik tushum × (D0 − D1)", "Tushum / Aylanish", "D0 + D1", "Kunlik tushum / D1"], 0),
    Q("O'z aylanma mablag'i manfiy bo'lsa, bu nimani bildiradi?", ["Moliyaviy barqarorlik yuqori", "Pul ortiqcha", "Soliq imtiyozi bor", "Uzoq muddatli aktivlar ham qarz hisobidan moliyalashtirilgan — xavfli"], 3),
    Q("Ta'minlanganlik koeffitsiyenti qanday hisoblanadi?", ["O'AM / Joriy aktivlar", "Joriy aktivlar / O'AM", "O'AM / Jami aktivlar", "Majburiyatlar / O'AM"], 0),
    Q("Turistik firmada aylanma mablag'lar aylanishini tezlashtirish chorasi qaysi?", ["Debitorlik muddatlarini uzaytirish", "Oldindan to'lov va zaxiralarni optimallashtirish", "Ortiqcha zaxira yaratish", "Pulni kassada saqlash"], 1),
  ],
  9: [
    Q("Majburiyatlarning tarkibiy koeffitsiyenti nimani ko'rsatadi?", ["Majburiyat turining jami majburiyatlardagi ulushini", "Aktivlar rentabelligini", "Foyda o'sishini", "Xodimlar soni dinamikasini"], 0),
    Q("Uzoq muddatli majburiyatlarga misol qaysi?", ["Ish haqi bo'yicha qarz", "Yetkazib beruvchilarga qarz", "Byudjetga soliq qarzi", "3 yillik bank krediti"], 3),
    Q("Umumiy to'planish koeffitsiyenti 0,45 bo'lsa, aktivlarning qancha qismi qarz hisobidan?", ["4,5%", "45%", "55%", "0,45%"], 1),
    Q("Moliyaviy leverej nima?", ["Qarz mablag'lari hisobiga o'z kapitali rentabelligini o'zgartirish samarasi", "Asosiy vositalar eskirishi", "Tushumning o'sishi", "Zaxiralar aylanishi"], 0),
    Q("Qisqa muddatli majburiyatlar ulushi keskin oshsa, birinchi navbatda nima kuzatiladi?", ["Asosiy vositalar", "Likvidlik va to'lov qobiliyati", "Nomoddiy aktivlar", "Ustav kapitali"], 1),
    Q("Qarz mablag'larining narxi qaysi ko'rsatkichga bog'liq?", ["Xodimlar soniga", "Ofis maydoniga", "Foiz stavkasiga (Markaziy bank asosiy stavkasi + bank marjasi)", "Turistlar yoshiga"], 2),
  ],
  10: [
    Q("Kreditorlik qarzi nima?", ["Korxonaning boshqalarga qarzi", "Boshqalarning korxonaga qarzi", "Ustav kapitali", "Pul qoldig'i"], 0),
    Q("Aylanma mablag'larni immobilizatsiyalash koeffitsiyenti qanday hisoblanadi?", ["Debitorlik / Jami aktivlar", "Debitorlik / Aylanma aktivlar", "Kreditorlik / Debitorlik", "Pul / Debitorlik"], 1),
    Q("Debitorlik aylanish davri qisqarishi nimani bildiradi?", ["Xaridorlar sekinroq to'lamoqda", "Qarz oshgan", "Xaridorlar tezroq to'lamoqda — ijobiy", "Tushum kamaygan"], 2),
    Q("Muddati o'tgan debitorlik ulushi oshsa, qanday xavf yuzaga keladi?", ["Qarz undirilmasligi va pul yetishmasligi xavfi", "Soliq kamayishi", "Kapital ortishi", "Xavf yo'q"], 0),
    Q("Debitorlik aylanish koeffitsiyenti qanday hisoblanadi?", ["Debitorlik / Tushum", "360 / Tushum", "Kreditorlik / Tushum", "Sof tushum / O'rtacha debitorlik"], 3),
    Q("Kredit siyosatiga nima kirmaydi?", ["Mijozlar uchun qarz limitlari", "To'lov muddatlari", "Ofis ta'mirlash rejasi", "Undirish bosqichlari"], 2),
  ],
  11: [
    Q("Sof pul oqimi qanday aniqlanadi?", ["Pul kirimi − Pul chiqimi", "Daromad − Xarajat", "Aktivlar − Majburiyatlar", "Tushum × Narx"], 0),
    Q("Turistlardan olingan to'lov qaysi faoliyatga tegishli?", ["Investitsion", "Moliyaviy", "Operatsion", "Hech qaysi"], 2),
    Q("Kreditni qaytarish qaysi oqim?", ["Operatsion kirim", "Moliyaviy chiqim", "Investitsion kirim", "Operatsion chiqim"], 1),
    Q("To'g'ri usulda operatsion pul oqimi qanday tuziladi?", ["Pul tushumlari va to'lovlari bevosita guruhlanadi", "Sof foydadan boshlab tuzatishlar kiritiladi", "Faqat balans asosida", "Faqat soliq hisoboti asosida"], 0),
    Q("Foyda bo'lsa ham pul yetishmasligining asosiy sababi qaysi?", ["Ustav kapitali katta", "Soliq stavkasi past", "Xodimlar ko'p", "Pulning debitorlik va zaxiralarda “muzlab” qolishi"], 3),
    Q("Investitsion faoliyatdagi manfiy sof oqim nimani anglatishi mumkin?", ["Korxona zarar ko'rmoqda", "Korxona uzoq muddatli aktivlarga sarmoya kiritmoqda", "Kredit qaytarilmoqda", "Dividend to'lanmoqda"], 1),
  ],
  12: [
    Q("Joriy likvidlik (qoplash) koeffitsiyenti formulasi qaysi?", ["Joriy aktivlar / Joriy majburiyatlar", "Pul / Joriy majburiyatlar", "Xususiy kapital / Aktivlar", "Joriy majburiyatlar / Joriy aktivlar"], 0),
    Q("Qoplash koeffitsiyentining tavsiya etilgan darajasi qaysi?", ["0,05–0,1", "0,2–0,25", "≥ 1,5–2", "≥ 10"], 2),
    Q("Absolyut likvidlik koeffitsiyentining tavsiya etilgan darajasi qaysi?", ["0,2–0,25", "1,5–2", "0,7–1", "≥ 5"], 0),
    Q("Avtonomiya koeffitsiyenti qanday hisoblanadi?", ["Majburiyatlar / Aktivlar", "Xususiy kapital / Jami aktivlar", "Joriy aktivlar / Majburiyatlar", "Foyda / Aktivlar"], 1),
    Q("Mutlaq likvid balansning birinchi sharti qaysi?", ["A1 ≤ P1", "A4 ≥ P4", "A2 = 0", "A1 ≥ P1"], 3),
    Q("Tez likvidlik koeffitsiyentining tavsiya etilgan darajasi taxminan qancha?", ["0,7–1", "0,01–0,05", "3–5", "≥ 10"], 0),
  ],
  13: [
    Q("Sof foyda qanday aniqlanadi?", ["Yalpi foyda + Soliq", "Soliq to'lagunga qadar foyda − Foyda solig'i", "Sof tushum − Davr xarajatlari", "Tannarx − Tushum"], 1),
    Q("Davr xarajatlariga nima kiradi?", ["Sotish va ma'muriy xarajatlar", "Xizmatlar tannarxi", "Foyda solig'i", "Dividendlar"], 0),
    Q("Yalpi marja qanday hisoblanadi?", ["Tannarx / Tushum", "Sof foyda / Aktivlar", "(Sof tushum − Tannarx) / Sof tushum × 100", "Tushum × Tannarx"], 2),
    Q("Tannarx tushumdan sekinroq o'ssa, yalpi marja…", ["Kamayadi", "O'zgarmaydi", "Nolga tushadi", "Oshadi"], 3),
    Q("Soliq to'lagunga qadar foyda 1 100 mln, soliq 15%. Sof foyda qancha?", ["935 mln", "1 100 mln", "165 mln", "1 265 mln"], 0),
    Q("Moliyaviy faoliyat natijasiga nima kiradi?", ["Xizmatlar tannarxi", "Olingan va to'langan foizlar, valyuta kursi farqlari", "Ish haqi", "Turistik soliq"], 1),
  ],
  14: [
    Q("Foydaning rag'batlantirish funksiyasi nimani bildiradi?", ["Foyda xodimlar va mulkdorlarni samarali ishlashga undaydi", "Foyda soliqni belgilaydi", "Foyda balansni tenglaydi", "Foyda narxni belgilaydi"], 0),
    Q("Yalpi daromad (YD) nimaga teng?", ["c + v", "M + c", "v + m (ish haqi + qo'shimcha mahsulot)", "M × c"], 2),
    Q("To'rt omilli multiplikativ modelda (M = a × b × c × d) birinchi bo'lib qaysi omil almashtiriladi?", ["Eng kichik omil", "Birinchi (miqdoriy) omil — a", "Oxirgi omil — d", "Tasodifiy omil"], 1),
    Q("Foyda o'sishida sof tushumning ulushi 80% bo'lsa, rentabellikning ulushi necha foiz?", ["80%", "100%", "0%", "20%"], 3),
    Q("Foydaning taqsimlash funksiyasiga misol qaysi?", ["Foydani dividend, rivojlanish va zaxiraga ajratish", "Inventarizatsiya o'tkazish", "Balansni tuzish", "Narx belgilash"], 0),
    Q("Ikkilamchi omillar nimani tavsiflaydi?", ["Faqat soliqni", "Birlamchi omillarni tashkil etuvchi omillarni (guruhlar soni, turistlar, narx va h.k.)", "Faqat amortizatsiyani", "Faqat valyuta kursini"], 1),
  ],
  15: [
    Q("ROE qanday hisoblanadi?", ["Sof foyda / O'z kapitali × 100", "Sof foyda / Tushum × 100", "Tushum / Aktivlar", "Aktivlar / O'z kapitali"], 0),
    Q("Aktivlar aylanishi qanday aniqlanadi?", ["Aktivlar / Tushum", "Sof foyda / Aktivlar", "Sof tushum / Aktivlar", "O'z kapitali / Aktivlar"], 2),
    Q("Moliyaviy leverej (multiplikator) DuPont modelida qanday aniqlanadi?", ["O'z kapitali / Aktivlar", "Aktivlar / O'z kapitali", "Majburiyatlar / Tushum", "Foyda / Kapital"], 1),
    Q("ROS 7,5%, aktivlar aylanishi 0,8, leverej 2 bo'lsa, ROE qancha?", ["10,3%", "6%", "15%", "12%"], 3),
    Q("Faoliyat rentabelligi qanday hisoblanadi?", ["Sof foyda / Xizmatlar tannarxi × 100", "Tannarx / Tushum", "Foyda / Xodimlar", "Tushum / Foyda"], 0),
    Q("Mehmonxonada ADR nima?", ["Bandlik darajasi", "Sotilgan bir xonaning o'rtacha narxi", "Xodimlar soni", "Qavatlar soni"], 1),
  ],
  16: [
    Q("Zararsizlik nuqtasi (natural birlikda) qanday hisoblanadi?", ["Doimiy xarajatlar / Bir birlik marjinal daromadi", "Tushum × Doimiy xarajatlar", "O'zgaruvchan xarajat / Narx", "Foyda / Narx"], 0),
    Q("Zararsizlik tushumi (qiymat usuli) formulasi qaysi?", ["Tushum × O'zgaruvchan xarajat / Md", "Doimiy xarajat − Md", "Tushum × Doimiy xarajatlar / Marjinal daromad", "Md / Tushum"], 2),
    Q("Qaysi xarajat doimiy hisoblanadi?", ["Har bir turist uchun ovqat", "Ofis ijarasi va ma'muriy xodimlar maoshi", "Har bir turist uchun muzey chiptasi", "Har bir turist uchun sug'urta"], 1),
    Q("Doimiy xarajatlar oshsa (boshqa shartlar o'zgarmasa), zararsizlik nuqtasi…", ["Pasayadi", "O'zgarmaydi", "Nolga tushadi", "Oshadi"], 3),
    Q("Maqsadli foyda uchun zarur sotuv hajmi qanday hisoblanadi?", ["(Doimiy xarajatlar + Maqsadli foyda) / Bir birlik Md", "Doimiy xarajatlar / Narx", "Maqsadli foyda / Narx", "Narx × Hajm"], 0),
    Q("Xavfsizlik zaxirasi qanday hisoblanadi (%)?", ["Zn / Tushum", "(Tushum − Zararsizlik tushumi) / Tushum × 100", "Md / Tushum", "Doimiy / O'zgaruvchan"], 1),
  ],
  17: [
    Q("Xarajatlar darajasining pasayishi nimani bildiradi?", ["Har bir so'm tushumga kamroq xarajat to'g'ri kelmoqda — samaradorlik oshgan", "Tushum kamaygan", "Zarar oshgan", "Soliq oshgan"], 0),
    Q("Qarz foizlari foyda solig'i bazasini kamaytirgani uchun kredit narxi qanday hisoblanadi?", ["Stavka × (1 + soliq stavkasi)", "Stavka × (1 − soliq stavkasi)", "Stavka / soliq stavkasi", "Stavka − 1"], 1),
    Q("Uzoq muddatli jalb qilingan mablag'larning uzoq muddatli aktivlardagi hissasi qanday aniqlanadi?", ["Uzoq muddatli qarz / Uzoq muddatli aktivlar", "Qisqa muddatli qarz / Aylanma aktivlar", "Uzoq muddatli aktivlar / Balans", "Kreditorlik / Debitorlik"], 0),
    Q("Turistik soliq kim tomonidan to'lanadi?", ["Turoperator xodimi", "Mehmonxona egasi o'z hisobidan", "Joylashtirish vositasida yashovchi turist (mehmonxona undiradi)", "Aviakompaniya"], 2),
    Q("Kredit 1 200 mln, stavka 18%. Yillik foiz xarajati qancha?", ["120 mln", "180 mln", "18 mln", "216 mln"], 3),
    Q("Kreditorlikni muddat bo'yicha guruhlashdan maqsad nima?", ["To'lov jadvali va risk darajasini aniqlash", "Soliqni kamaytirish", "Narxni oshirish", "Xodimlarni baholash"], 0),
  ],
  18: [
    Q("Mehnat unumdorligi qanday hisoblanadi?", ["Xizmat hajmi / Xodimlar soni", "Xodimlar soni / Xizmat hajmi", "Ish haqi / Xodimlar", "Foyda × Xodimlar"], 0),
    Q("Ish vaqti fondi (IVF) qanday hisoblanadi?", ["Ishchilar + kunlar + soat", "Ishchilar soni × Kunlar soni × Ish kuni davomiyligi (soat)", "Kunlar / Ishchilar", "Ish haqi / Soat"], 1),
    Q("Qo'nimsizlik koeffitsiyenti qanday aniqlanadi?", ["Qabul qilinganlar / O'rtacha xodimlar", "Barcha ketganlar / Ishchilar", "(O'z xohishi bilan + intizom buzilishi sababli ketganlar) / O'rtacha xodimlar soni", "Ketganlar − Qabul qilinganlar"], 2),
    Q("Ish haqi fondi o'sish sur'ati unumdorlik o'sish sur'atidan yuqori bo'lsa…", ["Samaradorlik oshadi", "Tannarx kamayadi", "Foyda albatta oshadi", "Xizmat tannarxi oshishi xavfi tug'iladi"], 3),
    Q("Bir xodim unumdorligi = ishchilar ulushi × bir ishchi unumdorligi. Ishchilar ulushi kamaysa (ikkinchi omil o'zgarmasa)…", ["Bir xodim unumdorligi kamayadi", "Oshadi", "O'zgarmaydi", "Ikki baravar oshadi"], 0),
    Q("Kadrlar bilan ta'minlanish qanday hisoblanadi?", ["Rejadagi / Haqiqiy xodimlar", "Haqiqiy xodimlar soni / Rejadagi xodimlar soni × 100", "Ketganlar / Rejadagi", "Ish haqi / Xodimlar"], 1),
  ],
};

// ---------- Avtomatik savollar ----------
const cut = (s, n = 220) => (s.length > n ? `${s.slice(0, n - 1).trim()}…` : s);

/** Glossariydan: "atama → ta'rif" va "ta'rif → atama" (chalg'ituvchilar — shu mavzuning boshqa atamalari). */
function glossaryQuestions(glossary, pool) {
  const out = [];
  // Chalg'ituvchilar shu mavzuning boshqa atamalaridan olinadi (savol oson bo'lib qolmasligi uchun);
  // ular yetmasa — boshqa mavzulardan.
  const others = (g, key) => {
    const uniq = (arr) => arr.filter((v, i, a) => v && a.indexOf(v) === i && v !== g[key]);
    const own = uniq(glossary.filter((x) => x !== g).map((x) => x[key]));
    if (own.length >= 3) return own;
    return uniq([...own, ...pool.filter((x) => !glossary.includes(x)).map((x) => x[key])]);
  };
  glossary.forEach((g, i) => {
    const d1 = pick3(others(g, "def"), i);
    if (d1.length === 3) out.push(place(`«${g.term}» — bu…`, cut(g.def), d1.map((x) => cut(x)), i));
    const d2 = pick3(others(g, "term"), i + 1);
    if (d2.length === 3) out.push(place(`Qaysi tushuncha ta'rifi: «${cut(g.def, 260)}»?`, g.term, d2, i + 2));
  });
  return out;
}

// Deterministik "tasodif": savollar banki har safar bir xil bo'ladi (o'yinda variantlar baribir aralashtiriladi)
function pick3(list, seed) {
  const arr = [...list];
  const res = [];
  let k = seed * 7 + 3;
  while (res.length < 3 && arr.length) {
    k = (k * 31 + 17) % 9973;
    res.push(arr.splice(k % arr.length, 1)[0]);
  }
  return res;
}
function place(q, correct, wrong, seed) {
  const c = seed % 4;
  const options = [...wrong];
  options.splice(c, 0, correct);
  return { q, options, c, kind: "auto" };
}

/** Hisob-kitob savoli: to'g'ri javob va tipik xatolarga asoslangan chalg'ituvchilar. */
function calcOptions(v, unit, seed) {
  const a = Math.abs(v);
  const d = a >= 1000 ? 0 : a >= 100 ? 1 : a >= 10 ? 2 : 3;
  const show = (x) => `${fmt(x, d)}${unit === "%" ? "%" : unit ? ` ${unit}` : ""}`;
  const candidates = [v * 1.1, v * 0.9, v * 1.25, v * 0.8, v * 1.5, v * 0.5];
  if (unit === "%" && v > 100) candidates.unshift(v - 100);
  if (v < 0) candidates.unshift(-v);
  const correct = show(v);
  const wrong = [];
  for (const x of candidates) {
    const s = show(x);
    if (s !== correct && !wrong.includes(s)) wrong.push(s);
    if (wrong.length === 3) break;
  }
  return place("", correct, wrong, seed);
}

function calcQuestions(num, maxCount = 12) {
  const out = [];
  for (const seed of ["bank-1", "bank-2", "bank-3"]) {
    const pr = practiceFor(num, seed);
    if (!pr) break;
    pr.tasks.forEach((t, ti) => {
      t.fields.forEach((f, fi) => {
        if (out.length >= maxCount) return;
        const o = calcOptions(f.value, f.unit, ti + fi + out.length);
        if (o.options.length < 4) return;
        out.push({ q: `${t.text} → «${f.label}» nechaga teng?`, options: o.options, c: o.c, kind: "calc" });
      });
    });
  }
  return out;
}

function formulaQuestions(tasks, allFormulas) {
  const out = [];
  tasks.filter((t) => t.formula).forEach((t, i) => {
    const wrong = pick3(allFormulas.filter((f) => f !== t.formula), i + t.formula.length);
    if (wrong.length === 3) out.push({ ...place(`«${t.title}» masalasida qaysi formula qo'llaniladi?`, t.formula, wrong, i + 1), kind: "formula" });
  });
  return out;
}

/**
 * Mavzu bo'yicha to'liq savollar banki: [{ q, options, correct, kind }].
 * kind: "test" | "auto" (glossariy) | "calc" | "formula" | "extra".
 */
export function buildBank({ num, quiz, glossary, practice }, ctx) {
  const bank = [
    ...quiz.map((q) => ({ q: q.q, options: q.options, correct: q.correct, kind: "test" })),
    ...(EXTRA[num] || []).map((q) => ({ q: q.q, options: q.options, correct: q.c, kind: "extra" })),
    ...glossaryQuestions(glossary, ctx.allGlossary).map((q) => ({ q: q.q, options: q.options, correct: q.c, kind: q.kind })),
    ...(practice ? formulaQuestions(practice.tasks, ctx.allFormulas) : []).map((q) => ({ q: q.q, options: q.options, correct: q.c, kind: q.kind })),
    ...(practice ? calcQuestions(num) : []).map((q) => ({ q: q.q, options: q.options, correct: q.c, kind: q.kind })),
  ];
  // Bir xil savollar takrorlanmasin
  const seen = new Set();
  return bank.filter((q) => (seen.has(q.q) ? false : seen.add(q.q)));
}
