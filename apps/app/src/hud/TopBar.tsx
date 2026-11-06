import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RULES, incomePhase, armyIncomePerMin } from '@eg/shared';
import { useStore } from '../store';
import { Flag } from '../Flag';
import { C, F } from '../theme';
import { Chip } from './ui';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function TopBar({ compact }: { compact: boolean }) {
  const me = useStore(s => s.mePriv);
  const time = useStore(s => s.time);
  const profile = useStore(s => s.profile);
  if (!me) return null;
  const phase = incomePhase(me.sinceCapture);
  const inc = Math.round(armyIncomePerMin(me.cells, me.sinceCapture, me.landmarks.caravanserai));
  const pct = phase === 'active' ? '100%' : phase === 'slowing' ? '50%' : '0%';
  const col = phase === 'active' ? C.green : phase === 'slowing' ? C.amber : C.rose;
  return (
    <View style={[st.bar, compact && st.barCompact]}>
      <View style={[st.cell, compact && st.cellCompact]}><Flag spec={profile.flag} width={compact ? 18 : 22} height={compact ? 23 : 28} /><Text numberOfLines={1} style={[st.name, compact && { fontSize: 13, maxWidth: 90 }]}>{me.name}</Text></View>
      <Stat icon={'▣'} iconColor={C.gold} value={me.cells} label="Hudud" compact={compact} />
      <Stat icon={'⚔'} iconColor={C.red} value={me.army} label="Qo‘shin" compact={compact} />
      <View style={[st.cell, compact && st.cellCompact]}><Text style={[st.value, compact && { fontSize: 14 }]}>+{inc}</Text><View><Text style={st.label}>{compact ? '/min' : 'Daromad / min'}</Text></View><Chip text={pct} color={col} /></View>
      {!compact && <Stat icon={'❖'} iconColor={C.green} value={`+${me.bonusArmy}`} label="Learning bonus" compact={compact} />}
      <View style={[st.cell, compact && st.cellCompact, { marginLeft: 'auto', borderRightWidth: 0 }]}><Text style={[st.value, compact && { fontSize: 14 }]}>{fmt(time)}</Text>{!compact && <Text style={st.label}>/ {fmt(RULES.matchSeconds)}</Text>}</View>
    </View>
  );
}
function Stat({ icon, iconColor, value, label, compact }: { icon: string; iconColor: string; value: number | string; label: string; compact: boolean }) {
  return <View style={[st.cell, compact && st.cellCompact]}><Text style={{ color: iconColor, fontSize: compact ? 13 : 16 }}>{icon}</Text><View><Text style={[st.value, { color: iconColor }, compact && { fontSize: 14 }]}>{value}</Text>{!compact && <Text style={st.label}>{label}</Text>}</View></View>;
}
const st = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 4, height: 48 },
  barCompact: { height: 38, paddingHorizontal: 0 },
  cell: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: '100%', borderRightWidth: 1, borderRightColor: 'rgba(217,178,95,0.2)' },
  cellCompact: { paddingHorizontal: 6, gap: 4 },
  name: { color: C.text, fontFamily: F.display, fontWeight: '700', fontSize: 15, maxWidth: 140 },
  value: { color: C.text, fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'], lineHeight: 19 },
  label: { color: C.muted, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },
});
