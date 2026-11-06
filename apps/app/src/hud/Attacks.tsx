// Live attacks (mine and against me) with a stop button.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { send } from '../net';
import { useStore } from '../store';
import { C } from '../theme';
import { Panel, Btn, H5 } from './ui';

export function Attacks() {
  const attacks = useStore(s => s.attacks);
  const players = useStore(s => s.players);
  const me = useStore(s => s.me);
  const live = attacks.filter(a => a.status === 'fighting');
  if (!live.length) return null;
  return (
    <Panel style={{ width: 300, maxWidth: '100%' }}>
      <H5>Janglar</H5>
      {live.map(a => { const mine = a.attacker === me; const other = players.find(p => p.id === (mine ? a.target : a.attacker)); const pct = a.sent ? Math.max(0, Math.min(100, a.troops / a.sent * 100)) : 0; return (
        <View key={a.id} style={st.row}>
          <Text style={{ color: C.text, fontSize: 12, fontWeight: '700' }}>{mine ? `⚔ Hujum: ${other?.name ?? ''}` : `🛡 ${other?.name ?? ''} hujum qilmoqda`}{a.viaSea ? ' (dengiz)' : ''}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={st.bar}><View style={[st.fill, { width: `${pct}%`, backgroundColor: mine ? C.red : C.purple }]} /></View>
            <Text style={{ color: C.muted, fontSize: 11, fontVariant: ['tabular-nums'] }}>{a.troops} qo‘shin · {a.captured} hudud</Text>
          </View>
          {mine && <Btn title="■ To‘xtatish" kind="danger" small style={{ alignSelf: 'flex-start', marginTop: 4 }} onPress={() => send({ t: 'stopAttack', attackId: a.id })} />}
          {!mine && <Btn title="🛡 Himoya mashqi" small style={{ alignSelf: 'flex-start', marginTop: 4 }} onPress={() => send({ t: 'exercise', purpose: 'defend', speak: false })} />}
        </View>); })}
    </Panel>
  );
}
const st = StyleSheet.create({ row: { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }, bar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }, fill: { height: '100%' } });
