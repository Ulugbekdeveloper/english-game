import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStore } from '../store';
import { C } from '../theme';

const COLORS: Record<string, string> = { info: C.gold, ok: C.green, warn: C.amber, war: C.rose, ally: C.green };
export function Toasts() {
  const toasts = useStore(s => s.toasts);
  return (
    <View style={st.wrap} pointerEvents="none">
      {toasts.map(t => <View key={t.id} style={[st.toast, { borderLeftColor: COLORS[t.kind] }]}><Text style={st.text}>{t.text}</Text></View>)}
    </View>
  );
}
const st = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  toast: { backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderLeftWidth: 4, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, maxWidth: 520 },
  text: { color: C.text, fontSize: 13, fontWeight: '600' },
});
