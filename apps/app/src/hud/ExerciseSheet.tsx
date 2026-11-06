import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import { send } from '../net';
import { useStore, setState } from '../store';
import { speechAvailable, recognizeOnce } from '../speech';
import { C, F } from '../theme';
import { Btn, Panel } from './ui';

export function ExerciseSheet({ compact }: { compact: boolean }) {
  const ex = useStore(s => s.exercise);
  const res = useStore(s => s.answerResult);
  const busy = useStore(s => s.exerciseBusy);
  const [answer, setAnswer] = useState('');
  const [interim, setInterim] = useState('');
  const [listening, setListening] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef<any>(null);
  useEffect(() => { setAnswer(''); setInterim(''); setErr(''); setListening(false); if (ex && ex.kind !== 'speak') setTimeout(() => inputRef.current?.focus(), 50); }, [ex?.id]);
  if (!ex) return null;
  const submit = (text: string) => { if (!text.trim() || busy) return; setState({ exerciseBusy: true }); send({ t: 'answer', exerciseId: ex.id, answer: text }); };
  const speak = async () => {
    if (!speechAvailable()) { setErr('Bu qurilmada mikrofon tanish yo‘q: javobni yozing'); return; }
    setErr(''); setListening(true);
    try { const text = await recognizeOnce(setInterim); setListening(false); setInterim(text); if (text) submit(text); else setErr('Hech narsa eshitilmadi'); } catch (e: any) { setListening(false); setErr(e.message); }
  };
  const purposeLabel = ex.purpose === 'expand' ? 'bo‘sh hududga kengayish' : ex.purpose === 'attack' ? 'hujum mashqi' : 'himoya mashqi';
  const kindLabel = ex.kind === 'speak' ? '🎤 Speaking' : ex.kind === 'word' ? '✎ So‘z' : ex.kind === 'fill' ? '✎ To‘ldirish' : '✎ Writing';
  const quality = res ? Math.round(res.quality * 100) : 0;
  const good = res && res.quality >= 0.8, part = res && !good && res.quality >= 0.5;
  return (
    <Panel style={[st.sheet, compact && st.sheetCompact]}>
      <View style={st.kind}><Text style={st.kindText}>{kindLabel} · {purposeLabel}</Text><Text style={st.kindText}>{ex.level}</Text><Pressable onPress={() => setState({ exercise: null, answerResult: null })}><Text style={{ color: C.muted, fontSize: 16, paddingHorizontal: 4 }}>×</Text></Pressable></View>
      {ex.kind === 'speak' ? (
        <>
          <Text style={st.prompt}>{ex.promptUz}</Text>
          <Text style={st.display}>{ex.display}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <Pressable onPress={speak} disabled={!!res || busy} style={[st.mic, listening && st.micLive]}><Text style={{ fontSize: 22 }}>{'🎤'}</Text></Pressable>
            <Text style={{ color: C.muted, flex: 1 }}>{listening ? 'Tinglanmoqda… ' + interim : interim ? `“${interim}”` : speechAvailable() ? 'Mikrofonni bosing va jumlani ayting' : 'Mikrofon yo‘q: pastga yozing'}</Text>
          </View>
          {!speechAvailable() && <Row inputRef={inputRef} answer={answer} setAnswer={setAnswer} onSubmit={() => submit(answer)} disabled={!!res || busy} />}
        </>
      ) : (
        <>
          <Text style={st.prompt}>{ex.kind === 'fill' ? ex.promptUz : ex.kind === 'word' ? 'Inglizchaga tarjima qiling:' : 'Inglizchaga yozing:'}</Text>
          <Text style={st.display}>{ex.kind === 'fill' ? ex.display : ex.promptUz}</Text>
          <Row inputRef={inputRef} answer={answer} setAnswer={setAnswer} onSubmit={() => submit(answer)} disabled={!!res || busy} />
        </>
      )}
      {err ? <Text style={{ color: C.amber, marginTop: 6 }}>{err}</Text> : null}
      {res && (
        <Text style={[st.result, { color: good ? C.green : part ? C.amber : C.rose }]}>
          {good ? `✔ To‘g‘ri (${quality}%)` : part ? `◑ Qisman (${quality}%)` : `✖ Xato (${quality}%)`}
          {res.effect.score ? ` · +${res.effect.score} ball` : ''}{res.effect.army ? ` · +${res.effect.army} qo‘shin` : ''}{res.effect.cells ? ` · hudud +${res.effect.cells}` : ''}
          {res.effect.attackPower ? ` · hujum kuchi ${Math.round(res.effect.attackPower * 100)}%` : ''}{res.effect.defenseBoost ? ` · himoya +${Math.round(res.effect.defenseBoost * 100)}%` : ''}
          {!good && <Text style={{ color: C.muted, fontWeight: '400' }}>{`\n`}To‘g‘ri javob: {res.correct}{res.effect.cooldown ? ` · ${res.effect.cooldown} s kutish` : ''}</Text>}
        </Text>
      )}
    </Panel>
  );
}
function Row({ inputRef, answer, setAnswer, onSubmit, disabled }: { inputRef: React.MutableRefObject<any>; answer: string; setAnswer: (s: string) => void; onSubmit: () => void; disabled: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
      <TextInput ref={inputRef} value={answer} onChangeText={setAnswer} onSubmitEditing={onSubmit} editable={!disabled} placeholder="Inglizcha javob" placeholderTextColor={C.muted} autoCapitalize="none" autoCorrect={false} style={st.input} returnKeyType="send" />
      <Btn title="Yuborish" kind="primary" onPress={onSubmit} disabled={disabled} />
    </View>
  );
}
const st = StyleSheet.create({
  sheet: { width: 520, maxWidth: '100%', paddingHorizontal: 14, paddingVertical: 10 },
  sheetCompact: { width: '100%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  kind: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  kindText: { color: C.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  prompt: { color: C.muted, fontSize: 13, marginTop: 6 },
  display: { color: C.text, fontSize: 18, fontWeight: '600', fontFamily: F.ui, marginTop: 2 },
  input: { flex: 1, borderWidth: 1, borderColor: C.line, backgroundColor: 'rgba(255,255,255,0.06)', color: C.text, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 16, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
  result: { marginTop: 8, fontWeight: '700', fontSize: 13 },
  mic: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#f1dfb0' },
  micLive: { backgroundColor: '#b8473f', borderColor: '#fff' },
});
