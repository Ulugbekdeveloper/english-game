# Imperiya: vizual yo'nalish, sprite ishlab chiqarish va ishlab chiqish arxitekturasi

Sana: 2026-11-06. Bu hujjat "master prompt"ga javob. Har bo'limda avval tasdiqlangan faktlar, keyin tavsiyalar.

---

## 0. Audit: loyihada hozir nima bor (tasdiqlangan faktlar)

| Narsa | Holat |
|---|---|
| O'yin kodi (renderer, xarita, qo'shin modeli, fraksiya modeli, asset yuklash, multiplayer sinxronizatsiya) | **Yo'q.** Hech biri yozilmagan. |
| `apps/app` | Expo SDK 58 bo'sh shablon (`App.tsx` "Open up App.tsx" matni). Expo Router o'rnatilmagan. |
| `apps/server`, `packages/shared` | Faqat `package.json` va `tsconfig.json`, manba kodi yo'q. `ws`, `tsx`, `world-atlas`, `d3-geo` o'rnatilgan. |
| `docs/storyboard/index.html` | 18 sahnali senariy prototipi: 2D canvas, 720×360 katakli (0.5°) dunyo xaritasi, `world-atlas` land-110m dan RLE qilib olingan, 6 relyef sinfi (dengiz, tekislik, o'rmon, cho'l, tog', muz). Bu prototip, o'yin dvigateli emas. |
| `docs/concept/` | Figma AI bilan yaratilgan 5 ta konsept rasm (bo'yalgan atlas uslubi). |
| `docs/design/terrain-faction-plan.md` | Relyef va fraksiya rejasi (oldingi bosqich). |
| Git | Hech narsa commit qilinmagan. |

Xulosa: "mavjud arxitekturani migratsiya qilish" masalasi yo'q, chunki arxitektura hali yo'q. Quyida hamma narsa noldan loyihalanadi. Cheklov: oldin qabul qilingan platforma qarori (Expo/React Native, veb + iOS + Android, Supabase + alohida WebSocket server) saqlanadi.

---

## 1. Yakuniy vizual yo'nalish: tavsiya

**Qabul qilinadi:** bo'yalgan tarixiy atlas xarita + realistik 2D harbiy sprite'lar. Bu yo'nalish texnik va badiiy jihatdan to'g'ri, lekin ikkita aniqlik kiritiladi:

1. **Xarita top-down, sprite'lar 3/4 (soxta izometrik).** Haqiqiy geografiyali dunyo xaritasini chinakam izometrik proyeksiyaga o'tkazib bo'lmaydi (qirg'oqlar buziladi, Blue Marble ma'lumoti to'g'ri to'rtburchak). Shuning uchun xarita tepadan ko'rinadi, qo'shin sprite'lari esa klassik RTS kabi 3/4 burchakdan chizilgan. Age of Empires 2 va Cossacks shunday ishlaydi: tekis yer, 3/4 figuralar. Ko'z buni "izometrik" deb qabul qiladi.
2. **Bitta yorug'lik va bitta palitra.** Xarita va sprite'lar bir o'yinga o'xshashi uchun ikkalasi ham shimoli-g'arbdan tushadigan yorug'lik, bir xil soya rangi (ko'kimtir to'q jigarrang, 35% shaffof) va umumiy 48 rangli "tarixiy" palitradan foydalanadi. Bu qoidasiz rassomlar turli natija beradi.

Muqobil ko'rib chiqildi:

| Variant | Afzallik | Kamchilik | Qaror |
|---|---|---|---|
| To'liq 3D (Total War uslubi) | eng chiroyli | 3D modellar, rigging, mobil ishlash, 50 fraksiya uchun narx 5–10× | rad |
| Piksel-art (16-bit) | arzon, tez | "jiddiy tarixiy" talabga mos emas | rad |
| Bo'yalgan atlas + 2D sprite (tanlangan) | mobil ishlaydi, 2 rassom yetadi, AI konsept oson ulanadi | sprite yo'nalishlari cheklangan | **qabul** |
| Sputnik xarita + 2D sprite | juda aniq geografiya | zamonaviy ko'rinish, tarixiy atmosferaga zid | rad (Blue Marble faqat relyef ma'lumoti manbai sifatida) |

---

## 2. 50 fraksiyaning tarixiy tekshiruvi

O'yin **muqobil tarix olami**: asosiy davr 1370–1500 (Temuriylar davri). Shu davrdan tashqaridagilar "anaxronizm" deb belgilanadi, lekin vizual jihatdan o'z eng kuchli davrining haqiqiy jihoziga tayanadi.

| # | Fraksiya | Davr | Asosiy davrga nisbatan | Vizual asos |
|---|---|---|---|---|
| 1 | Temuriylar | 1370–1507 | mos | lamellyar zirh, kamon, qilich, tug' |
| 2 | Oltin O'rda | 1242–1502 | mos | mo'g'ul-qipchoq otliq kamonchi |
| 3 | Chig'atoy ulusi | 1226–1680 | mos | mo'g'ul otliq, keyinroq turkiy |
| 4 | Saljuqiylar | 1037–1194 | erta (anaxronizm) | turkman otliq, g'ulom |
| 5 | Xorazmshohlar | 1077–1231 | erta | og'ir otliq, qipchoq yollanma |
| 6 | Qoraxoniylar | 840–1212 | erta | turk otliq, qalqonli piyoda |
| 7 | Shayboniylar | 1500–1599 | sal kech | o'zbek otliq, miltiq paydo bo'ladi |
| 8 | Qozoq xonligi | 1465–1847 | mos (boshi) | dasht otliq |
| 9 | Mo'g'ul imperiyasi | 1206–1368 | sal erta | klassik mo'g'ul |
| 10 | Boburiylar | 1526–1857 | kech | fors-turk zirh, fil, to'p |
| 11 | Usmoniylar | 1299–1922 | mos | yanichar, sipohiy |
| 12 | Mamluklar | 1250–1517 | mos | mamluk og'ir otliq |
| 13 | Ayyubiylar | 1171–1260 | erta | kurd-arab otliq |
| 14 | Abbosiylar | 750–1258 | erta | arab-fors piyoda, xuroson otliq |
| 15 | Umaviylar | 661–750 | juda erta | arab yengil otliq |
| 16 | Fotimiylar | 909–1171 | erta | berber va sudan piyoda |
| 17 | Safaviylar | 1501–1736 | sal kech | qizilbosh (qizil bosh kiyim) |
| 18 | Sosoniylar | 224–651 | antik (anaxronizm) | kataphrakt, fil |
| 19 | Angliya | 927–hozir | mos (1400) | longbow, ritsar |
| 20 | Fransiya | 987–hozir | mos (1400) | jandarm, plastinali zirh |
| 21 | Muqaddas Rim | 962–1806 | mos | nemis ritsar, landsknecht keyin |
| 22 | Vizantiya | 330–1453 | mos (so'nggi) | kataphrakt, varang |
| 23 | Polsha-Litva | 1569–1795 | kech (gusar 1570+) | qanotli gusar |
| 24 | Shotlandiya | 843–1707 | mos | schiltron nayzachi |
| 25 | Skandinaviya | viking 793–1066 / qirolliklar | erta (viking) | qalqon devori |
| 26 | Kastiliya | 1065–1715 | mos | jinete yengil otliq, arbalet |
| 27 | Venetsiya | 697–1797 | mos | arbaletchi, dengizchi |
| 28 | Kiyev Rusi | 882–1240 | erta | drujina |
| 29 | Dehli sultonligi | 1206–1526 | mos | turk-afg'on otliq, fil |
| 30 | Vijayanagara | 1336–1646 | mos | fil, piyoda |
| 31 | Chola | 848–1279 | erta | dengiz floti |
| 32 | Rajputlar | 6–19 asr | mos | og'ir otliq, qalqon |
| 33 | Min | 1368–1644 | mos | piyoda, porox |
| 34 | Sin | 1644–1912 | kech (anaxronizm) | manjur bayroq qo'shini |
| 35 | Sengoku Yaponiya | 1467–1615 | mos | samuray, ashigaru |
| 36 | Koryo | 918–1392 | mos (oxiri) | koreys piyoda |
| 37 | Khmer | 802–1431 | mos (oxiri) | fil, nayzachi |
| 38 | Majapahit | 1293–1527 | mos | kris, nayza |
| 39 | Pagan | 849–1297 | erta | fil, kamonchi |
| 40 | Ayutthaya | 1351–1767 | mos | fil, qilich |
| 41 | Dai Viet | 1054–1804 | mos | piyoda, arbalet |
| 42 | Mali | 1230–1670 | mos | mandinka otliq |
| 43 | Songhay | 1464–1591 | mos | otliq, piyoda |
| 44 | Efiopiya (Sulaymoniylar) | 1270–1974 | mos | qalqonli piyoda |
| 45 | Kongo | 1390–1914 | mos | nayza, qalqon |
| 46 | Nubiya (Makuriya) | 6–14 asr | erta | kamonchi |
| 47 | Aztek | 1428–1521 | mos | yaguar/burgut jangchi, makuahuitl |
| 48 | Inka | 1438–1533 | mos | palaxmon, cho'qmor |
| 49 | Maya | klassik 250–900, postklassik 1697 gacha | mos (postklassik) | atlatl, nayza |
| 50 | Mapuche | ispanlar bilan 1540+ | kech | nayza, keyin otliq |

Anaxronizmlar (aniq belgilash kerak): Sosoniylar, Umaviylar, Abbosiylar, Sin, Polsha-Litva gusarlari, Boburiylar, qisman Saljuqiylar, Xorazmshohlar, Qoraxoniylar, Kiyev Rusi, Chola, Vikinglar. Ular o'yinda qoladi, lekin fraksiya kartasida "davr: ..." yozuvi bilan. Vizual tarixiylik: har birlik uchun kamida bitta haqiqiy manba (Osprey nashrlari, muzey eksponatlari, miniatyuralar) ko'rsatiladi; badiiy talqin alohida belgilanadi.

---

## 3. Mintaqaviy vizual oilalar tizimi

Qoida (foydalanuvchi): davlat nomi va bayrog'i erkin, qo'shin ko'rinishi boshlang'ich mintaqadan. 50 fraksiya 18 vizual oilaga guruhlanadi (to'liq jadval `terrain-faction-plan.md` 12-bo'limda). Oila = bitta sprite to'plami. Fraksiya = oila + tarixiy nom + tizim bayrog'i + 1–2 "maxsus birlik" farqi (masalan Angliya longbow, Kastiliya arbalet, bu G'arbiy Yevropa oilasi ichida kamonchi sprite'ining variantlari).

Ishlab chiqarish tartibi: oila A (Turkiy-mo'g'ul, bayroqdor: Temuriylar) va oila B (G'arbiy Yevropa, bayroqdor: Fransiya). Qolgan 16 oila pipeline tasdiqlangach.

---

## 4. Sprite ishlab chiqarish spetsifikatsiyasi

| Parametr | Qaror | Sabab |
|---|---|---|
| Kamera burchagi | yer top-down, figuralar 3/4 ko'rinishda, ko'z balandligi ~35° | haqiqiy geografiya bilan mos, klassik RTS o'qilishi |
| Yo'nalishlar | **4 ko'rsatiladi, 3 chiziladi**: S (ekranga), N (orqa), E; W = E ning ko'zgu aksi | 8 yo'nalish 2× narx beradi, lekin top-down xaritada diagonal harakat 4 ga yaxlitlanganda ko'z sezmaydi. Asimmetrik jihoz (qalqon chap qo'lda) ko'zguda o'ng qo'lga o'tadi, bu qabul qilinadi (AoE2 ham shunday) |
| Manba o'lchami | 512×512 (piyoda ~300 px bo'yi), chizish shu o'lchamda | keyin 256 va 128 ga kichraytiriladi |
| Eksport o'lchamlari | desktop yaqin zoom: 256×256; o'rta zoom va mobil: 128×128; uzoq zoom: 64×64 (saf ikonkasi) | pastda taqqoslash |
| Proporsiya | piyoda 7 bosh balandligida, otliq 256 kanvasda 1.3× piyoda bo'yi | realistik, lekin xaritada o'qiladigan |
| Yorug'lik | shimoli-g'arbdan 45°, iliq | xarita bilan bir xil |
| Soya | alohida umumiy ellips sprite, 35% shaffof to'q jigarrang, figuradan janubi-sharqqa | sprite'da pishirilmaydi, zoomda masshtablanadi |
| Kontur | qattiq qora kontur yo'q; 1 px to'q rim 60% shaffof | realizm, fonga yopishadi |
| Detal | metall, teri, mato uchun umumiy 3 ta material rampasi; fraksiya rangi 2 ta slot (asosiy, ikkilamchi) | izchillik |
| Palitra | umumiy 48 rang + har oila uchun 8 rang | rassomlar farqini yashiradi |
| Fon | shaffof PNG (manba), atlas KTX2 (ASTC/ETC2 mobil) va WebP (veb) | hajm |
| Nomlash | `fam-<oila>/<unit>/<anim>_<dir>.png` atlas + `.json` (TexturePacker formati); kadr `tm_horsearcher_walk_e_07` | avtomatlashtirish |

Rezolyutsiya taqqoslash (bitta birlik, 3 yo'nalish, 41 kadr = 123 kadr):

| O'lcham | Atlas hajmi (123 kadr) | Vizual | Mobil xotira (18 oila × 7 birlik) | Qaror |
|---|---|---|---|---|
| 128×128 | ~2 MB (1 atlas 2048²) | o'rta zoomda yaxshi, yaqinda yumshoq | 250 MB sifatida yuklanmaydi, lazy load bilan ~40 MB | mobil asosiy |
| 256×256 | ~8 MB (4 atlas) | yaqin zoomda detal, zirh ko'rinadi | faqat ko'rinayotgan oilalar | desktop asosiy |
| 512×512 | ~32 MB | ortiqcha, ekranda hech qachon 512 px birlik ko'rinmaydi | yo'q | faqat manba |

Rassomlar va AI referenslar o'rtasida izchillik: (1) har oila uchun 1 betlik "style sheet": palitra, yorug'lik, proporsiya, 3 yo'nalishda bitta etalon birlik; (2) AI rasm faqat referens, sprite emas; (3) har birlik "turnaround" (3 yo'nalish, idle poza) art direktor tasdig'idan o'tadi, keyin animatsiya.

AI'dan sprite'ga ishchi jarayon: AI konsept (Figma AI) → tarixiy manba bilan solishtirish → art direktor tahriri → rassom turnaround chizadi (512, qatlamlar: tana, bosh kiyim, zirh, qurol, qalqon, ot, ot jihozi) → Spine yoki DragonBones'da rig (oilaga bitta piyoda rig, bitta otliq rig) → animatsiya rigdan eksport → TexturePacker atlas → o'yinda tekshirish (3 zoom, 2 platforma).

---

## 5. Ikki bayroqdor fraksiya dizayn varaqlari

### 5.1 Temuriylar (oila A: Turkiy-mo'g'ul)

Palitra: to'q qizil (asosiy), oltin-sariq (ikkilamchi), ko'k ipak detal, qoramtir po'lat. Bayroq: qizil fonda oltin uch halqa (Temur tamg'asi, tarixiy). Ot jihozi: baland egar, tasma bilan bezatilgan, ba'zan ot zirhi (bargustvon).

| Birlik | Rol | Tarixiy manba | Siluet | Kiyim va zirh | Qurol | Sprite / animatsiya |
|---|---|---|---|---|---|---|
| Piyoda (sarbaz) | arzon asos | Temuriy miniatyuralari, Hirot 1430 | uzun chakmon, dumaloq qalqon | kigiz qalpoq yoki dubulg'a, yengil zanjir | qilich, dumaloq qalqon | piyoda rig, 7 anim |
| Nayzachi | himoya | Zafarnoma miniatyuralari | uzun nayza, tik | lamellyar ko'krak, qalpoq | 3 m nayza | piyoda rig, nayza qatlami |
| Kamonchi (piyoda) | masofa | Sheroz miniatyuralari | kamon va sadoq | yengil, chakmon | kompozit kamon | piyoda rig + kamon anim |
| Og'ir otliq | zarba | Temuriy sovutli otliq, 1400 | ot zirhi, uzun nayza | lamellyar + zanjir, konussimon dubulg'a, yuz niqobi | nayza, qilich, qalqon | otliq rig, og'ir variant |
| Otliq kamonchi | asosiy mobil kuch | mo'g'ul-turk an'anasi | yengil, kamon tortgan | charm va lamellyar, mo'yna qalpoq | kompozit kamon, qilich | otliq rig + otda otish anim |
| Maxsus: fil (Dehlidan keyin) yoki naqorachi | ruhlantirish | Temur Dehli yurishi 1398 | fil yoki nog'orali tuya | | | alohida rig (v2) |
| Sarkarda (amir) | belgi | Temuriy amirlari tasviri | oltin dubulg'a, tug' | oltin naqshli zirh, qizil chakmon | qilich | otliq rig, bayroq qatlami |
| Bayroqdor | saf belgisi | tug' (yoqdumli) | baland tug' | | | otliq rig |

### 5.2 Fransiya qirolligi (oila B: G'arbiy Yevropa, 1400 atrofi)

Palitra: ko'k (asosiy), oltin zambaq (ikkilamchi), kumush po'lat, jigarrang teri. Bayroq: ko'k fonda oltin zambaqlar (fleur-de-lis). Ot jihozi: geraldik yopinchiq (caparison), uzun uzangi.

| Birlik | Rol | Tarixiy manba | Siluet | Kiyim va zirh | Qurol | Sprite / animatsiya |
|---|---|---|---|---|---|---|
| Piyoda (sergeant) | asos | 100 yillik urush, 1415 | gambeson, tepalikli dubulg'a | gambeson + zanjir, bascinet | qilich, uchburchak qalqon | piyoda rig |
| Nayzachi (pikeman) | himoya | flamand va fransuz piyodasi | uzun pika | brigandina, kettle hat | pika | piyoda rig, nayza qatlami |
| Arbaletchi (genuez yollanma) | masofa | Kresi 1346 | arbalet, katta pavez qalqon | yengil | arbalet | piyoda rig + arbalet anim |
| Og'ir otliq (jandarm) | zarba | fransuz ritsarlari 1400–1450 | to'liq plastinali, ot yopinchig'i | plastinali zirh, armet | nayza (lance), qilich | otliq rig, og'ir variant |
| Yengil otliq (coustillier) | ta'qib | ritsar hamrohlari | yengilroq, qalqonsiz | brigandina, sallet | nayza, qilich | otliq rig |
| Maxsus: longbow (faqat Angliya variantida) | | | | | | kamonchi varianti |
| Sarkarda (konnetabl) | belgi | konnetabl tasvirlari | tojli dubulg'a, bayroq | oltin naqshli plastina | qilich | otliq rig, bayroq qatlami |
| Bayroqdor | | oriflamma | uzun qizil bayroq | | | otliq rig |

Ikkalasi bir-biridan farq qiladi: A oilasi yengil, egri chiziqlar, mo'yna va ipak, kamon; B oilasi og'ir, tekis plastina, uchburchak qalqon, geraldika.

---

## 6. Animatsiya va yo'nalish matritsasi

| Holat | Kadr | Izoh |
|---|---|---|
| Idle | 6 | nafas, bayroq hilpirashi |
| Walk | 8 | asosiy |
| Run | — | Walk 1.6× tezlikda ijro etiladi |
| Attack | 8 | qurolga qarab: qilich, nayza, kamon alohida |
| Defend | 4 | qalqon ko'tarish, idle dan |
| Hit | 3 | |
| Death | 6 | oxirgi kadr 3 s qoladi, so'ng so'nadi |
| Victory | 6 | faqat sarkarda va 1 ta piyoda (boshqalar idle) |
| Retreat | — | Walk teskari yo'nalishga, bosh pastga (kadr almashmaydi) |

Yo'nalish: 3 chiziladi (S, N, E), W ko'zgu. Jami bir birlik: 41 kadr × 3 = **123 unikal kadr** (kadrma-kadr usulda).

---

## 7. Sprite miqdori va narx hisobi

Birliklar: oila A 7 (piyoda, nayzachi, kamonchi, og'ir otliq, otliq kamonchi, sarkarda, bayroqdor), oila B 7. Jami 14 birlik.

**Usul 1: kadrma-kadr chizish (tavsiya etilmaydi).**
14 birlik × 123 kadr = **1 722 unikal kadr**. Bir kadr 512 px da ~1.5 soat → ~2 600 soat. 2 rassom bilan 8 oy. 50 fraksiya uchun (18 oila × 7) ≈ 15 500 kadr, imkonsiz.

**Usul 2: modulli rig (Spine/DragonBones), tavsiya.**

| Element | Miqdor | Narx |
|---|---|---|
| Rig (skelet + animatsiya) | 2 ta: piyoda, otliq; har biri 7 anim × 3 yo'nalish | 2 × ~60 soat = 120 soat |
| Qurol animatsiya variantlari | qilich, nayza, kamon, arbalet, nayza-otliq, kamon-otliq: 6 × 8 kadr attack × 3 yo'n. | ~80 soat |
| Unikal qism chizish | har birlik ~12 qism (bosh, tana, qo'llar, oyoq, qalqon, qurol, plash, ot tanasi, ot boshi, egar, bayroq) × 3 yo'nalish = 36 chizma; 14 birlik × 36 = **504 chizma** | 504 × 0.75 soat = ~380 soat |
| Qayta rang (fraksiya ranglari) | shader bilan, 0 soat | 0 |
| Umumiy texnik: soya, tanlov halqasi, chang, qon, strelka | 1 to'plam | ~40 soat |
| Atlas, QA | | ~60 soat |
| **Jami 2 oila** | | **~680 soat**, 2 rassom ≈ 2.5 oy |
| Har qo'shimcha oila | ~250 chizma + maxsus birlik rigi | ~220 soat |
| 50 fraksiya (18 oila) | | ~680 + 16 × 220 ≈ **4 200 soat** |

Ajratish: unikal art = 504 chizma; qayta ishlatiladigan animatsiya = rig kadrlari (barcha birliklar); modulli/rangli = fraksiya ranglari shaderda, bayroq qatlami dinamik; umumiy texnik = soya, VFX, UI.

---

## 8. Bayroq konstruktori

**Ma'lumot modeli** (`FlagSpec`, 7 bayt):

```ts
interface FlagSpec {
  bg: { kind: 'solid' | 'split-h' | 'split-v' | 'diag' | 'cross'; c1: PaletteId; c2?: PaletteId };
  pattern?: { id: PatternId; color: PaletteId };   // stripes, chevron, lozenge, girih, knot
  symbol?: { id: SymbolId; color: PaletteId; scale: 0.6 | 0.8 | 1.0 };  // eagle, lion, crescent, sun, star, sword, shield, tamga, tree
}
```

Palitra 16 rang (yuqori kontrastli, tarixiy: qizil, ko'k, yashil, oltin, oq, qora, binafsha, to'q sariq, ...). `c1 ≠ c2`, ramz rangi fon bilan kontrast ≥ 3:1 (avtomatik tekshiriladi, mos kelmasa eng yaqin ruxsat etilgan rang taklif qilinadi).

**UI:** uch tab (Fon, Naqsh, Ramz), chapda jonli ko'rinish uchta o'lchamda: 96 px (profil), 48 px (HUD), 24 px (xaritada saf ustida). 24 px da ramz tanilmasa tizim "soddaroq ramz tanlang" deydi. Tasodifiy tugma. Foydalanuvchi rasm yuklay olmaydi.

**Taqiqlar:** ramz × rang × naqsh kombinatsiyalari uchun qora ro'yxat (ekstremistik va zamonaviy davlat bayroqlariga o'xshash kombinatsiyalar), server tomonida tekshiriladi; shikoyat tugmasi.

**Tarixiy va foydalanuvchi bayroqlari birga:** botlar tizimning tarixiy bayrog'ini ko'taradi; foydalanuvchi davlati o'z `FlagSpec` bayrog'ini ko'taradi, qo'shin ko'rinishi esa mintaqa oilasidan. Bayroq sprite'i alohida qatlam, rig'da "banner" sloti, shuning uchun bitta bayroqdor sprite'i istalgan bayroqni ko'taradi.

---

## 9. Relyef art yo'nalishi

| Relyef | Tekstura | Palitra | O'tish | Harakat narxi (mavjud qoida) |
|---|---|---|---|---|
| Tekislik | quruq o't, dala naqshi, yo'l izlari | sarg'ish-yashil | yumshoq | ×1.0 |
| O'rmon | daraxt tojlari klasterda, soyalar | to'q yashil, jigarrang | o'rmon chekkasi siyraklashadi | ×1.3 |
| Botqoq | nam yer, qamish, suv ko'zlari | zaytun, kulrang-ko'k | | ×1.6 |
| Cho'l | barxan chiziqlari, toshloq, voha | qum, och jigarrang | tekislikka o'tganda chalalik | ×2.0 |
| Tog' | qoyalar, qorli cho'qqilar, vodiylar, shimoliy yonbag'ir soyada | kulrang-jigarrang, oq | tog' etagi | ×2.5 |
| Daryo | chiziq, ko'prik va kechuv belgilari | ko'k-yashil | | kechuv ×1.5, ko'prik ×1.0 |
| Dengiz | chuqurlikka qarab ikki ko'k, qirg'oqda oq ko'pik, portlar | to'q ko'k, firuza | sayoz zona | faqat qirg'oqdan qirg'oqqa |

O'qilishi: harakat narxi tekstura bilan emas, **ikonka bilan** aytiladi: hujum yo'li chizilganda yo'l ustida "×2.0 cho'l" belgilari; relyef paneli raqamlarni ko'rsatadi. Egalik: 28% shaffof rang, 1.5 px shovqinli chegara, hudud ichida tekstura ko'rinadi.

**Relyef paneli** (katakka bosilganda, 280×160 px, HUD burchagida): nomi ("Qoraqum cho'li"), relyef ikonkasi, harakat ×2.0, himoya +0%, hujum narxi −25%, egasi (bayroq + nom + munosabat), strategik: eng yaqin shahar va bonusi, daryo kechuvi bormi.

---

## 10. Kamera va sprite rendering spetsifikatsiyasi

- Kamera: top-down xarita, zoom 0–6, pan. Sprite'lar ekranga nisbatan tik (billboard), 3/4 ko'rinish.
- Sprite yo'nalishi: harakat vektori 4 sektorga yaxlitlanadi; sektor almashganda 120 ms gisterezis (titrash yo'q).
- Saf joylashuvi: shablonlar (3, 9, 24 birlik), qator oralig'i 0.55 sprite bo'yi, ustun 0.45 eni; diagonal joylashuv (shaxmat) ustma-ust tushishni kamaytiradi.
- Chuqurlik tartibi: `y` (ekran) bo'yicha, keyin `x`; bitta saf bitta "batch" ichida tartiblangan.
- Yopilish: tog' cho'qqisi va shahar ikonkasi sprite'lardan baland emas (hamma narsa yerga yopishgan), shuning uchun yopilish faqat sprite–sprite.
- Soya: umumiy ellips, janubi-sharqqa, 35%.
- Tanlov: saf ostida fraksiya rangida halqa + raqam belgisi.
- Harakat: saf yo'l bo'ylab ustun bo'lib yuradi, har birlikka tasodifiy 0–200 ms kechikish (jonli ko'rinish).
- Hujum: chegarada ikki saf yuzma-yuz, attack anim, chang VFX, strelka hujum yo'nalishi; himoya tomon defend anim.
- Chekinish: retreat anim orqaga, 2 s davomida 70% shaffof.

Zoom darajalari:

| Zoom | Saf ko'rinishi | Sprite o'lchami | Narx |
|---|---|---|---|
| Uzoq (0–1) | 1 ta bayroq ikonkasi + raqam, animatsiya yo'q | 64 | eng kam |
| O'rta (2–3) | 3–9 sprite, idle/walk 6 fps | 128 | kam |
| Yaqin (4–6) | 24 gacha sprite, to'liq anim 12 fps | 256 (desktop) / 128 (mobil) | o'rtacha |

Qo'shin hajmi: minglab askar chizilmaydi. 1 saf = 24 sprite maksimum; qo'shin soni raqam bilan, saf soni 4 pog'onada (3 / 9 / 2×9 / 3×24 sprite).

---

## 11. Asset papka tuzilmasi

```
assets/
  map/
    tiles/{z}/{x}/{y}.webp        # bo'yalgan atlas plitkalari
    terrain-data/terrain.bin      # 2880×1440 uint8 relyef sinfi
    terrain-data/rivers.json
    cities.json                   # tarixiy shaharlar, obyektlar
  families/
    turkic-mongol/
      style-sheet.png
      rigs/infantry.json, cavalry.json
      units/<unit>/atlas_{128,256}.ktx2|webp + atlas.json
    west-european/...
  factions/
    <id>.json                     # nom, davr, oila, bayroq, maxsus birlik
    banners/<id>.webp
  flags/
    patterns/*.svg, symbols/*.svg, palette.json, blocklist.json
  vfx/dust, clash, arrows, blood
  ui/icons, fonts(msdf)
```

---

## 12. Ma'lumot modeli (TypeScript, `packages/shared`)

```ts
export type FamilyId = 'turkic-mongol' | 'west-european' | /* ...16 ta */ string;
export type UnitRole = 'infantry' | 'spearman' | 'archer' | 'heavy-infantry' | 'cavalry' | 'horse-archer' | 'special' | 'commander' | 'banner';
export type TerrainType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; // sea, plains, forest, desert, mountain, ice, swamp, river

export interface VisualFamily { id: FamilyId; nameUz: string; palette: string[]; rigs: { infantry: string; cavalry: string }; units: UnitDef[]; formationTemplates: FormationTemplate[]; }
export interface UnitDef { id: string; role: UnitRole; rig: 'infantry' | 'cavalry'; atlas: { s128: string; s256: string }; anims: Record<AnimName, AnimDef>; weapon: 'sword' | 'spear' | 'bow' | 'crossbow' | 'lance' | 'mace'; historicalNote: string; artisticInterpretation?: string; }
export type AnimName = 'idle' | 'walk' | 'attack' | 'defend' | 'hit' | 'death' | 'victory';
export interface AnimDef { frames: number; fps: number; dirs: 3; loop: boolean; }
export interface FormationTemplate { minArmy: number; rows: number; cols: number; spacing: [number, number]; roleMix: Partial<Record<UnitRole, number>>; }

export interface FactionConfig { id: string; nameUz: string; period: [number, number]; anachronism: boolean; family: FamilyId; banner: string; color: string; specialUnit?: string; homeCity: string; }
export interface FlagSpec { bg: { kind: 'solid' | 'split-h' | 'split-v' | 'diag' | 'cross'; c1: number; c2?: number }; pattern?: { id: string; color: number }; symbol?: { id: string; color: number; scale: number }; }

export interface PlayerState { id: string; name: string; flag: FlagSpec | { faction: string }; family: FamilyId; cells: number; army: number; score: number; lastCaptureAt: number; }
export interface ArmyGroup { id: string; owner: string; from: Cell; to: Cell; troops: number; progress: number; state: 'march' | 'fight' | 'retreat'; } // server
export interface TerrainInfo { type: TerrainType; nameUz: string; moveCost: number; defenseBonus: number; attackLoss: number; }
```

Klient `ArmyGroup` dan saf sprite'larini, animatsiya kadrini va yo'nalishni o'zi hisoblaydi.

---

## 13. Rendering arxitekturasi

Oldingi rejadagi qatlamli expo-gl sahna saqlanadi: (1) relyef plitkalari, (2) egalik teksturasi + chegara shaderi, (3) qo'shin sprite'lari (instanced quad, atlas), (4) VFX, (5) belgilar (MSDF matn), (6) HUD React Native. Qo'shimcha modullar:

- `FactionRegistry` (JSON yuklaydi), `UnitLibrary` (atlas + anim meta), `SpriteBatcher` (bitta draw call har atlas uchun), `AnimationClock` (kadr = floor(t × fps) % frames, klient), `FormationLayout` (shablon → birlik offsetlari), `FlagRenderer` (FlagSpec → 64×64 tekstura, kesh), `TerrainLayer`, `TerritoryLayer`, `AssetLoader` (lazy, oilaga qarab), `ZoomPolicy` (LOD).

Migratsiya kerak emas: mavjud kod yo'q. Senariy prototipi (2D canvas) saqlanadi faqat hujjat sifatida.

---

## 14. Ishlash va multiplayer

Server avtoritar: egalik to'ri, o'yinchi holati (hudud, qo'shin, ball, taymer), `ArmyGroup` (qayerdan, qayerga, nechta, progress), diplomatiya, mashq natijalari. Server **yubormaydi**: animatsiya kadrlari, sprite pozitsiyalari, VFX. Klient `ArmyGroup` progressidan saf joyini interpolyatsiya qiladi (100 ms tick, 200 ms kechikish buferi).

Optimallashtirish: atlas 2048², KTX2 (ASTC mobil, ETC2 eski Android), WebP veb; faqat ko'rinayotgan oilalar atlaslari yuklanadi (xonada odatda 5–8 oila); viewport culling; LOD zoomga qarab; sprite animatsiya 12 fps (yaqin), 6 fps (o'rta), 0 (uzoq); mobil: 30 fps cheklov, fon rejimida 0; xotira byudjeti mobil 120 MB tekstura; egalik delta paketlari (katak indeksi + egasi, binar), sekundiga ≤ 10 paket.

---

## 15. Asset yaratish ishchi jarayoni

1. Tarixiy referens to'plami (fraksiya uchun 10–20 rasm, manba bilan) → `docs/references/<faction>/`.
2. AI konsept (Figma AI): 3 yo'nalishli turnaround so'rovi, uslub varag'i prompt'i bilan.
3. Art direktor tahriri: tarixiylik, siluet, palitra.
4. Rassom: 512 px qismlar (qatlamlar), 3 yo'nalish.
5. Rig va animatsiya (Spine), eksport 256 va 128 kadrlar.
6. TexturePacker → atlas + json; KTX2 konvertatsiya.
7. O'yinda ko'rish: 3 zoom, desktop va telefon, kontrast tekshiruvi.
8. Tasdiq, `families/<id>` ga joylash, CHANGELOG.

---

## 16. Ishlab chiqish yo'l xaritasi

| Bosqich | Mazmun | Davomiyligi |
|---|---|---|
| 0 | Shared modellar, fraksiya va oila JSON, bayroq konstruktori (UI + renderer) | 2 hafta |
| 1 | Relyef ma'lumot generatori, Blue Marble asosida plitka piramidasi (badiiy ishlovsiz), expo-gl xarita + egalik shaderi, kamera | 4 hafta |
| 2 | O'yin serveri: xona, egalik, qo'shin, mashq, diplomatiya; klient HUD | 6 hafta (parallel) |
| 3 | Sprite pipeline: 2 rig, oila A va B (14 birlik), saf va LOD, jang vizuallari | 10 hafta (rassomlar parallel) |
| 4 | Xarita badiiy ishlovi (atlas uslubi), relyef paneli, shahar obyektlari | 6 hafta |
| 5 | Qolgan 16 oila (har biri ~5 hafta rassom vaqti), fraksiya kartalari | davomiy |

---

## 17. Xavflar va yechimlar

| Xavf | Yechim |
|---|---|
| Sprite ishlab chiqarish narxi | modulli rig, 2 oila bilan tasdiqlash, oila ichida variantlar |
| Rassomlar uslubi farqlanadi | style sheet, umumiy palitra, art direktor tasdig'i, etalon birlik |
| AI rasmlar tarixan noto'g'ri | har birlik uchun manba majburiy, talqin belgilanadi |
| Mobil ishlash (100 o'yinchi, ko'p saf) | LOD, culling, atlas lazy load, 30 fps cheklov |
| Anaxronizm shikoyatlari | fraksiya kartasida davr, "muqobil tarix" yozuvi |
| Bayroq suiiste'moli | tayyor assetlar, qora ro'yxat, shikoyat |
| expo-gl veb va mobil farqi | bitta GL kod, MSDF matn, erta ikki platformada test |
| Google Maps/sputnik litsenziya | faqat Blue Marble, Natural Earth (public domain) |

## 18. Hujum nishoni qoidasi (foydalanuvchi, 2026-11-06)

- O'yinchi boshqa davlatga hujum qilish uchun o'sha davlat hududiga sichqoncha yoki barmoq bilan bosadi; hujum paneli shu davlat uchun ochiladi.
- Hujum faqat chegaradosh davlatga mumkin: **quruqlik chegarasi** (kataklar yonma-yon) yoki **suv chegarasi** (ikkala davlatning qirg'og'i bitta dengiz/ko'l havzasida va qirg'oqdan qirg'oqqa masofa belgilangan chegaradan oshmaydi).
- Chegaradosh bo'lmagan davlatga bosilganda panel ochilmaydi, qisqa izoh chiqadi: "Chegaradosh emas: quruqlik yoki dengiz orqali chegara kerak" va xaritada qaysi davlatlarga hujum mumkinligi yoritiladi.
- Suv orqali hujum: qo'shin qirg'oqdan qirg'oqqa boradi, masofaga qarab yo'qotish oshadi (relyef jadvali, "dengiz" qatori). Hujum nishoni dushmanning qirg'oq kataklari bo'ladi.
- Texnik: server har o'yinchi uchun "qo'shni davlatlar" to'plamini saqlaydi (quruqlik qo'shnilari egalik to'ridan, suv qo'shnilari qirg'oq kataklari va havza identifikatori orqali), hujum so'rovi shu to'plam bilan tekshiriladi. Klient bosilgan katakning egasini aniqlab, qo'shnilik holatiga qarab panel yoki izoh ko'rsatadi.
