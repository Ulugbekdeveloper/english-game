// Game rules shared by server (authoritative) and client (prediction and display).
import { Terrain } from './grid';

export const RULES = {
  tickMs: 250,                 // simulation tick
  matchSeconds: 30 * 60,       // 30 minutes
  placementSeconds: 20,
  maxHumans: 100,
  botCount: 120,
  startCells: 40,
  // Expansion-based army income: income/min = k * sqrt(territory) * multiplier
  incomeK: 1.0,
  activeSeconds: 30,           // 0..30 s after a real capture: 100%
  slowingSeconds: 60,          // 30..60 s: 50%, after: 0%
  startArmy: 40,
  learningBonusArmy: 5,        // per fully correct exercise
  // Expansion through exercises
  expandBaseCells: 30,         // cells captured for a perfect answer at score level 0
  expandScoreStep: 100,        // every N score points adds +25% cells
  fullThreshold: 0.8,          // similarity >= full -> 100%
  partialThreshold: 0.5,       // >= partial -> 50%
  wrongCooldownSeconds: 5,
  // Attacks
  attackCellsPerTick: 2,       // base capture speed per attack per tick
  surpriseAttackPower: 0.7,    // attack without declared war
  surpriseReputation: -10,
  recaptureWindowSeconds: 120, // retaking land lost recently is cheaper
  recaptureCostFactor: 0.6,
  returnTroopsFactor: 0.9,     // troops returned when an attack is stopped
  defenderLossPerCell: 0.5,
  seaAdjacencyKm: 1500,        // coast to coast
  // Diplomacy
  treatyBreakReputation: -25,
  treatyBreakArmyFactor: 0.8,
  // Historical landmark bonuses
  madrasaExerciseBonus: 0.2,
  caravanseraiIncomeBonus: 4,  // army/min
  fortressDefense: 0.25,
} as const;

export interface TerrainInfo { id: Terrain; key: string; nameUz: string; moveCost: number; defense: number; attackLoss: number; color: [number, number, number] }
export const TERRAIN: Record<number, TerrainInfo> = {
  [Terrain.Sea]: { id: Terrain.Sea, key: 'sea', nameUz: 'Dengiz', moveCost: 2.5, defense: 0, attackLoss: 0.5, color: [58, 94, 132] },
  [Terrain.Plains]: { id: Terrain.Plains, key: 'plains', nameUz: 'Tekislik', moveCost: 1.0, defense: 0, attackLoss: 0.05, color: [196, 180, 132] },
  [Terrain.Forest]: { id: Terrain.Forest, key: 'forest', nameUz: "O'rmon", moveCost: 1.3, defense: 0.1, attackLoss: 0.15, color: [128, 148, 96] },
  [Terrain.Desert]: { id: Terrain.Desert, key: 'desert', nameUz: "Cho'l", moveCost: 2.0, defense: 0, attackLoss: 0.25, color: [222, 196, 130] },
  [Terrain.Mountain]: { id: Terrain.Mountain, key: 'mountain', nameUz: "Tog'", moveCost: 2.5, defense: 0.25, attackLoss: 0.4, color: [138, 118, 96] },
  [Terrain.Ice]: { id: Terrain.Ice, key: 'ice', nameUz: 'Muz', moveCost: 99, defense: 0, attackLoss: 1, color: [232, 232, 226] },
};

export type IncomePhase = 'active' | 'slowing' | 'stopped';
export function incomePhase(secondsSinceCapture: number): IncomePhase {
  if (secondsSinceCapture < RULES.activeSeconds) return 'active';
  if (secondsSinceCapture < RULES.slowingSeconds) return 'slowing';
  return 'stopped';
}
export function incomeMultiplier(phase: IncomePhase): number { return phase === 'active' ? 1 : phase === 'slowing' ? 0.5 : 0; }
/** Army income per minute. */
export function armyIncomePerMin(territory: number, secondsSinceCapture: number, caravanserais = 0): number {
  const m = incomeMultiplier(incomePhase(secondsSinceCapture));
  return RULES.incomeK * Math.sqrt(Math.max(0, territory)) * m + caravanserais * RULES.caravanseraiIncomeBonus * m;
}
/** Cells captured from neutral land for an exercise with the given quality (0..1). */
export function expandCells(score: number, quality: number, madrasas = 0): number {
  if (quality < RULES.partialThreshold) return 0;
  const q = quality >= RULES.fullThreshold ? 1 : 0.5;
  const scoreMult = 1 + 0.25 * Math.floor(score / RULES.expandScoreStep);
  const landmark = 1 + madrasas * RULES.madrasaExerciseBonus;
  return Math.round(RULES.expandBaseCells * q * scoreMult * landmark);
}
/** Troops lost while crossing one cell of the given terrain. */
export function crossingLoss(terrain: number, troops: number): number {
  return troops * (TERRAIN[terrain]?.attackLoss ?? 0.1) * 0.25;
}

// ---- text grading (writing and recognised speech) ----
export function normalizeAnswer(s: string): string {
  return s.toLowerCase().replace(/[’'`]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = new Array(n + 1), cur = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}
/** 0..1 similarity of an answer against accepted answers (best match). */
export function gradeAnswer(answer: string, accepted: string[]): number {
  const a = normalizeAnswer(answer);
  if (!a) return 0;
  let best = 0;
  for (const acc of accepted) {
    const b = normalizeAnswer(acc);
    const d = levenshtein(a, b);
    const sim = 1 - d / Math.max(a.length, b.length, 1);
    if (sim > best) best = sim;
  }
  return Math.max(0, Math.min(1, best));
}
