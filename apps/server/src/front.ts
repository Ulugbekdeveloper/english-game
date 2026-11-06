// A "front" captures cells of `target` (0 = neutral, or an enemy id) adjacent to cells owned by `owner`.
import { CELLS, neighbors, terrainGrid, isLand } from '@eg/shared';

const NB = new Int32Array(4);

export class Front {
  frontier: number[] = [];
  private seen = new Set<number>();
  constructor(public owner: number, public target: number, private owners: Uint16Array, seedCells?: number[]) {
    const terrain = terrainGrid();
    if (seedCells) {
      for (const c of seedCells) if (owners[c] === target && isLand(terrain[c])) { this.seen.add(c); this.frontier.push(c); }
    } else {
      for (let i = 0; i < CELLS; i++) {
        if (owners[i] !== owner) continue;
        neighbors(i, NB);
        for (let k = 0; k < 4; k++) { const j = NB[k]; if (j >= 0 && !this.seen.has(j) && owners[j] === target && isLand(terrain[j])) { this.seen.add(j); this.frontier.push(j); } }
      }
    }
  }
  get exhausted(): boolean { return this.frontier.length === 0; }
  /** Pops one capturable cell (still owned by target), or -1. Caller sets the new owner, then calls `expandFrom`. */
  next(): number {
    while (this.frontier.length) {
      const k = Math.floor(Math.random() * this.frontier.length);
      const c = this.frontier[k];
      this.frontier[k] = this.frontier[this.frontier.length - 1]; this.frontier.pop();
      if (this.owners[c] === this.target) return c;
    }
    return -1;
  }
  expandFrom(c: number): void {
    const terrain = terrainGrid();
    neighbors(c, NB);
    for (let k = 0; k < 4; k++) { const j = NB[k]; if (j >= 0 && !this.seen.has(j) && this.owners[j] === this.target && isLand(terrain[j])) { this.seen.add(j); this.frontier.push(j); } }
  }
}

/** Cells of `b` adjacent (4-neighbourhood) to cells of `a`. Stops early when `limit` found. */
export function borderCells(owners: Uint16Array, a: number, b: number, limit = 1_000_000): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  for (let i = 0; i < CELLS && out.length < limit; i++) {
    if (owners[i] !== a) continue;
    neighbors(i, NB);
    for (let k = 0; k < 4; k++) { const j = NB[k]; if (j >= 0 && owners[j] === b && !seen.has(j)) { seen.add(j); out.push(j); } }
  }
  return out;
}
/** Owned land cells touching the sea. */
export function coastCells(owners: Uint16Array, pid: number, limit = 400): number[] {
  const terrain = terrainGrid();
  const out: number[] = [];
  let stride = 1;
  for (let i = 0; i < CELLS && out.length < limit; i += stride) {
    if (owners[i] !== pid) continue;
    neighbors(i, NB);
    for (let k = 0; k < 4; k++) { const j = NB[k]; if (j >= 0 && terrain[j] === 0) { out.push(i); break; } }
  }
  return out;
}
