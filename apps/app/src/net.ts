import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { ClientMsg, ServerMsg } from '@eg/shared';
import { setState, getState, pushToast, applySnapshot, applyDelta } from './store';

let ws: WebSocket | null = null;
let reconnectTimer: any = null;

export function defaultServerUrl(): string {
  const env = (process.env as any).EXPO_PUBLIC_SERVER_URL as string | undefined;
  if (env) return env;
  if (Platform.OS === 'web' && typeof location !== 'undefined') return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:8787`;
  const host = (Constants.expoConfig as any)?.hostUri?.split(':')[0];
  return `ws://${host || 'localhost'}:8787`;
}

export function send(m: ClientMsg) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); }

export function connect(url = getState().serverUrl || defaultServerUrl()): Promise<void> {
  setState({ serverUrl: url });
  return new Promise((resolve, reject) => {
    try { ws = new WebSocket(url); } catch (e) { reject(e); return; }
    ws.onopen = () => { setState({ connected: true }); const p = getState().profile; send({ t: 'hello', name: p.name, flag: p.flag, level: p.level }); resolve(); };
    ws.onerror = () => { reject(new Error('ulanmadi')); };
    ws.onclose = () => { setState({ connected: false }); if (getState().screen === 'game') pushToast('Server bilan aloqa uzildi', 'war'); };
    ws.onmessage = (ev) => { let m: ServerMsg; try { m = JSON.parse(String(ev.data)); } catch { return; } handle(m); };
  });
}
export function disconnect() { ws?.close(); ws = null; }

function handle(m: ServerMsg) {
  switch (m.t) {
    case 'rooms': setState({ rooms: m.rooms }); break;
    case 'welcome':
      applySnapshot(m.ownersRle);
      setState({ screen: 'game', me: m.me, room: m.room, players: m.players, phase: m.phase, time: m.time, placementEndsAt: Date.now() + m.placementEndsIn * 1000, gameOver: null, panel: 'none', exercise: null, answerResult: null, attacks: [], proposals: [], chats: [] });
      break;
    case 'state': setState({ time: m.time, phase: m.phase, players: m.players, mePriv: m.me, attacks: m.attacks, proposals: m.proposals, ranking: m.ranking, room: getState().room }); break;
    case 'delta': applyDelta(m.cells, m.owners); break;
    case 'exercise': setState({ exercise: m.ex, answerResult: null, exerciseBusy: false }); break;
    case 'answerResult': setState({ answerResult: m.r, exerciseBusy: false }); setTimeout(() => setState(s => s.answerResult?.exerciseId === m.r.exerciseId ? { exercise: null, answerResult: null } : {}), 2800); break;
    case 'toast': pushToast(m.text, m.kind); break;
    case 'proposal': setState(s => ({ proposals: [...s.proposals.filter(p => p.id !== m.p.id), m.p] })); if (m.p.to === getState().me && m.p.status === 'pending') pushToast(`Ittifoq taklifi keldi (Diplomatiya panelida)`, 'ally'); break;
    case 'chat': setState(s => ({ chats: [...s.chats.slice(-60), { ...m, at: Date.now() }] })); break;
    case 'terrain': setState({ terrain: m.r, panel: 'country' }); break;
    case 'gameOver': setState({ screen: 'result', gameOver: { winnerName: m.winnerName, ranking: m.ranking, myRank: m.myRank, me: m.me } }); break;
    case 'error': pushToast(m.msg, 'warn'); setState({ exerciseBusy: false }); break;
  }
}
