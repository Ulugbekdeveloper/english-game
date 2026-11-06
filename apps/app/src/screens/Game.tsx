import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { lonLatToCell } from '@eg/shared';
import { send, disconnect } from '../net';
import { useStore, setState, pushToast } from '../store';
import { MapGL, type Camera } from '../MapGL';
import { TopBar } from '../hud/TopBar';
import { IncomeIndicator } from '../hud/IncomeIndicator';
import { Leaderboard } from '../hud/Leaderboard';
import { ExerciseSheet } from '../hud/ExerciseSheet';
import { CountryPanel } from '../hud/CountryPanel';
import { Diplomacy } from '../hud/Diplomacy';
import { Attacks } from '../hud/Attacks';
import { Toasts } from '../hud/Toasts';
import { Panel, Btn, H5, KV, Muted } from '../hud/ui';
import { C, F } from '../theme';

export function Game() {
  const { width, height } = useWindowDimensions();
  const compact = width < 760;
  const me = useStore(s => s.mePriv);
  const phase = useStore(s => s.phase);
  const placementEndsAt = useStore(s => s.placementEndsAt);
  const panel = useStore(s => s.panel);
  const exercise = useStore(s => s.exercise);
  const profile = useStore(s => s.profile);
  const [showLb, setShowLb] = useState(!compact);
  const [countdown, setCountdown] = useState(0);
  const camRef = useRef<Camera>({ cx: 0, cy: 0, zoom: 1 });
  const [focusCell, setFocusCell] = useState<number | undefined>();
  const placed = !!me?.placed;
  useEffect(() => { const id = setInterval(() => setCountdown(Math.max(0, Math.ceil((placementEndsAt - Date.now()) / 1000))), 500); return () => clearInterval(id); }, [placementEndsAt]);
  useEffect(() => { setFocusCell(lonLatToCell(66.97, 39.65)); }, []);
  const onCellPress = (cell: number) => { setState({ selectedCell: cell }); send({ t: 'terrainInfo', cell }); };
  const expand = () => { if (!placed) { pushToast('Avval xaritada bo‘sh joyni tanlab davlat tuzing', 'warn'); return; } const speak = Math.random() < profile.speakPref; send({ t: 'exercise', purpose: 'expand', speak }); setState({ exerciseBusy: true }); };
  const speakEx = () => { if (!placed) return; send({ t: 'exercise', purpose: 'expand', speak: true }); };
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <MapGL onCellPress={onCellPress} cameraRef={camRef} focusCell={focusCell} />
      {/* top */}
      <View style={[st.top, compact && { left: 6, right: 6, top: 6 }]} pointerEvents="box-none">
        <TopBar compact={compact} />
        <View style={{ alignItems: 'center', marginTop: 6 }} pointerEvents="box-none"><IncomeIndicator compact={compact} onExpand={expand} /></View>
        <View style={{ alignItems: 'center', marginTop: 6 }} pointerEvents="none"><Toasts /></View>
      </View>
      {/* left column */}
      {!compact && <View style={st.left} pointerEvents="box-none">
        {showLb && <Leaderboard />}
        {me && placed && <Panel style={{ width: 250, marginTop: 8 }}>
          <H5>Davlat</H5>
          <KV k="Qo‘shin madaniyati" v={familyName(me.family)} />
          <KV k="Ball / daraja" v={`${me.score} / ${me.level}`} />
          <KV k="Obro‘" v={me.reputation} vColor={me.reputation < 80 ? C.amber : C.text} />
          <KV k="Madrasa / karvonsaroy / qal’a" v={`${me.landmarks.madrasa} / ${me.landmarks.caravanserai} / ${me.landmarks.fortress}`} />
          <KV k="Writing / speaking" v={`${me.stats.wOk}/${me.stats.w} · ${me.stats.sOk}/${me.stats.s}`} />
        </Panel>}
        <View style={{ marginTop: 8 }}><Attacks /></View>
      </View>}
      {/* right column */}
      <View style={[st.right, compact && st.rightCompact]} pointerEvents="box-none">
        {panel === 'country' && <CountryPanel compact={compact} />}
        {panel === 'diplomacy' && <Diplomacy compact={compact} />}
        {compact && panel === 'none' && showLb && <Leaderboard />}
      </View>
      {/* placement banner */}
      {!placed && phase !== 'ended' && (
        <View style={st.center} pointerEvents="none"><Panel style={{ alignItems: 'center', paddingHorizontal: 24 }}><Text style={st.banner}>Boshlang‘ich joyni tanlang</Text><Muted>{countdown > 0 ? `${countdown} s · ` : ''}xaritada bo‘sh quruqlikka bosing, keyin “Shu yerda davlat tuzish”</Muted><Muted style={{ marginTop: 2 }}>Tanlangan mintaqa qo‘shin madaniyatini belgilaydi</Muted></Panel></View>
      )}
      {/* bottom */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[st.bottom, compact && { left: 0, right: 0, bottom: 0 }]} pointerEvents="box-none">
        {exercise && <View style={{ alignItems: 'center', marginBottom: compact ? 0 : 8 }} pointerEvents="box-none"><ExerciseSheet compact={compact} /></View>}
        <View style={[st.actions, compact && { paddingBottom: 8 }]} pointerEvents="box-none">
          <Btn title="✎ Kengaytirish" kind="primary" onPress={expand} disabled={!placed} />
          <Btn title="🎤" onPress={speakEx} disabled={!placed} />
          <Btn title="🤝" onPress={() => setState({ panel: panel === 'diplomacy' ? 'none' : 'diplomacy' })} />
          {compact && <Btn title="☰" onPress={() => { setShowLb(v => !v); setState({ panel: 'none' }); }} />}
          <Btn title="✖" kind="ghost" small onPress={() => { disconnect(); setState({ screen: 'lobby' }); }} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
function familyName(id: string): string {
  const m: Record<string, string> = { 'turkic-mongol': 'Turkiy-mo‘g‘ul', seljuk: 'Saljuqiy', ottoman: 'Usmoniy', mamluk: 'Mamluk', arab: 'Arab', persian: 'Fors', 'west-european': 'G‘arbiy Yevropa', byzantine: 'Vizantiya', 'east-european': 'Sharqiy Yevropa', 'north-european': 'Shimoliy Yevropa', mediterranean: 'O‘rta yer dengizi', indian: 'Hind', chinese: 'Xitoy', 'japan-korea': 'Yapon-koreys', 'southeast-asia': 'Janubi-sharqiy Osiyo', 'west-africa': 'G‘arbiy Afrika', 'east-africa': 'Sharqiy Afrika', americas: 'Amerika' };
  return m[id] ?? id;
}
const st = StyleSheet.create({
  top: { position: 'absolute', left: 10, right: 10, top: 10 },
  left: { position: 'absolute', left: 10, top: 120, width: 250 },
  right: { position: 'absolute', right: 10, top: 120, width: 340, alignItems: 'flex-end' },
  rightCompact: { right: 6, left: 6, top: 90, width: 'auto', alignItems: 'stretch' },
  center: { position: 'absolute', left: 0, right: 0, top: '42%', alignItems: 'center' },
  banner: { color: C.gold, fontFamily: F.display, fontSize: 20, fontWeight: '700' },
  bottom: { position: 'absolute', left: 10, right: 10, bottom: 12 },
  actions: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' },
});
