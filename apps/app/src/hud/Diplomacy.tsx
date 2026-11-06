import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Pressable } from 'react-native';
import { send } from '../net';
import { useStore, setState } from '../store';
import { C, F } from '../theme';
import { Panel, Btn, Chip, H5, Muted } from './ui';

export function Diplomacy({ compact }: { compact: boolean }) {
  const players = useStore(s => s.players);
  const me = useStore(s => s.me);
  const mePriv = useStore(s => s.mePriv);
  const proposals = useStore(s => s.proposals);
  const chats = useStore(s => s.chats);
  const chatWith = useStore(s => s.chatWith);
  const [text, setText] = useState('');
  const [minutes, setMinutes] = useState(10);
  const [jointWar, setJointWar] = useState<number | undefined>();
  const other = players.find(p => p.id === chatWith);
  const humans = players.filter(p => !p.isBot && p.id !== me);
  const neighbours = players.filter(p => p.id !== me && (p.relation !== 'neutral' || !p.isBot)).slice(0, 12);
  const pending = proposals.filter(p => p.to === me && p.status === 'pending');
  const thread = chats.filter(c => c.from === chatWith || (c.from === me));
  return (
    <Panel style={[st.box, compact && st.boxCompact]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}><H5>Diplomatiya</H5><Text onPress={() => setState({ panel: 'none' })} style={{ color: C.muted, fontSize: 18, marginLeft: 'auto', paddingHorizontal: 6 }}>×</Text></View>
      {pending.map(p => { const from = players.find(x => x.id === p.from); return (
        <View key={p.id} style={st.prop}><Text style={{ color: C.text, fontWeight: '700' }}>{from?.name ?? '?'} ittifoq taklif qildi</Text><Muted>{p.terms.noAttackMinutes} daqiqa hujum yo‘q{p.terms.jointWar ? `, ${players.find(x => x.id === p.terms.jointWar)?.name}ga birga urush` : ''}{p.terms.shareLand ? ', hudud 50/50' : ''}</Muted>{p.text ? <Muted>“{p.text}”</Muted> : null}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}><Btn title="Imzolash" kind="primary" small onPress={() => send({ t: 'respond', proposalId: p.id, accept: true })} /><Btn title="Rad etish" small onPress={() => send({ t: 'respond', proposalId: p.id, accept: false })} /></View></View>); })}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }} contentContainerStyle={{ gap: 4 }}>
        {neighbours.map(p => <Pressable key={p.id} onPress={() => setState({ chatWith: p.id })} style={[st.tab, chatWith === p.id && st.tabOn]}><Text style={{ color: chatWith === p.id ? '#241d14' : C.text, fontSize: 12, fontWeight: '600' }}>{p.name}</Text>{p.relation === 'ally' && <Text style={{ color: chatWith === p.id ? '#1f5e2a' : C.green, fontSize: 10 }}> ✔</Text>}{p.relation === 'war' && <Text style={{ color: C.purple, fontSize: 10 }}> ⚔</Text>}</Pressable>)}
      </ScrollView>
      {other ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Text style={{ color: C.text, fontWeight: '700', fontFamily: F.display }}>{other.name}</Text><Chip text={other.isBot ? 'bot' : 'odam'} color={C.muted} />{other.relation === 'ally' && <Chip text="ittifoq" color={C.green} />}{other.relation === 'war' && <Chip text="urush" color={C.purple} />}<Muted>{other.cells} ▣ {other.army} ⚔</Muted></View>
          <ScrollView style={st.chat} contentContainerStyle={{ gap: 4 }}>
            {thread.slice(-12).map((c, i) => <View key={i} style={[st.msg, c.from === me && st.msgMe]}><Text style={{ color: C.text, fontSize: 12 }}>{c.text}</Text>{c.points ? <Text style={{ color: C.green, fontSize: 10, fontWeight: '700' }}>+{c.points} ball (inglizcha)</Text> : null}</View>)}
            {!thread.length && <Muted>Inglizcha yozing: har xabar uchun +3 ball</Muted>}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 6 }}><TextInput value={text} onChangeText={setText} placeholder="Message in English…" placeholderTextColor={C.muted} style={st.input} onSubmitEditing={() => { if (text.trim()) { send({ t: 'chat', to: other.id, text }); setText(''); } }} /><Btn title="➤" small onPress={() => { if (text.trim()) { send({ t: 'chat', to: other.id, text }); setText(''); } }} /></View>
          {other.relation !== 'ally' && (
            <View style={st.terms}>
              <Muted style={{ fontWeight: '700' }}>Shartnoma bandlari</Muted>
              <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>{[5, 10, 20].map(m => <Btn key={m} title={`${m} daqiqa hujum yo‘q`} small kind={minutes === m ? 'primary' : 'default'} onPress={() => setMinutes(m)} />)}</View>
              <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 4 }}><Btn title="Birga urush: yo‘q" small kind={!jointWar ? 'primary' : 'default'} onPress={() => setJointWar(undefined)} />{(mePriv?.wars ?? []).slice(0, 3).map(id => <Btn key={id} title={`Birga urush: ${players.find(x => x.id === id)?.name ?? id}`} small kind={jointWar === id ? 'primary' : 'default'} onPress={() => setJointWar(id)} />)}</View>
              <Btn title="🤝 Ittifoq taklif qilish" kind="primary" small style={{ marginTop: 6 }} onPress={() => send({ t: 'propose', to: other.id, terms: { noAttackMinutes: minutes, jointWar, shareLand: true, exchangeExercises: false }, text })} />
            </View>
          )}
          {other.relation === 'ally' && <Btn title="Shartnomani buzish va urush e’lon qilish" kind="danger" small style={{ marginTop: 6 }} onPress={() => send({ t: 'declareWar', to: other.id })} />}
        </>
      ) : <Muted>Davlatni tanlang: xaritada hududiga bosing yoki yuqoridagi ro‘yxatdan.</Muted>}
      {humans.length === 0 && <Muted style={{ marginTop: 6 }}>Xonada boshqa odam yo‘q, botlar ham ittifoqqa javob beradi.</Muted>}
    </Panel>
  );
}
const st = StyleSheet.create({
  box: { width: 340, maxWidth: '100%', maxHeight: 460 },
  boxCompact: { width: '100%', maxHeight: '70%' },
  prop: { borderWidth: 1, borderColor: C.green, borderRadius: 6, padding: 8, marginBottom: 6, backgroundColor: 'rgba(95,191,122,0.08)' },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.06)' },
  tabOn: { backgroundColor: C.gold },
  chat: { maxHeight: 140, marginVertical: 6 },
  msg: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: 6, maxWidth: '90%' },
  msgMe: { alignSelf: 'flex-end', backgroundColor: 'rgba(217,178,95,0.2)' },
  input: { flex: 1, borderWidth: 1, borderColor: C.line, color: C.text, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, fontSize: 13 },
  terms: { marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 6 },
});
