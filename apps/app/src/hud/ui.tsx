import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle, type TextStyle, type StyleProp } from 'react-native';
import { C, F } from '../theme';

export function Panel({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[st.panel, style]}>{children}</View>;
}
export function Btn({ title, onPress, kind = 'default', disabled, style, small }: { title: string; onPress?: () => void; kind?: 'default' | 'primary' | 'danger' | 'ghost'; disabled?: boolean; style?: StyleProp<ViewStyle>; small?: boolean }) {
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={({ pressed }) => [st.btn, kind === 'primary' && st.btnPrimary, kind === 'danger' && st.btnDanger, kind === 'ghost' && st.btnGhost, small && st.btnSmall, disabled && { opacity: 0.45 }, pressed && { opacity: 0.8 }, style]}>
      <Text style={[st.btnText, small && { fontSize: 12 }]}>{title}</Text>
    </Pressable>
  );
}
export function Chip({ text, color, bg }: { text: string; color: string; bg?: string }) {
  return <View style={[st.chip, { borderColor: color, backgroundColor: bg ?? 'transparent' }]}><Text style={{ color, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 }}>{text}</Text></View>;
}
export function H5({ children }: { children: React.ReactNode }) { return <Text style={st.h5}>{children}</Text>; }
export function Muted({ children, style }: { children: React.ReactNode; style?: TextStyle }) { return <Text style={[{ color: C.muted, fontSize: 12 }, style]}>{children}</Text>; }
export function KV({ k, v, vColor }: { k: string; v: string | number; vColor?: string }) {
  return <View style={st.kv}><Text style={{ color: C.muted, fontSize: 12 }}>{k}</Text><Text style={{ color: vColor ?? C.text, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{v}</Text></View>;
}
export const st = StyleSheet.create({
  panel: { backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 8, padding: 10 },
  btn: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 6, borderWidth: 1, borderColor: C.line, backgroundColor: 'rgba(24,19,14,0.92)', alignItems: 'center', justifyContent: 'center', minHeight: 40 },
  btnPrimary: { backgroundColor: C.primary, borderColor: C.primaryBorder },
  btnDanger: { backgroundColor: C.danger, borderColor: '#7a44aa' },
  btnGhost: { backgroundColor: 'transparent' },
  btnSmall: { paddingVertical: 5, paddingHorizontal: 10, minHeight: 30 },
  btnText: { color: C.text, fontWeight: '700', fontSize: 14 },
  chip: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, borderWidth: 1 },
  h5: { color: C.gold, fontFamily: F.display, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6, fontWeight: '700' },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
});
