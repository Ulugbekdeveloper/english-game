import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RULES, incomePhase } from '@eg/shared';
import { useStore } from '../store';
import { C, F } from '../theme';
import { Btn } from './ui';

export function IncomeIndicator({ compact, onExpand }: { compact: boolean; onExpand: () => void }) {
  const me = useStore(s => s.mePriv);
  if (!me || !me.placed) return null;
  const since = me.sinceCapture;
  const phase = incomePhase(since);
  const col = phase === 'active' ? C.green : phase === 'slowing' ? C.amber : C.rose;
  const icon = phase === 'active' ? '▲' : phase === 'slowing' ? '▼' : '■';
  const label = phase === 'active' ? 'FAOL' : phase === 'slowing' ? 'SEKINLASHMOQDA' : 'TO‘XTADI';
  const pct = phase === 'active' ? '100%' : phase === 'slowing' ? '50%' : '0%';
  const timer = phase === 'active' ? `50% gacha ${Math.ceil(RULES.activeSeconds - since)} s` : phase === 'slowing' ? `to‘xtashgacha ${Math.ceil(RULES.slowingSeconds - since)} s` : 'kengaytirish kerak';
  const fill = Math.min(100, since / RULES.slowingSeconds * 100);
  return (
    <View style={[st.box, compact && st.boxCompact]}>
      <View style={st.row}>
        <Text style={[st.state, { color: col }]}>{icon} {label}</Text>
        <Text style={st.pct}><Text style={{ color: col }}>{pct}</Text> daromad</Text>
        <Text style={st.timer}>{timer}</Text>
      </View>
      <View style={st.bar}>
        <View style={[st.zone, { left: 0, width: '50%', backgroundColor: 'rgba(95,191,122,0.22)' }]} />
        <View style={[st.zone, { left: '50%', width: '50%', backgroundColor: 'rgba(232,163,61,0.22)' }]} />
        <View style={[st.mark]} />
        <View style={[st.fill, { width: `${fill}%`, backgroundColor: col }]} />
      </View>
      {phase === 'stopped' && !compact && (
        <View style={st.cta}><Text style={{ color: C.muted, fontSize: 12, flex: 1 }}>Daromad to‘xtadi: yangi hudud egallang</Text><Btn title="✎ Kengaytirish" kind="primary" small onPress={onExpand} /></View>
      )}
    </View>
  );
}
const st = StyleSheet.create({
  box: { backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, width: 440, maxWidth: '100%' },
  boxCompact: { paddingHorizontal: 8, paddingVertical: 4, width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  state: { fontFamily: F.display, fontWeight: '700', fontSize: 13, letterSpacing: 0.8 },
  pct: { color: C.text, fontSize: 13, fontWeight: '700' },
  timer: { marginLeft: 'auto', color: C.muted, fontSize: 12, fontVariant: ['tabular-nums'] },
  bar: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 5, overflow: 'hidden' },
  zone: { position: 'absolute', top: 0, bottom: 0 },
  mark: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(241,230,207,0.6)' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
});
