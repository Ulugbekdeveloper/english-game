// WebSocket protocol between the game server (authoritative) and clients. JSON messages, `t` is the type.
import type { FlagSpec } from './flags';
import type { ExerciseKind, Level } from './exercises';
import type { TerrainInfo } from './rules';

export type Relation = 'self' | 'ally' | 'war' | 'neutral';
export type RoomPhase = 'waiting' | 'playing' | 'ended';

export interface PlayerPublic {
  id: number; name: string; flag: FlagSpec | null; family: string; color: [number, number, number];
  cells: number; army: number; score: number; alive: boolean; isBot: boolean; placed: boolean; connected: boolean;
  reputation: number; centroid: [number, number] | null; sinceCapture: number; relation: Relation; underAttack: boolean;
}
export interface Landmarks { madrasa: number; caravanserai: number; fortress: number }
export interface PlayerPrivate extends PlayerPublic {
  level: Level; bonusArmy: number; stats: { w: number; wOk: number; s: number; sOk: number };
  missed: string[]; allies: number[]; wars: number[]; landmarks: Landmarks; attackPower: number; defenseBoost: number;
}
export interface AttackState {
  id: number; attacker: number; target: number; troops: number; sent: number; captured: number;
  status: 'moving' | 'fighting' | 'stopped' | 'done'; viaSea: boolean; power: number; lossFactor: number;
}
export interface TreatyTerms { noAttackMinutes: number; jointWar?: number; shareLand: boolean; exchangeExercises: boolean }
export interface Proposal { id: number; from: number; to: number; terms: TreatyTerms; text: string; status: 'pending' | 'accepted' | 'declined' | 'expired' }
export interface RoomSummary { id: string; humans: number; bots: number; elapsed: number; phase: RoomPhase; maxHumans: number }
export interface ExerciseOut { id: string; kind: ExerciseKind; level: Level; promptUz: string; display?: string; purpose: ExercisePurpose; targetId?: number; deadline: number }
export type ExercisePurpose = 'expand' | 'attack' | 'defend';
export interface AnswerResult {
  exerciseId: string; quality: number; correct: string; purpose: ExercisePurpose;
  effect: { cells?: number; army?: number; score?: number; attackPower?: number; defenseBoost?: number; timerReset?: boolean; cooldown?: number };
}
export interface Adjacency { land: boolean; sea: boolean; seaKm?: number }
export interface TerrainReply { cell: number; info: TerrainInfo; owner: number; ownerName?: string; relation: Relation; adjacency: Adjacency | null; nearestCity?: { name: string; kind: string; km: number } }
export interface RankingRow { id: number; name: string; cells: number; army: number; score: number; isBot: boolean }

export type ClientMsg =
  | { t: 'hello'; name: string; flag: FlagSpec | null; level?: Level }
  | { t: 'join'; roomId?: string }
  | { t: 'rooms' }
  | { t: 'place'; cell: number }
  | { t: 'exercise'; purpose: ExercisePurpose; speak: boolean; targetId?: number }
  | { t: 'answer'; exerciseId: string; answer: string }
  | { t: 'attack'; targetId: number; pct: number }
  | { t: 'stopAttack'; attackId: number }
  | { t: 'propose'; to: number; terms: TreatyTerms; text: string }
  | { t: 'respond'; proposalId: number; accept: boolean }
  | { t: 'declareWar'; to: number }
  | { t: 'chat'; to: number; text: string }
  | { t: 'terrainInfo'; cell: number }
  | { t: 'ping' };

export type ServerMsg =
  | { t: 'rooms'; rooms: RoomSummary[] }
  | { t: 'welcome'; me: number; room: RoomSummary; players: PlayerPublic[]; ownersRle: number[]; time: number; phase: RoomPhase; placementEndsIn: number }
  | { t: 'state'; time: number; phase: RoomPhase; players: PlayerPublic[]; me: PlayerPrivate; attacks: AttackState[]; proposals: Proposal[]; ranking: RankingRow[] }
  | { t: 'delta'; cells: number[]; owners: number[] }
  | { t: 'exercise'; ex: ExerciseOut }
  | { t: 'answerResult'; r: AnswerResult }
  | { t: 'toast'; text: string; kind: 'info' | 'ok' | 'warn' | 'war' | 'ally' }
  | { t: 'proposal'; p: Proposal }
  | { t: 'chat'; from: number; fromName: string; text: string; points: number }
  | { t: 'terrain'; r: TerrainReply }
  | { t: 'gameOver'; winner: number; winnerName: string; ranking: RankingRow[]; myRank: number; me: PlayerPrivate }
  | { t: 'error'; msg: string }
  | { t: 'pong' };

/** Run-length encode an owner grid as [value, count, value, count, ...]. */
export function rleEncode(arr: ArrayLike<number>): number[] {
  const out: number[] = [];
  if (!arr.length) return out;
  let cur = arr[0], n = 0;
  for (let i = 0; i < arr.length; i++) { const v = arr[i]; if (v === cur) n++; else { out.push(cur, n); cur = v; n = 1; } }
  out.push(cur, n);
  return out;
}
export function rleDecodeInto(rle: number[], out: Uint16Array): void {
  let i = 0;
  for (let k = 0; k < rle.length; k += 2) { out.fill(rle[k], i, i + rle[k + 1]); i += rle[k + 1]; }
}
