# ChatGPT uchun tahlil prompti

Quyidagi matnni to'liq nusxalab ChatGPT'ga yuboring. U senariyni tahlil qiladi va oxirida Claude'ga yuboriladigan tayyor "qayta prompt" qaytaradi.

---

Sen tajribali o'yin dizayneri (game designer), til o'rganish metodisti va mobil mahsulot menejerisan. Men ingliz tilini o'rganish uchun onlayn strategiya o'yini qurmoqchiman. Quyida o'yinning to'liq konsepsiyasi, qabul qilingan qarorlar va birinchi o'yinning 18 sahnali senariysi berilgan. Sening vazifang: uni tanqidiy tahlil qilish va oxirida men boshqa AI yordamchiga (Claude) yuboradigan aniq "qayta prompt" yozib berish.

## 1. O'yin konsepsiyasi

- Asos: territorial.io uslubidagi jonli, ko'p o'yinchili strategiya. Haqiqiy geografiyali butun dunyo xaritasi (qirg'oqlar, tog'lar, cho'llar, o'rmonlar, dengizlar). Mavzu tarixiy: o'rta asrlar, davlatlar tarixiy nomlar bilan (Temuriylar, Oltin O'rda, Safaviylar, Usmoniylar va hokazo), xaritadagi obyektlar o'tgan asrlarga oid (qal'a, karvonsaroy, madrasa).
- Platformalar: veb, Android, iOS (Expo/React Native), backend Supabase + alohida WebSocket o'yin serveri.
- Auditoriya: o'zbek tilida so'zlashuvchi, ingliz tilini o'rganayotgan foydalanuvchilar. Interfeys o'zbekcha.
- Asosiy g'oya: territorial.io'da hudud "hujum" tugmasi bilan kengayadi. Bizda hudud faqat speaking yoki writing mashqini to'g'ri bajarish orqali kengayadi.

## 2. Qabul qilingan qoidalar

1. Foydalanuvchi boshlang'ich joyni xaritadan o'zi tanlaydi.
2. Bo'sh hududni egallash uchun faqat mashq kerak; dushman hududini egallash uchun mashq + qo'shin kerak.
3. Qo'shin ikki manbadan to'planadi: vaqt bilan (hudud hajmiga qarab daromad) va har to'g'ri mashqdan bonus.
4. Hudud hajmi va qo'shin soni alohida: katta davlatning qo'shini kam bo'lishi mumkin. Reytingda ikkala ustun ko'rinadi.
5. Ball qancha ko'p bo'lsa, bitta to'g'ri javob shuncha ko'p hudud beradi.
6. Relyef hujum narxini belgilaydi: tekislik arzon, o'rmon o'rtacha, cho'l qimmat, tog' juda qimmat, dengiz (faqat qirg'oqdan qirg'oqqa) eng qimmat. Yo'lda qo'shin kamayadi.
7. Hujumda o'yinchi necha qo'shin yuborishni slayder bilan tanlaydi, istalgan vaqtda to'xtata oladi, to'xtagan joygacha egallangan hudud uniki qoladi, qolgan qo'shin qaytadi.
8. Himoyalanuvchi qarshi hujum qilib hududini qaytarib olishi mumkin; chegaralar hech qachon yakuniy emas. Yaqinda yo'qotilgan hududni 2 daqiqa ichida qaytarish arzonroq.
9. Diplomatiya: davlatni bosganda "Ittifoq taklif qilish / Urush e'lon qilish / Xabar yozish" chiqadi. Ittifoq erkin muzokara (chat) orqali tuziladi, shartnoma bandlarini o'yinchilar o'zlari belgilaydi, ikkalasi imzolaydi. Shartnomani buzish mumkin, lekin obro' va qo'shin yo'qotiladi.
10. Urush e'lonsiz to'satdan hujum mumkin, lekin kuchsizroq va obro'ni tushiradi; e'lon qilingan urushda hujum kuchliroq.
11. Mashqlar ikki manbadan: tizim banki va o'yinchilar bir-biriga beradigan topshiriqlar (hujumda himoyalanuvchining lug'ati). O'yinchi bergan mashqni tizim avtomatik tekshiradi (savol beruvchi javobni oldindan kiritadi). Yomon savolga shikoyat tugmasi bor.
12. Mashq matni o'zbekcha, javob inglizcha. Speaking: boshlang'ich darajada inglizcha jumla ko'rsatilib o'qiladi, yuqori darajada o'zbekcha berilib inglizcha aytiladi.
13. Speaking/writing nisbati foydalanuvchi sozlamasi, standart 50/50; mikrofon bo'lmasa faqat writing.
14. O'yin davomida mashqlar alohida ekranga olib chiqmaydi: xarita ustida kichik panel, xarita ko'rinib va ishlab turadi.
15. Rejimlar: Jahon jangi (100 kishigacha, 30 daqiqa, oxirgi tirik qolgan yoki eng katta davlat g'olib), 1v1 duel (10 daqiqa), Guruh jangi (2-4 jamoa), keyinroq Mintaqa xaritalari (Markaziy Osiyo, Kavkaz va h.k.).
16. Qulagan o'yinchi shu xonada qayta boshlay olmaydi, tomoshabin bo'ladi yoki yangi xonaga o'tadi.
17. Tarixiy obyektlar bonus beradi: qal'a himoya +, karvonsaroy qo'shin daromadi +, madrasa mashq balli +.
18. Mehmon rejimi bor (progress saqlanmaydi). Monetizatsiya hali hal qilinmagan.
19. Qo'shimcha: do'stlar va kod bilan xususiy xona; o'qituvchi rejimi (o'qituvchi lug'at yuklaydi, o'quvchilar shu so'zlar bilan o'ynaydi, natijalarni ko'radi); ovozli chat (keyinroq); aldov oldini olish; oflayn rejim botlarga qarshi; ko'p tilga tayyor arxitektura (hozir faqat ingliz tili).
20. Muzokara chati ikkala tilda ruxsat, inglizcha yozgan xabar ball beradi.

## 3. Birinchi o'yin senariysi (18 sahna)

1. Kirish: Google/email/mehmon.
2. Davlat nomi, bayroq rangi, 1 daqiqalik daraja testi (A1/A2/B1), o'tkazib yuborish mumkin.
3. Asosiy menyu: profil (daraja, ball, g'alaba, so'zlar), 4 rejim, lug'atim, do'stlar, reyting.
4. Xona tanlash: ochiq xonalar ro'yxati (odamlar, botlar, vaqt, daraja), "Tez kirish", xususiy xona, o'qituvchi xonasi.
5. Boshlang'ich joy tanlash: dunyo xaritasi, 20 soniya, bo'sh joyga bosish (misol: Samarqand).
6. Kengaytirish writing: "Inglizchaga yozing: Men har kuni ertalab choy ichaman" → to'g'ri → hudud +, ball +, qo'shin +.
7. Kengaytirish speaking: jumlani aytish, 92% aniqlik, Samarqand madrasasi bonusi.
8. Hudud va qo'shin alohida: reytingda ikkala ustun, katta lekin zaif davlat misoli.
9. Qo'shni davlatni bosish: Ittifoq / Urush / Xabar.
10. Ittifoq muzokarasi: chat, shartnoma bandlari, ikki imzo, chegara yashil.
11. Urush e'loni: ittifoqdoshlar birga e'lon qiladi, dushman chegarasi binafsha, yo'lda cho'l va tog' (qo'shin yo'qotishi ko'rsatiladi).
12. Hujum paneli: slayder, yo'l hisobi (yo'qotish %, yetib boradigan qo'shin, taxminiy hudud).
13. Hujum mashqi: raqib tayyorlagan 5 so'z, 4/5 to'g'ri → hujum kuchi 80%, xato so'z lug'atga tushadi.
14. Hujum jarayoni: qo'shin kamayadi, hudud piksel-piksel o'tadi, "To'xtatish" bosiladi, egallangan hudud qoladi.
15. Qarshi hujum: dushman hujum qiladi, ogohlantirish, himoya speaking mashqi, qarshi hujum, hudud qaytariladi.
16. Mag'lubiyat: kichik davlat qulaydi, o'yinchi tomoshabin bo'ladi.
17. Yakun: 30:00, g'olib, natija ekrani (o'rin, hudud, ball, writing/speaking aniqligi, xato so'zlar lug'atga, daraja o'zgarishi).
18. O'qituvchi rejimi va xususiy xona: kod, lug'at yuklash, jonli natijalar jadvali.

## 4. Sendan nima kutaman

Quyidagi tartibda javob ber, o'zbek tilida:

A. **Kuchli tomonlar** (qisqa, 3-5 band).

B. **Muammolar va ziddiyatlar.** Har biri uchun: qaysi qoida yoki sahna, nima uchun muammo, qanday oqibat beradi. Ayniqsa quyidagilarga e'tibor ber:
   - O'yin balansi: mashq bajarish tezligi va hudud o'sishi, qo'shin daromadi, relyef jarimalari, ball ko'paytirgichi, "katta davlat kam qo'shin" holati, 100 kishilik xonada 30 daqiqa yetadimi.
   - Til o'rganish samaradorligi: mashqlar haqiqatan o'rgatadimi, speaking baholash ishonchlimi, o'yinchi bergan mashqlar sifati, darajalar tizimi.
   - UX: xarita ustidagi panel telefonda ishlaydimi, 100 kishilik jonli xonada mashq bajarayotganda hujumga uchrash adolatlimi, diplomatiya chati jonli o'yinda qancha vaqt oladi.
   - Texnik xavf: 100 kishilik real vaqt simulyatsiya, speech recognition aniqligi (o'zbek aksenti), aldov (nusxa ko'chirish, botlar).
   - Suiiste'mol: toksik chat, ittifoq orqali o'yinni buzish, yangi o'yinchilarni ezish.

C. **Olib tashlash kerak bo'lgan narsalar** (birinchi versiyada ortiqcha yoki zararli) va sababi.

D. **Qo'shish kerak bo'lgan narsalar** (eng ko'pi bilan 5 ta, har biri 1-2 jumla, nima uchun).

E. **Senariyga o'zgartirishlar**: qaysi sahnani o'zgartirish, qo'shish, olib tashlash yoki tartibini almashtirish.

F. **Claude uchun tayyor qayta prompt.** Buni alohida kod blokida, o'zbek tilida yoz. Prompt quyidagicha tuzilsin:
   - "Senariyga quyidagi o'zgartirishlarni kirit:" deb boshlansin.
   - Uch bo'lim: O'ZGARTIR (qoida yoki sahna raqami → yangi matn), OLIB TASHLA (nima va nima uchun), QO'SH (nima, qaysi sahnadan keyin).
   - Har band aniq va bajariladigan bo'lsin, umumiy maslahat emas. Masalan "balansni yaxshila" emas, "qoida 3: qo'shin daromadini hudud hajmiga emas, egallangan shaharlar soniga bog'la" kabi.
   - Oxirida "Kod yozma, faqat senariy va qoidalarni yangilab, o'zgargan sahnalarni qayta ko'rsat" degan jumla bo'lsin.

Javobni o'zbek tilida yoz. Maqtov kam, aniq tanqid ko'p bo'lsin.
