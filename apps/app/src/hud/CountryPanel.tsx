// Shown after tapping a cell: terrain info, owner, relation, actions (attack, alliance, war, message).
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { send } from '../net';
import { useStore, setState, pushToast } from '../store';
import { C, F } from '../theme';
import { Panel, Btn, KV, Chip, Muted } from './ui';

export function CountryPanel({ compact }: { compact: boolean }) {
  const t = useStore(s => s.terrain);
  const me = useStore(s => s.mePriv);
  const phase = useStore(s => s.phase);
  const [pct, setPct] = useState(0.5);
  const [mode, setMode] = useState<'info' | 'attack'>('info');
  if (!t) return null;
  const foreign = t.owner && t.relation !== 'self';
  const canAttack = !!foreign && t.relation !== 'ally' && t.adjacency && (t.adjacency.land || t.adjacency.sea);
  const notPlaced = me && !me.placed;
  const close = () => { setState({ terrain: null, panel: 'none' }); setMode('info'); };
  const troops = me ? Math.floor(me.army * pct) : 0;
  const lossPct = Math.round(((t.info.attackLoss * 2 + t.info.defense * 2) / (1 + t.info.attackLoss * 2 + t.info.defense * 2)) * 100);
  const seaLoss = t.adjacency?.sea && !t.adjacency.land ? Math.min(50, Math.round((t.adjacency.seaKm ?? 500) / 30)) : 0;
  const arrive = Math.round(troops * (1 - seaLoss / 100));
  const power = me && me.attackPower ? me.attackPower : 0.6;
  const est = Math.round(arrive * power / (1 + t.info.attackLoss * 2 + t.info.defense * 2) * 0.9);
  return (
    <Panel style={[st.box, compact && st.boxCompact]}>
      <View style={st.head}>
        <Text style={st.title}>{t.info.nameUz}</Text>
        {t.owner ? <Chip text={t.relation === 'self' ? 'sizniki' : t.relation === 'ally' ? 'ittifoq' : t.relation === 'war' ? 'urush' : 'betaraf'} color={t.relation === 'self' ? C.gold : t.relation === 'ally' ? C.green : t.relation === 'war' ? C.purple : C.muted} /> : <Chip text="bo‘sh" color={C.muted} />}
        <Text onPress={close} style={{ color: C.muted, fontSize: 18, marginLeft: 'auto', paddingHorizontal: 6 }}>×</Text>
      </View>
      {mode === 'info' && (
        <>
          <View style={st.grid}>
            <Cell v={`×${t.info.moveCost}`} k="Harakat" />
            <Cell v={`+${Math.round(t.info.defense * 100)}%`} k="Himoya" color={t.info.defense ? C.green : C.text} />
            <Cell v={`−${Math.round(t.info.attackLoss * 100)}%`} k="Hujum narxi" color={t.info.attackLoss >= 0.25 ? C.amber : C.text} />
            <Cell v={t.ownerName ?? 'yo‘q'} k="Egasi" color={t.owner ? C.text : C.muted} small />
          </View>
          {t.nearestCity && <Muted style={{ marginTop: 6 }}>Eng yaqin shahar: {t.nearestCity.name} ({t.nearestCity.kind === 'madrasa' ? 'madrasa: mashq balli +' : t.nearestCity.kind === 'fortress' ? 'qal’a: himoya +' : 'karvonsaroy: daromad +'}), {t.nearestCity.km} km</Muted>}
          {foreign && t.adjacency && <Muted style={{ marginTop: 4 }}>{t.adjacency.land ? 'Quruqlik orqali chegaradosh' : t.adjacency.sea ? `Dengiz orqali chegaradosh (${t.adjacency.seaKm} km, yo‘lda ~${seaLoss}% yo‘qotish)` : 'Chegaradosh emas: quruqlik yoki dengiz orqali chegara kerak'}</Muted>}
          {notPlaced && !t.owner && phase !== 'ended' && <Btn title="⚑ Shu yerda davlat tuzish" kind="primary" style={{ marginTop: 8 }} onPress={() => { send({ t: 'place', cell: t.cell }); close(); }} />}
          {foreign && me?.placed && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              <Btn title="⚔ Hujum" kind="primary" small disabled={!canAttack} onPress={() => setMode('attack')} />
              {t.relation !== 'ally' && <Btn title="🤝 Ittifoq" small onPress={() => { setState({ panel: 'diplomacy', chatWith: t.owner }); }} />}
              {t.relation !== 'war' && <Btn title="Urush e’lon" small kind="danger" onPress={() => { send({ t: 'declareWar', to: t.owner }); close(); }} />}
              <Btn title="✉ Xabar" small onPress={() => setState({ panel: 'diplomacy', chatWith: t.owner })} />
            </View>
          )}
        </>
      )}
      {mode === 'attack' && me && (
        <>
          <Text style={{ color: C.text, fontWeight: '700', marginBottom: 4 }}>Hujum: <Text style={{ color: C.purple }}>{t.ownerName}</Text>{t.relation !== 'war' && <Text style={{ color: C.amber }}>  (e’lonsiz: kuch ×0.7, obro‘ −10)</Text>}</Text>
          <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>{[0.1, 0.25, 0.5, 0.75, 1].map(p => <Btn key={p} title={`${p * 100}%`} small kind={pct === p ? 'primary' : 'default'} onPress={() => setPct(p)} />)}</View>
          <View style={st.grid}>
            <Cell v={`${troops}`} k="Yuboriladi" />
            <Cell v={seaLoss ? `−${seaLoss}%` : `−${lossPct}%`} k={seaLoss ? 'Dengiz yo‘qotishi' : 'Relyef narxi'} color={C.amber} />
            <Cell v={`${arrive}`} k="Yetib boradi" />
            <Cell v={`~${est}`} k="Taxminiy hudud" />
          </View>
          <Muted style={{ marginTop: 6 }}>Hujum kuchi: {Math.round(power * 100)}% {me.attackPower ? '(mashq bajarildi)' : '(mashqsiz 60%; avval hujum mashqini bajaring)'}</Muted>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {!me.attackPower && <Btn title="✎ Hujum mashqi" small onPress={() => send({ t: 'exercise', purpose: 'attack', speak: false, targetId: t.owner })} />}
            <Btn title="⚔ Hujumni boshlash" kind="primary" small onPress={() => { if (troops < 5) { pushToast('Qo‘shin yetarli emas', 'warn'); return; } send({ t: 'attack', targetId: t.owner, pct }); close(); }} />
            <Btn title="Bekor" small kind="ghost" onPress={() => setMode('info')} />
          </View>
        </>
      )}
    </Panel>
  );
}
function Cell({ v, k, color, small }: { v: string; k: string; color?: string; small?: boolean }) {
  return <View style={st.cell}><Text numberOfLines={1} style={{ color: color ?? C.text, fontSize: small ? 13 : 17, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{v}</Text><Text style={{ color: C.muted, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.6 }}>{k}</Text></View>;
}
const st = StyleSheet.create({
  box: { width: 320, maxWidth: '100%' },
  boxCompact: { width: '100%' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: C.gold, fontFamily: F.display, fontSize: 16, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  cell: { width: '50%', paddingVertical: 3 },
});
