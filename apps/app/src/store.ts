// Minimal external store with React subscription (no extra dependency).
import { useSyncExternalStore } from 'react';
import { CELLS, rleDecodeInto } from '@eg/shared';
import type { PlayerPublic, PlayerPrivate, AttackState, Proposal, RoomSummary, RoomPhase, ExerciseOut, AnswerResult, RankingRow, TerrainReply, FlagSpec, Level } from '@eg/shared';

export interface Toast { id: number; text: string; kind: 'info' | 'ok' | 'warn' | 'war' | 'ally'; at: number }
export interface ChatMsg { from: number; fromName: string; text: string; points: number; at: number }
export interface Profile { name: string; flag: FlagSpec; level: Level; speakPref: number }
export interface State {
  screen: 'lobby' | 'game' | 'result';
  connected: boolean; serverUrl: string;
  profile: Profile;
  rooms: RoomSummary[];
  room: RoomSummary | null; me: number; phase: RoomPhase; time: number; placementEndsAt: number;
  players: PlayerPublic[]; mePriv: PlayerPrivate | null; attacks: AttackState[]; proposals: Proposal[]; ranking: RankingRow[];
  exercise: ExerciseOut | null; answerResult: AnswerResult | null; exerciseBusy: boolean;
  terrain: TerrainReply | null; selectedCell: number;
  toasts: Toast[]; chats: ChatMsg[]; chatWith: number;
  panel: 'none' | 'attack' | 'diplomacy' | 'country';
  gameOver: { winnerName: string; ranking: RankingRow[]; myRank: number; me: PlayerPrivate } | null;
  ownersVersion: number;
}
export const owners = new Uint16Array(CELLS);          // authoritative copy, updated from snapshots and deltas
export const dirtyCells: number[] = [];                 // cells changed since last texture upload (-1 = everything)

let state: State = {
  screen: 'lobby', connected: false, serverUrl: '',
  profile: { name: '', flag: { bg: { kind: 'split-v', c1: 0, c2: 1 }, pattern: { id: 'none', color: 1 }, symbol: { id: 'rings', color: 4, scale: 1 } }, level: 'A2', speakPref: 0.5 },
  rooms: [], room: null, me: 0, phase: 'waiting', time: 0, placementEndsAt: 0,
  players: [], mePriv: null, attacks: [], proposals: [], ranking: [],
  exercise: null, answerResult: null, exerciseBusy: false,
  terrain: null, selectedCell: -1,
  toasts: [], chats: [], chatWith: 0, panel: 'none', gameOver: null, ownersVersion: 0,
};
const listeners = new Set<() => void>();
export function getState() { return state; }
export function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  for (const l of listeners) l();
}
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => sel(state), () => sel(state));
}
let toastSeq = 1;
export function pushToast(text: string, kind: Toast['kind'] = 'info') {
  const t: Toast = { id: toastSeq++, text, kind, at: Date.now() };
  setState(s => ({ toasts: [...s.toasts.slice(-4), t] }));
  setTimeout(() => setState(s => ({ toasts: s.toasts.filter(x => x.id !== t.id) })), 4500);
}
export function applySnapshot(rle: number[]) { rleDecodeInto(rle, owners); dirtyCells.length = 0; dirtyCells.push(-1); setState(s => ({ ownersVersion: s.ownersVersion + 1 })); }
export function applyDelta(cells: number[], ids: number[]) { for (let i = 0; i < cells.length; i++) { owners[cells[i]] = ids[i]; dirtyCells.push(cells[i]); } }
export function playerById(id: number): PlayerPublic | undefined { return state.players.find(p => p.id === id); }
