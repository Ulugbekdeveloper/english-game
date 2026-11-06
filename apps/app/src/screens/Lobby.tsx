import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { FLAG_PALETTE, FLAG_BG_KINDS, FLAG_PATTERNS, FLAG_SYMBOLS, flagIsValid } from '@eg/shared';
import type { FlagSpec, Level } from '@eg/shared';
import { connect, send, defaultServerUrl } from '../net';
import { useStore, setState, pushToast } from '../store';
import { Flag } from '../Flag';
import { C, F } from '../theme';
import { Panel, Btn, H5, Muted } from '../hud/ui';

export function Lobby() {
  const profile = useStore(s => s.profile);
  const rooms = useStore(s => s.rooms);
  const connected = useStore(s => s.connected);
  const serverUrl = useStore(s => s.serverUrl);
  const [url, setUrl] = useState(serverUrl || defaultServerUrl());
  const [tab, setTab] = useState<'bg' | 'pattern' | 'symbol'>('bg');
  const [busy, setBusy] = useState(false);
  const { width } = useWindowDimensions();
  const narrow = width < 760;
  const flag = profile.flag;
  const setFlag = (f: FlagSpec) => setState({ profile: { ...profile, flag: f } });
  const valid = flagIsValid(flag);
  useEffect(() => { const id = setInterval(() => { if (connected) send({ t: 'rooms' }); }, 3000); return () => clearInterval(id); }, [connected]);
  const go = async (roomId?: string) => {
    if (!profile.name.trim()) { pushToast('Davlat nomini kiriting', 'warn'); return; }
    if (!valid.ok) { pushToast('Bayroq: ' + valid.reason, 'warn'); return; }
    setBusy(true);
    try { if (!connected) await connect(url); send({ t: 'join', roomId }); } catch { pushToast('Serverga ulanib bo‘lmadi: ' + url, 'war'); }
    setBusy(false);
  };
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
      <Text style={st.logo}>IMPERIYA</Text>
      <Text style={st.sub}>INGLIZ TILI · JONLI STRATEGIYA</Text>
      <View style={[st.cols, narrow && { flexDirection: 'column' }]}>
        <Panel style={[st.col, { width: narrow ? '100%' : 420 }]}>
          <H5>Davlatingizni tuzing</H5>
          <Muted>Davlat nomi</Muted>
          <TextInput value={profile.name} onChangeText={v => setState({ profile: { ...profile, name: v } })} placeholder="masalan: Temuriylar" placeholderTextColor={C.muted} style={st.input} maxLength={24} />
          <Muted style={{ marginTop: 10 }}>Daraja</Muted>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>{(['A1', 'A2', 'B1'] as Level[]).map(l => <Btn key={l} title={l} small kind={profile.level === l ? 'primary' : 'default'} onPress={() => setState({ profile: { ...profile, level: l } })} />)}</View>
          <Muted style={{ marginTop: 10 }}>Mashq turi</Muted>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>{[[0, 'Faqat writing'], [0.5, 'Writing 50 / Speaking 50'], [1, 'Ko‘proq speaking']].map(([v, l]) => <Btn key={String(v)} title={String(l)} small kind={profile.speakPref === v ? 'primary' : 'default'} onPress={() => setState({ profile: { ...profile, speakPref: v as number } })} />)}</View>
          <Muted style={{ marginTop: 10 }}>Bayroq (3 qatlam, tayyor elementlar)</Muted>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
            <View style={{ alignItems: 'center', gap: 4 }}><Flag spec={flag} width={80} height={104} /><View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}><Flag spec={flag} width={24} height={31} /><Flag spec={flag} width={14} height={18} /></View><Muted>{valid.ok ? '✔ yaroqli' : '✖ ' + valid.reason}</Muted></View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', gap: 4 }}>{(['bg', 'pattern', 'symbol'] as const).map(t => <Pressable key={t} onPress={() => setTab(t)} style={[st.tab, tab === t && st.tabOn]}><Text style={{ color: tab === t ? '#241d14' : C.muted, fontSize: 12, fontWeight: '700' }}>{t === 'bg' ? '1 · Fon' : t === 'pattern' ? '2 · Naqsh' : '3 · Ramz'}</Text></Pressable>)}</View>
              {tab === 'bg' && <>
                <View style={st.opts}>{FLAG_BG_KINDS.map(k => <Opt key={k} on={flag.bg.kind === k} onPress={() => setFlag({ ...flag, bg: { ...flag.bg, kind: k, c2: flag.bg.c2 ?? 1 } })}><Flag spec={{ bg: { kind: k, c1: flag.bg.c1, c2: flag.bg.c2 ?? 1 } }} width={26} height={34} /></Opt>)}</View>
                <Muted style={{ marginTop: 4 }}>Asosiy rang</Muted><Colors value={flag.bg.c1} onPick={i => setFlag({ ...flag, bg: { ...flag.bg, c1: i } })} />
                {flag.bg.kind !== 'solid' && <><Muted style={{ marginTop: 4 }}>Ikkinchi rang</Muted><Colors value={flag.bg.c2 ?? 1} onPick={i => setFlag({ ...flag, bg: { ...flag.bg, c2: i } })} /></>}
              </>}
              {tab === 'pattern' && <>
                <View style={st.opts}>{FLAG_PATTERNS.map(p => <Opt key={p} on={(flag.pattern?.id ?? 'none') === p} onPress={() => setFlag({ ...flag, pattern: { id: p, color: flag.pattern?.color ?? 1 } })}><Flag spec={{ ...flag, pattern: { id: p, color: flag.pattern?.color ?? 1 }, symbol: undefined }} width={26} height={34} /></Opt>)}</View>
                <Muted style={{ marginTop: 4 }}>Naqsh rangi</Muted><Colors value={flag.pattern?.color ?? 1} onPick={i => setFlag({ ...flag, pattern: { id: flag.pattern?.id ?? 'stripes', color: i } })} />
              </>}
              {tab === 'symbol' && <>
                <View style={st.opts}>{FLAG_SYMBOLS.map(sy => <Opt key={sy} on={(flag.symbol?.id ?? 'none') === sy} onPress={() => setFlag({ ...flag, symbol: { id: sy, color: flag.symbol?.color ?? 4, scale: 1 } })}><Flag spec={{ ...flag, pattern: undefined, symbol: { id: sy, color: flag.symbol?.color ?? 4, scale: 1 } }} width={26} height={34} /></Opt>)}</View>
                <Muted style={{ marginTop: 4 }}>Ramz rangi</Muted><Colors value={flag.symbol?.color ?? 4} onPick={i => setFlag({ ...flag, symbol: { id: flag.symbol?.id ?? 'rings', color: i, scale: 1 } })} />
              </>}
            </View>
          </View>
          <Muted style={{ marginTop: 8 }}>Qo‘shin ko‘rinishi bayroqqa bog‘liq emas: u xaritada tanlagan mintaqangizdan keladi.</Muted>
        </Panel>
        <Panel style={[st.col, { width: narrow ? '100%' : 380 }]}>
          <H5>Jahon jangi</H5>
          <Muted>100 kishigacha ochiq xona, 30 daqiqa. Oxirgi tirik qolgan yoki eng katta davlat g‘olib. Botlar xaritani to‘ldiradi.</Muted>
          <Btn title={busy ? 'Ulanmoqda…' : '⚡ Tez kirish'} kind="primary" style={{ marginTop: 10 }} disabled={busy} onPress={() => go()} />
          <Muted style={{ marginTop: 12 }}>Ochiq xonalar</Muted>
          {rooms.length === 0 && <Muted style={{ marginTop: 4 }}>{connected ? 'Hozircha xona yo‘q: Tez kirish yangi xona ochadi' : 'Serverga ulanish uchun Tez kirishni bosing'}</Muted>}
          {rooms.map(r => <View key={r.id} style={st.room}><View style={{ flex: 1 }}><Text style={{ color: C.text, fontWeight: '700' }}>Jahon {r.id}</Text><Muted>{r.humans} / {r.maxHumans} odam · {r.bots} bot · {Math.floor(r.elapsed / 60)}:{String(r.elapsed % 60).padStart(2, '0')} · {r.phase === 'playing' ? 'jonli' : r.phase === 'waiting' ? 'kutmoqda' : 'tugagan'}</Muted></View>{r.phase !== 'ended' && <Btn title="Kirish" small onPress={() => go(r.id)} />}</View>)}
          <Muted style={{ marginTop: 14 }}>Server manzili</Muted>
          <TextInput value={url} onChangeText={setUrl} style={[st.input, { fontSize: 12 }]} autoCapitalize="none" autoCorrect={false} />
          <Muted style={{ marginTop: 10 }}>1v1 duel, guruh jangi, o‘qituvchi xonasi: keyingi versiyada.</Muted>
        </Panel>
      </View>
    </ScrollView>
  );
}
function Opt({ on, onPress, children }: { on: boolean; onPress: () => void; children: React.ReactNode }) { return <Pressable onPress={onPress} style={[st.opt, on && st.optOn]}>{children}</Pressable>; }
function Colors({ value, onPick }: { value: number; onPick: (i: number) => void }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>{FLAG_PALETTE.map((c, i) => <Pressable key={i} onPress={() => onPick(i)} style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: c, borderWidth: 2, borderColor: value === i ? '#fff' : 'rgba(255,255,255,0.15)' }} />)}</View>;
}
const st = StyleSheet.create({
  logo: { color: C.gold, fontFamily: F.display, fontSize: 40, fontWeight: '700', letterSpacing: 6, marginTop: 10 },
  sub: { color: C.muted, fontSize: 11, letterSpacing: 4, marginBottom: 18 },
  cols: { flexDirection: 'row', gap: 16, width: '100%', maxWidth: 840, justifyContent: 'center', flexWrap: 'wrap' },
  col: { padding: 14 },
  input: { borderWidth: 1, borderColor: C.line, backgroundColor: 'rgba(255,255,255,0.06)', color: C.text, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15, marginTop: 4 },
  tab: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.06)' },
  tabOn: { backgroundColor: C.gold },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  opt: { padding: 4, borderRadius: 6, borderWidth: 2, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.04)' },
  optOn: { borderColor: C.gold },
  room: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
});
