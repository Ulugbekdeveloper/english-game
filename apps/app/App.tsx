import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useStore } from './src/store';
import { Lobby } from './src/screens/Lobby';
import { Game } from './src/screens/Game';
import { Result } from './src/screens/Result';
import { Toasts } from './src/hud/Toasts';

export default function App() {
  const screen = useStore(s => s.screen);
  return (
    <View style={{ flex: 1, backgroundColor: '#14110d', overflow: 'hidden' }}>
      {screen === 'lobby' && <Lobby />}
      {screen === 'game' && <Game />}
      {screen === 'result' && <Result />}
      {screen !== 'game' && <View style={{ position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center' }} pointerEvents="none"><Toasts /></View>}
      <StatusBar style="light" />
    </View>
  );
}
