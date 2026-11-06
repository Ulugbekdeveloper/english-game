// Speech recognition: Web Speech API on web; native needs a development build (expo-speech-recognition) and falls back to typing.
import { Platform } from 'react-native';

export function speechAvailable(): boolean {
  if (Platform.OS !== 'web') return false;
  const w = globalThis as any;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}
export function recognizeOnce(onInterim?: (t: string) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const w = globalThis as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return reject(new Error('Mikrofon tanish bu qurilmada mavjud emas'));
    const r = new SR();
    r.lang = 'en-US'; r.interimResults = true; r.maxAlternatives = 1; r.continuous = false;
    let final = '';
    r.onresult = (ev: any) => { let interim = ''; for (let i = ev.resultIndex; i < ev.results.length; i++) { const t = ev.results[i][0].transcript; if (ev.results[i].isFinal) final += t; else interim += t; } onInterim?.(final || interim); };
    r.onerror = (ev: any) => reject(new Error(ev.error === 'not-allowed' ? 'Mikrofonga ruxsat berilmadi' : 'Tanib bo‘lmadi, yana urinib ko‘ring'));
    r.onend = () => resolve(final.trim());
    try { r.start(); } catch (e) { reject(e as Error); }
  });
}
