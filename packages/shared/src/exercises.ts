// Exercise bank (v1). Prompt in Uzbek, answer in English. Levels A1, A2, B1.
export type ExerciseKind = 'translate' | 'word' | 'fill' | 'speak';
export type Level = 'A1' | 'A2' | 'B1';
export interface ExerciseItem { id: string; level: Level; kind: ExerciseKind; promptUz: string; display?: string; accepted: string[] }

const T = (id: string, level: Level, uz: string, ...en: string[]): ExerciseItem => ({ id, level, kind: 'translate', promptUz: uz, accepted: en });
const Wd = (id: string, level: Level, uz: string, ...en: string[]): ExerciseItem => ({ id, level, kind: 'word', promptUz: uz, accepted: en });
const F = (id: string, level: Level, display: string, uz: string, ...en: string[]): ExerciseItem => ({ id, level, kind: 'fill', promptUz: uz, display, accepted: en });
const S = (id: string, level: Level, en: string, uz: string): ExerciseItem => ({ id, level, kind: 'speak', promptUz: uz, display: en, accepted: [en] });

export const EXERCISES: ExerciseItem[] = [
  // A1 words
  Wd('w1', 'A1', "qal'a", 'castle', 'fortress'), Wd('w2', 'A1', 'daryo', 'river'), Wd('w3', 'A1', "tog'", 'mountain'), Wd('w4', 'A1', "cho'l", 'desert'),
  Wd('w5', 'A1', 'dengiz', 'sea'), Wd('w6', 'A1', "o'rmon", 'forest'), Wd('w7', 'A1', 'shahar', 'city', 'town'), Wd('w8', 'A1', "ko'prik", 'bridge'),
  Wd('w9', 'A1', 'savdogar', 'merchant', 'trader'), Wd('w10', 'A1', 'askar', 'soldier'), Wd('w11', 'A1', 'ot', 'horse'), Wd('w12', 'A1', 'qilich', 'sword'),
  Wd('w13', 'A2', 'shartnoma', 'treaty', 'agreement', 'contract'), Wd('w14', 'A2', 'ittifoq', 'alliance'), Wd('w15', 'A2', 'chegara', 'border'), Wd('w16', 'A2', 'hudud', 'territory'),
  Wd('w17', 'A2', 'karvon', 'caravan'), Wd('w18', 'A2', 'qalqon', 'shield'), Wd('w19', 'A2', 'kamon', 'bow'), Wd('w20', 'B1', 'muzokara', 'negotiation', 'negotiations'),
  Wd('w21', 'B1', 'hukmdor', 'ruler'), Wd('w22', 'B1', 'xazina', 'treasury', 'treasure'), Wd('w23', 'B1', 'elchi', 'ambassador', 'envoy'), Wd('w24', 'B1', 'qamal', 'siege'),
  // A1 sentences
  T('t1', 'A1', 'Men har kuni ertalab choy ichaman.', 'I drink tea every morning', 'Every morning I drink tea'),
  T('t2', 'A1', 'Bozor shahar markazida.', 'The market is in the city center', 'The market is in the city centre'),
  T('t3', 'A1', 'Bu mening otim.', 'This is my horse'),
  T('t4', 'A1', 'Daryo juda uzun.', 'The river is very long'),
  T('t5', 'A1', 'Biz shaharda yashaymiz.', 'We live in the city', 'We live in a city'),
  T('t6', 'A1', 'Savdogarlar bozorga boradi.', 'The merchants go to the market', 'Merchants go to the market'),
  T('t7', 'A1', 'Qal’a tepalikda.', 'The castle is on the hill', 'The fortress is on the hill'),
  T('t8', 'A1', 'Men ingliz tilini o‘rganaman.', 'I learn English', 'I study English', 'I am learning English'),
  // A2
  T('t9', 'A2', 'Savdogarlar Ipak yo‘li bo‘ylab sayohat qiladi.', 'The merchants travel along the Silk Road', 'Merchants travel along the Silk Road'),
  T('t10', 'A2', 'Biz shahar devorlarini himoya qilamiz.', 'We will defend the city walls', 'We defend the city walls'),
  T('t11', 'A2', 'Qo‘shin cho‘ldan o‘tdi.', 'The army crossed the desert'),
  T('t12', 'A2', 'Bizning ittifoqimiz kuchli.', 'Our alliance is strong'),
  T('t13', 'A2', 'Ular kecha shartnoma imzoladi.', 'They signed a treaty yesterday', 'They signed the treaty yesterday'),
  T('t14', 'A2', 'Tog‘lar shimolda joylashgan.', 'The mountains are in the north', 'The mountains are located in the north'),
  T('t15', 'A2', 'Men sizga xabar yubordim.', 'I sent you a message', 'I have sent you a message'),
  T('t16', 'A2', 'Karvon ertaga keladi.', 'The caravan arrives tomorrow', 'The caravan will arrive tomorrow', 'The caravan is coming tomorrow'),
  T('t17', 'A2', 'Bu shahar juda qadimiy.', 'This city is very old', 'This city is very ancient'),
  T('t18', 'A2', 'Biz tinchlik istaymiz.', 'We want peace'),
  // B1
  T('t19', 'B1', 'Agar siz hujum qilsangiz, biz javob qaytaramiz.', 'If you attack, we will respond', 'If you attack us, we will respond'),
  T('t20', 'B1', 'Hukmdor elchilarni qabul qildi.', 'The ruler received the ambassadors', 'The ruler received the envoys'),
  T('t21', 'B1', 'Qamal uch oy davom etdi.', 'The siege lasted three months', 'The siege lasted for three months'),
  T('t22', 'B1', 'Xazina qal’a ichida yashirilgan.', 'The treasury is hidden inside the castle', 'The treasure is hidden inside the fortress'),
  T('t23', 'B1', 'Muzokaralar ikki kun davom etadi.', 'The negotiations will last two days', 'Negotiations will last for two days'),
  T('t24', 'B1', 'Chegarani kechasi kesib o‘tish xavfli.', 'Crossing the border at night is dangerous', 'It is dangerous to cross the border at night'),
  // fill in the blank
  F('f1', 'A1', 'The merchants ___ to the market.', 'Bo‘sh joyni to‘ldiring (bormoq, hozirgi zamon)', 'go'),
  F('f2', 'A1', 'The castle ___ on the hill.', 'Bo‘sh joyni to‘ldiring (to be)', 'is'),
  F('f3', 'A2', 'We ___ defend the city tomorrow.', 'Bo‘sh joyni to‘ldiring (kelasi zamon)', 'will'),
  F('f4', 'A2', 'The army crossed ___ desert.', 'Bo‘sh joyni to‘ldiring (artikl)', 'the'),
  F('f5', 'B1', 'If you ___ us, we will respond.', 'Bo‘sh joyni to‘ldiring (hujum qilmoq)', 'attack'),
  F('f6', 'B1', 'The treaty ___ signed yesterday.', 'Bo‘sh joyni to‘ldiring (majhul nisbat)', 'was'),
  // speaking (sentence shown in English at A1/A2; Uzbek prompt at B1)
  S('s1', 'A1', 'This is my horse.', 'Ovoz chiqarib ayting'), S('s2', 'A1', 'The river is very long.', 'Ovoz chiqarib ayting'),
  S('s3', 'A1', 'We live in the city.', 'Ovoz chiqarib ayting'), S('s4', 'A2', 'The merchants travel along the Silk Road.', 'Ovoz chiqarib ayting'),
  S('s5', 'A2', 'We will defend the city walls.', 'Ovoz chiqarib ayting'), S('s6', 'A2', 'Our alliance is strong.', 'Ovoz chiqarib ayting'),
  S('s7', 'A2', 'The caravan arrives tomorrow.', 'Ovoz chiqarib ayting'), S('s8', 'B1', 'The ruler received the ambassadors.', 'Ovoz chiqarib ayting'),
  S('s9', 'B1', 'Crossing the border at night is dangerous.', 'Ovoz chiqarib ayting'), S('s10', 'B1', 'The negotiations will last two days.', 'Ovoz chiqarib ayting'),
];

export function pickExercise(level: Level, wantSpeak: boolean, exclude: Set<string> = new Set()): ExerciseItem {
  const levels: Level[] = level === 'A1' ? ['A1'] : level === 'A2' ? ['A1', 'A2'] : ['A2', 'B1'];
  let pool = EXERCISES.filter(e => levels.includes(e.level) && (wantSpeak ? e.kind === 'speak' : e.kind !== 'speak') && !exclude.has(e.id));
  if (!pool.length) pool = EXERCISES.filter(e => wantSpeak ? e.kind === 'speak' : e.kind !== 'speak');
  return pool[Math.floor(Math.random() * pool.length)];
}
