# Imperiya

Ingliz tilini o'rganish uchun territorial.io uslubidagi jonli, ko'p o'yinchili tarixiy strategiya. Hudud speaking va writing mashqlari bilan kengayadi; qo'shin daromadi kengayishga bog'liq; hujumda relyef va chegaradoshlik (quruqlik yoki dengiz) hisobga olinadi; ittifoq va urush diplomatiyasi; botlar xaritani to'ldiradi.

## Tuzilma

| Papka | Nima |
|---|---|
| `packages/shared` | Umumiy TypeScript: xarita to'ri (1440×720, 0.25°), relyef ma'lumoti, o'yin qoidalari, baholash, protokol, mashqlar banki, fraksiya oilalari, bayroq konstruktori |
| `apps/server` | Node.js + WebSocket o'yin serveri (xonalar, simulyatsiya, hujum frontlari, diplomatiya, botlar) |
| `apps/app` | Expo / React Native ilova (veb, iOS, Android): WebGL xarita, HUD, mashq paneli, hujum va diplomatiya panellari |
| `docs/` | Senariy prototipi, konsept rasmlar, dizayn va ishlab chiqarish rejalari |

## Ishga tushirish

```bash
npm install
```

Server (port 8787):

```bash
npm run server
```

Veb ilova (port 8081):

```bash
npm run web
```

Telefonda (Expo Go): `cd apps/app && npx expo start`, keyin QR kodni skanerlang. Ilova server manzilini Expo dev host IP'sidan o'zi topadi; boshqa manzil kerak bo'lsa `EXPO_PUBLIC_SERVER_URL=ws://IP:8787` bering yoki lobbida kiriting.

Xarita ma'lumotini qayta yaratish (Natural Earth 50m, public domain):

```bash
npm run map
```

Tiplarni tekshirish:

```bash
npm run typecheck
```

Server smoke testlari: `cd apps/server && npx tsx tools/smoke.ts` va `npx tsx tools/smoke-attack.ts` (server ishlab turganda).

## O'yin qoidalari (qisqa)

- Bo'sh hudud: faqat mashq. Dushman hududi: mashq + qo'shin.
- Qo'shin daromadi/min = √hudud × ko'paytirgich: oxirgi haqiqiy egallashdan 0–30 s 100%, 30–60 s 50%, keyin 0%. Himoya va qaytarib olish taymerni yangilamaydi.
- Har to'g'ri mashq: +10 ball, +5 qo'shin (learning bonus). Ball oshgani sari bitta javob ko'proq hudud beradi.
- Hujum faqat chegaradosh davlatga (quruqlik, yoki 1500 km gacha dengiz orqali). Relyef narxi: tekislik < o'rmon < cho'l < tog'; dengiz masofaga qarab.
- Urush e'lonsiz hujum: kuch ×0.7, obro' −10. Ittifoqdoshga hujum qilib bo'lmaydi; shartnomani buzish obro' −25, qo'shin −20%.
- Qo'shin ko'rinishi (madaniyati) boshlang'ich mintaqadan; nom va bayroq foydalanuvchiniki.
- 30 daqiqa yoki oxirgi tirik qolgan; eng katta davlat g'olib.

## Hali yo'q (keyingi bosqichlar)

Bo'yalgan relyef plitkalari va fraksiya sprite'lari (three.js qatlami), Supabase auth va progress, o'yinchi bergan mashqlar, 1v1 va guruh rejimlari, o'qituvchi xonasi, mobil speech recognition (dev build), xona ichida qayta ulanish.
