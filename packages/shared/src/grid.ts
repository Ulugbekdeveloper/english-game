// World grid: equirectangular, W x H cells. Cell index i = y * W + x. Longitude wraps.
import terrainData from '../data/terrain.json';
import citiesData from '../data/cities.json';

export const W: number = terrainData.w;
export const H: number = terrainData.h;
export const CELLS = W * H;

export enum Terrain { Sea = 0, Plains = 1, Forest = 2, Desert = 3, Mountain = 4, Ice = 5 }

export interface City { name: string; lon: number; lat: number; kind: 'madrasa' | 'caravanserai' | 'fortress'; x: number; y: number }
export const CITIES: City[] = citiesData as City[];

export function decodeRle(rle: number[], length: number): Uint8Array {
  const out = new Uint8Array(length);
  let i = 0;
  for (let k = 0; k < rle.length; k += 2) { out.fill(rle[k], i, i + rle[k + 1]); i += rle[k + 1]; }
  return out;
}

let _terrain: Uint8Array | null = null;
export function terrainGrid(): Uint8Array {
  if (!_terrain) _terrain = decodeRle(terrainData.rle as number[], CELLS);
  return _terrain;
}

export function cellOf(x: number, y: number): number { return y * W + ((x % W) + W) % W; }
export function xyOf(i: number): [number, number] { const x = i % W; return [x, (i - x) / W]; }
export function lonLatToCell(lon: number, lat: number): number {
  const x = Math.floor((lon + 180) * (W / 360));
  const y = Math.min(H - 1, Math.max(0, Math.floor((90 - lat) * (H / 180))));
  return cellOf(x, y);
}
export function cellToLonLat(i: number): [number, number] {
  const [x, y] = xyOf(i);
  return [x / (W / 360) - 180 + 180 / W, 90 - y / (H / 180) - 90 / H];
}
/** 4-neighbours with longitude wrap; -1 where off the poles. */
export function neighbors(i: number, out: Int32Array | number[]): void {
  const x = i % W, y = (i - x) / W;
  out[0] = y * W + ((x + 1) % W);
  out[1] = y * W + ((x - 1 + W) % W);
  out[2] = y > 0 ? i - W : -1;
  out[3] = y < H - 1 ? i + W : -1;
}
export function isLand(t: number): boolean { return t > 0 && t !== Terrain.Ice; }
export function cellDistance(a: number, b: number): number {
  const [ax, ay] = xyOf(a), [bx, by] = xyOf(b);
  let dx = Math.abs(ax - bx); if (dx > W / 2) dx = W - dx;
  return Math.hypot(dx, ay - by);
}
/** Approximate km between two cells (cell is 0.25 degrees). */
export function cellKm(a: number, b: number): number {
  const [alon, alat] = cellToLonLat(a), [blon, blat] = cellToLonLat(b);
  const R = 6371, toR = Math.PI / 180;
  const dlat = (blat - alat) * toR, dlon = (blon - alon) * toR;
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(alat * toR) * Math.cos(blat * toR) * Math.sin(dlon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
