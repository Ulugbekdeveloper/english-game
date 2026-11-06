import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useStore, setState } from '../store';
import { disconnect } from '../net';
import { C, F } from '../theme';
import { Panel, Btn, H5, Muted, KV } from '../hud/ui';

export function Result() {
  const g = useStore(s => s.gameOver);
  if (!g) return null;
  const me = g.me;
  const wAcc = me.stats.w ? Math.round(me.stats.wOk / me.stats.w * 100) : 0, sAcc = me.stats.s ? Math.round(me.stats.sOk / me.stats.s * 100) : 0;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
      <Panel style={{ width: 640, maxWidth: '100%', padding: 18 }}>
        <Text style={st.h}>O‘yin tugadi · g‘olib: {g.winnerName}</Text>
        <View style={st.big}>
          <Big v={`${g.myRank || '-'}`} k={`O‘rin / ${g.ranking.length}`} />
          <Big v={`${me.cells}`} k="Hudud" color={C.gold} />
          <Big v={`${me.score}`} k="Ball" />
          <Big v={`${me.army}`} k="Qo‘shin" color={C.red} />
        </View>
        <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
          <View style={{ flex: 1, minWidth: 240 }}>
            <H5>Til natijasi</H5>
            <KV k="✎ Writing" v={`${me.stats.wOk} / ${me.stats.w} (${wAcc}%)`} />
            <Bar pct={wAcc} />
            <KV k="🎤 Speaking" v={`${me.stats.sOk} / ${me.stats.s} (${sAcc}%)`} />
            <Bar pct={sAcc} />
            <KV k="Learning bonus" v={`+${me.bonusArmy} qo‘shin`} vColor={C.green} />
            <KV k="Daraja" v={me.level} />
          </View>
          <View style={{ flex: 1, minWidth: 240 }}>
            <H5>Lug‘atimga qo‘shildi</H5>
            {me.missed.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>{me.missed.map(w => <View key={w} style={st.chip}><Text style={{ color: C.text, fontSize: 12 }}>{w}</Text></View>)}</View> : <Muted>Xato yo‘q</Muted>}
            <Muted style={{ marginTop: 8 }}>Keyingi o‘yinda qayta so‘raladi (profil saqlash keyingi versiyada).</Muted>
          </View>
        </View>
        <H5>Reyting</H5>
        {g.ranking.slice(0, 10).map((r, i) => <KV key={r.id} k={`${i + 1}. ${r.name}${r.isBot ? '' : ' (odam)'}`} v={`${r.cells} ▣ · ${r.army} ⚔`} vColor={r.id === me.id ? C.gold : C.text} />)}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}><Btn title="Yana o‘ynash" kind="primary" onPress={() => { disconnect(); setState({ screen: 'lobby', gameOver: null }); }} /></View>
      </Panel>
    </ScrollView>
  );
}
function Big({ v, k, color }: { v: string; k: string; color?: string }) { return <View style={st.bigCell}><Text style={{ color: color ?? C.text, fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{v}</Text><Muted style={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 10 }}>{k}</Muted></View>; }
function Bar({ pct }: { pct: number }) { return <View style={st.bar}><View style={{ width: `${pct}%`, height: '100%', backgroundColor: C.green }} /></View>; }
const st = StyleSheet.create({
  h: { color: C.gold, fontFamily: F.display, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  big: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  bigCell: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: 8, alignItems: 'center' },
  bar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginVertical: 4 },
  chip: { backgroundColor: 'rgba(229,83,75,0.15)', borderWidth: 1, borderColor: 'rgba(229,83,75,0.4)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
});
