# Relyef va fraksiya vizual tizimi: dizayn va texnik reja

Holat (2026-11-06): loyihada hali o'yin kodi yo'q. Bor narsa: bo'sh monorepo skeleti (Expo ilova shabloni, server va shared paketlar), 18 sahnali senariy prototipi (`docs/storyboard/index.html`, 2D canvas, 0.5° katakli xarita) va 5 ta konsept rasm (`docs/concept/`). Shuning uchun "mavjud renderer"ni tekshirish o'rniga arxitektura noldan taklif qilinadi. Prototipdagi 2D canvas yondashuvi bo'yalgan relyef va fraksiya qo'shinlari uchun yetarli emas, u faqat senariyni ko'rsatish uchun edi.

## 1. Art yo'nalishi

Premium tarixiy strategiya: Total War / Age of Empires / Crusader Kings darajasi. Realistik relyef, tabiiy yorug'lik, tarixiy qurol-aslaha, bosiq ranglar. Karikatura, emoji qo'shin, yorqin bolalarcha ranglar, fantastik mavjudotlar, haddan tashqari bezakli UI yo'q. HUD ixcham, to'q rangli, xarita asosiy element.

## 2. Qatlamli renderer (bitta WebGL sahna, expo-gl)

Barcha platformalar (veb, iOS, Android) uchun bitta renderer: expo-gl ustida qatlamli 2D WebGL sahna. HUD esa React Native View'larda, GL ustida.

| Qatlam | Nima | Qayerdan | Yangilanish |
|---|---|---|---|
| 1. Relyef tasviri | Bo'yalgan xarita plitkalari (tile pyramid, zoom 0..6, webp) | Oflayn tayyorlanadi: NASA Blue Marble (public domain) + relyef soyalash + badiiy ishlov (tog' cho'qqilari, cho'l barxanlari, o'rmon teksturasi, daryo va ko'priklar) | Statik, CDN'dan yuklanadi |
| 2. Relyef ma'lumoti | 2880×1440 katak (1/8°), har katakka tur: tekislik, cho'l, tog', o'rmon, botqoq, daryo, dengiz | Natural Earth + relyef balandligi + daryo chiziqlari, oflayn skript | Statik, o'yin qoidalari (harakat narxi, himoya) shundan o'qiladi |
| 3. Hudud egaligi | Katak → egasi (uint16) tekstura; shader yarim shaffof fraksiya rangi va "qo'lda chizilgan" chegarani (qo'shni taqqoslash + shovqin) chizadi | Serverdan delta paketlar | Real vaqt, faqat o'zgargan kataklar |
| 4. Qo'shinlar | Instanced sprite'lar: fraksiya atlaslari, saf shablonlari, LOD | Fraksiya konfiguratsiyasi (JSON) | Server holati bo'yicha interpolatsiya |
| 5. Belgilar va yozuvlar | Shaharlar (madrasa, qal'a, karvonsaroy), davlat nomlari, relyef nomlari (SDF matn) | Statik ro'yxat + holat | Zoomga qarab ko'rinadi |
| 6. HUD | Resurs paneli, daromad indikatori, mashq paneli, hujum/diplomatiya | React Native | UI holati |

Relyef "rangli ko'pburchak" bo'lmaydi: ko'rinish tayyor bo'yalgan plitkalardan, mantiq esa alohida katak ma'lumotidan keladi. Ikkalasi bitta koordinata tizimida (teng to'rtburchak proyeksiya, lon/lat → katak).

## 3. Relyef turlari

| Tur | Ko'rinish | Harakat narxi | Himoya bonusi | Hujum narxi (qo'shin yo'qotish) |
|---|---|---|---|---|
| Tekislik | ochiq o'tloq, quruq o't | ×1.0 | 0% | kam |
| O'rmon | zich daraxtlar | ×1.3 | +10% | o'rtacha |
| Botqoq | nam yer, qamish | ×1.6 | +5% | o'rtacha |
| Cho'l | barxanlar, toshloq, vohalar | ×2.0 | 0% | ko'p (−25%) |
| Tog' | qoyalar, qorli cho'qqilar, vodiylar | ×2.5 | +25% | juda ko'p (−40%) |
| Daryo | tabiiy daryo, ko'prik, kechuv | kechuvda ×1.5, ko'prikda ×1.0 | daryo orti +15% | kechuvda −10% |
| Dengiz | chuqur suv, qirg'oq, portlar | faqat qirg'oqdan qirg'oqqa | 0% | eng ko'p, masofaga qarab |

Qiymatlar senariyda kelishilgan qoidalarga mos (cho'l −25%, tog' −15..−40%); aniq raqamlar balans bosqichida sozlanadi. Yangi mexanika qo'shilmaydi.

## 4. Fraksiya vizual tizimi

Har fraksiya `factions/<id>.json`: nomi (o'zbekcha), hudud rangi, bayroq, sprite atlas, saf shablonlari, birlik tarkibi, tarixiy poytaxt, harakat uslubi.

| Fraksiya | Siluet va jihoz | Saf | Bayroq |
|---|---|---|---|
| Temuriylar | Markaziy Osiyo otliq kamonchilari, lamellyar zirh, dubulg'a, qisqa kamon | keng otliq yoy | qizil, uch oy/sher |
| Yevropa qirolliklari | plastinali va zanjirli zirhli ritsarlar, qilich, qalqon, nayza | zich piyoda qator + og'ir otliq | geraldik tamg'a |
| Misr mamluklari | mamluk otliqlari, uzun ko'ylak ustidan zirh, nayza va kamon | otliq qatorlar | sariq-qora |
| Arab sultonliklari | cho'l otliqlari, yengil zirh, egri qilich, uzun libos | tarqoq tez otliq | yashil/oq |
| Usmoniylar | yanicharlar (oq bosh kiyim, miltiq/kamon), sipohiylar | zich piyoda markaz, otliq qanotlar | qizil, oy-yulduz |
| Oltin O'rda | dasht otliq kamonchilari, mo'yna, qalpoq, qisqa kamon | yoysimon keng otliq | ko'k-oltin tug' |

Har fraksiya uchun 4 birlik turi (piyoda, otliq, kamonchi, sarkarda) + bayroqdor, 4 yo'nalish, idle/yurish/jang holatlari, 2 LOD. Rang almashtirish bilan emas, siluet va jihoz bilan farqlanadi.

## 5. Qo'shin hajmini ko'rsatish

| Qo'shin | Xaritada |
|---|---|
| < 50 | 3 ta askar |
| 50–200 | bitta saf (9 sprite) + kichik bayroq |
| 200–800 | 2–3 saf, otliq bilan |
| > 800 | bir necha saf, bayroqlar, sarkarda |

Har safning yonida raqamli belgi (fraksiya rangida). Jangda: hujum ustuni yo'l bo'ylab yuradi, chegarada to'qnashuv animatsiyasi (chang, qisqa yorug'lik), yo'nalish strelkasi hujum va himoya tomonini ko'rsatadi, xarita o'qiladigan qoladi.

## 6. Hudud chegaralari

Fraksiya rangi 25–35% shaffoflik bilan relyef ustida, chegara 1.5–2 px, shovqin bilan "qo'lda chizilgan" ko'rinish. Siz: qizil, ittifoq: yashil, urush: binafsha, boshqalar: o'z rangi. Chegara hujumda qizil yonadi (shader parametri).

## 7. Zoom darajalari

| Zoom | Relyef | Qo'shin | Yozuvlar |
|---|---|---|---|
| 0–1 (dunyo) | plitka 0–1 | yo'q, faqat davlat rangi | davlat nomlari |
| 2–3 (mintaqa) | plitka 2–3 | bitta bayroq + raqam | davlat, yirik shahar, relyef nomlari |
| 4–5 (mahalliy) | plitka 4–5, daryo va ko'priklar | to'liq saflar, yurish | shaharlar, kataklar |
| 6 (jang) | plitka 6 | to'liq animatsiya | hammasi |

Mobil: bir pog'ona kamroq detal, UI qatlamlari kam, zoom-ga bog'liq detal; boshqaruv bir qo'lda.

## 8. Relyef tanlash paneli

Katakka bosilganda ixcham panel: relyef nomi (masalan "Qoraqum cho'li"), harakat narxi (×2.0), himoya bonusi (0%), hujum narxi (−25% qo'shin), egasi, strategik ma'lumot (yaqin shahar bonusi, daryo kechuvi, ittifoq/urush holati). Qiymatlar 3-bo'limdagi jadvaldan, yangi mexanika yo'q.

## 9. Texnik cheklovlar va xavflar

- expo-gl veb va mobil'da ishlaydi, lekin GL ichida matn uchun SDF shrift atlasi kerak (oddiy matn yo'q).
- 100 kishilik xona: hudud yangilanishi delta paketlar bilan, to'liq teksturani qayta yuklamaslik.
- Arzon Android: plitka piramidasi + LOD + instanced sprite'lar majburiy; 1/8° to'r (4 mln katak) GPU'da uint16 tekstura sifatida 8 MB, qabul qilinadi.
- Asset ishlab chiqarish eng katta xarajat: 6 fraksiya × 5 birlik × holatlar. Yo'l: AI bilan konsept, keyin rassom sprite atlaslari; yoki avval 2 fraksiya (Temuriylar, Yevropa) bilan boshlash.
- Litsenziya: Blue Marble va Natural Earth public domain; Google sputnik plitkalari ishlatilmaydi.

## 10. Asset ro'yxati

Relyef plitka piramidasi (7 zoom), 7 relyef teksturasi, daryo/ko'prik/kechuv sprite'lari, port belgisi; 6 fraksiya × (piyoda, otliq, kamonchi, sarkarda, bayroqdor) × 4 yo'nalish × 3 holat × 2 LOD; jang VFX (chang, to'qnashuv, o'q yomg'iri); shahar belgilari (madrasa, qal'a, karvonsaroy, port); fraksiya bayroqlari va gerblari; HUD ikonkalari (qalqon, qilich, kitob, soat, mikrofon); SDF shriftlar (Cinzel, Source Sans 3).

## 11. Bosqichlar

1. Relyef ma'lumot generatori (Natural Earth + relyef) va plitka piramidasi (Blue Marble asosida, badiiy ishlovsiz).
2. expo-gl renderer: relyef plitkalari + hudud shaderi + kamera/zoom.
3. Fraksiya konfiguratsiyasi va 2 fraksiya sprite'lari, saf shablonlari, LOD.
4. Relyef paneli, chegara effektlari, jang animatsiyasi.
5. Badiiy ishlov: plitkalarni bo'yalgan ko'rinishga keltirish, qolgan 4 fraksiya.

## 12. Mintaqa → qo'shin madaniyati (foydalanuvchi qoidasi, 2026-11-06)

Foydalanuvchi davlatiga istalgan nom va istalgan bayroq tanlaydi. Qo'shin ko'rinishi esa faqat u boshlagan mintaqadan kelib chiqadi: xarita mintaqalarga bo'lingan, har mintaqa bitta "qo'shin madaniyati" (sprite to'plami) ga bog'langan. O'yinchi keyin boshqa mintaqalarni egallasa ham, qo'shin ko'rinishi boshlang'ich mintaqaniki bo'lib qoladi (birinchi versiyada).

Asset xarajatini boshqarish uchun 50 ta tarixiy fraksiya 18 ta vizual to'plamga guruhlanadi; bir to'plam ichidagi fraksiyalar bayroq va ranglar bilan emas, tarixiy nom va mintaqa bilan farqlanadi, vizual jihatdan bir xil sprite'lardan foydalanadi.

| Vizual to'plam | Mintaqa (xaritada) | Fraksiyalar (ChatGPT ro'yxatidan) | Birliklar |
|---|---|---|---|
| Turkiy-mo'g'ul dasht otliqlari | Movarounnahr, Dashti Qipchoq, Yettisuv | Temuriylar, Oltin O'rda, Chig'atoy ulusi, Xorazmshohlar, Qoraxoniylar, Shayboniylar | otliq kamonchi, lamellyar zirhli og'ir otliq, nayzachi, tug' |
| Saljuqiy-turkman | Anadolu sharqi, Xuroson | Saljuqiylar | turk otliq, sipohiy |
| Usmoniy | Anadolu g'arbi, Bolqon | Usmonli imperiyasi | yanichar, sipohiy, to'p |
| Mamluk | Misr, Shom | Mamluk sultonligi, Ayyubiylar, Fotimiylar | og'ir mamluk otliq, kamonchi |
| Arab-xalifalik | Arabiston, Iroq | Abbosiylar, Umaviylar | yengil cho'l otliq, nayzachi |
| Fors | Eron | Safaviylar, Sosoniylar | qizilbosh otliq, kataphrakt, fil (Sosoniy) |
| G'arbiy Yevropa ritsarlari | Fransiya, Angliya, Ispaniya, Germaniya | Angliya, Fransiya, Muqaddas Rim, Kastiliya | ritsar, longbow (Angliya), arbalet (Kastiliya) |
| Vizantiya | Bolqon, Anadolu g'arbi (erta davr) | Vizantiya | kataphrakt, Varang gvardiyasi |
| Sharqiy Yevropa | Polsha, Litva, Rus | Polsha-Litva, Kiyev Rusi | qanotli gusar, drujina |
| Shimoliy Yevropa | Skandinaviya, Shotlandiya | Skandinaviya, Shotlandiya | qalqon devori, highland jangchi |
| O'rta yer dengizi | Italiya | Venetsiya | dengizchi, arbaletchi, yollanma |
| Hind | Shimoliy va janubiy Hindiston | Dehli sultonligi, Vijayanagara, Chola, Rajput | urush fili, otliq, kamonchi, flot (Chola) |
| Xitoy | Xitoy | Min, Sin | piyoda, kamonchi, poroxli qurol, manjur otliq |
| Yapon-koreys | Yaponiya, Koreya | Sengoku Yaponiya, Koryo | samuray, ashigaru, koreys piyoda |
| Janubi-sharqiy Osiyo | Hindixitoy, Indoneziya | Khmer, Majapahit, Pagan, Ayutthaya, (41-fraksiya) | urush fili, nayzachi, kris |
| G'arbiy Afrika | Sahel | Mali, Songhay | mandinka otliq, nayzachi |
| Sharqiy va markaziy Afrika | Habashiston, Kongo | Efiopiya, Kongo | qalqonli piyoda, kamonchi |
| Amerika | Mesoamerika, And, Chili | Aztek, Inka, Maya, Mapuche | burgut/yaguar jangchi, palaxmon, atlatl |

Ro'yxatda 8–10, 41 va 46-raqamli fraksiyalar skrinshotlarda ko'rinmadi; ular kelganda mos to'plamga qo'shiladi.

Har fraksiya uchun 6 vizual element saqlanadi: askar modeli, otliq modeli, bayroq (tizim bayrog'i, foydalanuvchi o'z bayrog'ini tanlasa shu o'rniga chiqadi), saf shakli, qal'a/shahar uslubi, sarkarda. Birlik turlari: piyoda, otliq, kamonchi, og'ir birlik, sarkarda, maxsus birlik (fil, artilleriya, flot).

Davr haqida eslatma: ro'yxatdagi ayrim fraksiyalar o'rta asrlardan tashqarida (Sosoniylar antik, Polsha gusarlari va Sin sulolasi 17-asr). O'yin "umumiy o'rta asrlar" bo'lgani uchun ular nom va ko'rinish sifatida qoladi, lekin aniq yil ko'rsatilmaydi.
