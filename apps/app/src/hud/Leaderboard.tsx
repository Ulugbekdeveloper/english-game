import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStore } from '../store';
import { C } from '../theme';
import { Panel, H5, Chip } from './ui';

export function Leaderboard() {
  const ranking = useStore(s => s.ranking);
  const players = useStore(s => s.players);
  const me = useStore(s => s.me);
  const rows = ranking.slice(0, 7);
  const myIdx = ranking.findIndex(r => r.id === me);
  if (myIdx >= 7 && ranking[myIdx]) rows.push(ranking[myIdx]);
  return (
    <Panel style={{ width: 250 }}>
      <H5>Reyting</H5>
      <View style={st.head}><Text style={[st.c, { width: 22 }]}>#</Text><Text style={[st.c, { flex: 1 }]}>Davlat</Text><Text style={[st.c, { width: 46, textAlign: 'right' }]}>Hudud</Text><Text style={[st.c, { width: 46, textAlign: 'right' }]}>Qo‘shin</Text></View>
      {rows.map(r => {
        const p = players.find(x => x.id === r.id); const rank = ranking.findIndex(x => x.id === r.id) + 1; const mine = r.id === me;
        return (
          <View key={r.id} style={[st.row, mine && st.mine]}>
            <Text style={[st.t, { width: 22 }]}>{rank}</Text>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p ? (p.relation === 'self' ? '#8c2f28' : p.relation === 'ally' ? '#3a8f4a' : p.relation === 'war' ? '#5b2a86' : `rgb(${p.color.join(',')})`) : '#888' }} />
              <Text numberOfLines={1} style={[st.t, { flexShrink: 1, fontWeight: mine ? '700' : '500' }]}>{r.name}</Text>
              {!r.isBot && !mine && <Chip text="odam" color={C.muted} />}
              {p?.relation === 'ally' && <Chip text="ittifoq" color={C.green} />}
              {p?.relation === 'war' && <Chip text="urush" color={C.purple} />}
            </View>
            <Text style={[st.t, { width: 46, textAlign: 'right' }]}>{r.cells}</Text>
            <Text style={[st.t, { width: 46, textAlign: 'right' }]}>{r.army}</Text>
          </View>
        );
      })}
    </Panel>
  );
}
const st = StyleSheet.create({
  head: { flexDirection: 'row', paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: 'rgba(217,178,95,0.25)' },
  c: { color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  mine: { backgroundColor: 'rgba(217,178,95,0.15)', marginHorizontal: -6, paddingHorizontal: 6, borderRadius: 4 },
  t: { color: C.text, fontSize: 12, fontVariant: ['tabular-nums'] },
});
