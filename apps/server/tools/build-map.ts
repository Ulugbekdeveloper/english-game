/**
 * Builds the world grid used by the game:
 *  - packages/shared/data/terrain.json  : RLE-encoded terrain class per cell (W x H, equirectangular)
 *  - packages/shared/data/cities.json   : historical cities with grid coordinates
 *
 * Source: Natural Earth land polygons (world-atlas land-50m, public domain), rasterized with a
 * scanline even-odd fill. Terrain classes come from latitude/longitude boxes (v1 approximation).
 */
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const topo = require('world-atlas/land-50m.json');
const { feature } = require('topojson-client');

const W = 1440, H = 720; // 0.25° cells
const SEA = 0, PLAINS = 1, FOREST = 2, DESERT = 3, MOUNTAIN = 4, ICE = 5;

const land = feature(topo, topo.objects.land);
const grid = new Uint8Array(W * H);

// ---- rasterize land (even-odd across all rings) ----
const rowX: number[][] = Array.from({ length: H }, () => []);
const toX = (lon: number) => (lon + 180) * (W / 360);
const toY = (lat: number) => (90 - lat) * (H / 180);
function addRing(ring: number[][]) {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    const x0 = toX(a[0]), y0 = toY(a[1]), x1 = toX(b[0]), y1 = toY(b[1]);
    if (y0 === y1) continue;
    const yStart = Math.max(0, Math.ceil(Math.min(y0, y1) - 0.5));
    const yEnd = Math.min(H - 1, Math.floor(Math.max(y0, y1) - 0.5));
    for (let y = yStart; y <= yEnd; y++) {
      const yc = y + 0.5;
      // half-open rule to avoid double counting vertices
      if ((yc >= y0 && yc < y1) || (yc >= y1 && yc < y0)) {
        const t = (yc - y0) / (y1 - y0);
        rowX[y].push(x0 + t * (x1 - x0));
      }
    }
  }
}
const geoms = land.type === 'FeatureCollection' ? land.features.map((f: any) => f.geometry) : [land.geometry];
for (const g of geoms) {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (const poly of polys) for (const ring of poly) addRing(ring);
}
for (let y = 0; y < H; y++) {
  const xs = rowX[y].sort((a, b) => a - b);
  for (let i = 0; i + 1 < xs.length; i += 2) {
    const xa = Math.max(0, Math.ceil(xs[i] - 0.5)), xb = Math.min(W - 1, Math.floor(xs[i + 1] - 0.5));
    for (let x = xa; x <= xb; x++) grid[y * W + x] = PLAINS;
  }
}

// ---- terrain classes from boxes [latMin, latMax, lonMin, lonMax] ----
const inBox = (lat: number, lon: number, b: number[]) => lat >= b[0] && lat <= b[1] && lon >= b[2] && lon <= b[3];
const deserts = [[15, 31, -17, 35], [14, 31, 35, 58], [36, 46, 53, 68], [38, 46, 95, 116], [24, 30, 68, 74], [-30, -20, 120, 140], [-28, -20, 18, 26], [-27, -18, -71, -68], [30, 38, -116, -105], [28, 36, 54, 62]];
const mountains = [[27, 37, 72, 100], [37, 44, 68, 86], [44, 48, 6, 14], [41, 44, 40, 48], [28, 37, 45, 54], [-40, 5, -76, -67], [35, 56, -122, -105], [52, 66, 57, 62], [30, 35, -8, 5], [6, 14, 36, 40], [36, 42, -6, -1], [35, 40, 30, 42], [36, 39, 55, 61], [46, 52, 84, 96]];
const forests = [[55, 68, -180, 180], [-10, 5, -76, -50], [-5, 5, 12, 30], [45, 55, -130, -60], [50, 60, 20, 60]];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = y * W + x;
  if (!grid[i]) continue;
  const lon = x / (W / 360) - 180 + 0.125, lat = 90 - y / (H / 180) - 0.125;
  let t = PLAINS;
  if (lat > 70 || lat < -60) t = ICE;
  else if (forests.some(b => inBox(lat, lon, b))) t = FOREST;
  if (deserts.some(b => inBox(lat, lon, b))) t = DESERT;
  if (mountains.some(b => inBox(lat, lon, b))) t = MOUNTAIN;
  grid[i] = t;
}

// ---- RLE ----
const rle: number[] = [];
let cur = grid[0], n = 0;
for (const v of grid) { if (v === cur) n++; else { rle.push(cur, n); cur = v; n = 1; } }
rle.push(cur, n);
const counts = [0, 0, 0, 0, 0, 0];
for (const v of grid) counts[v]++;

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../../../packages/shared/data');
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'terrain.json'), JSON.stringify({ w: W, h: H, rle }));
console.log('terrain', { W, H, counts, rlePairs: rle.length / 2 });

// ---- cities (name, lon, lat, kind) ----
const CITIES: [string, number, number, string][] = [
  ['Samarqand', 66.97, 39.65, 'madrasa'], ['Buxoro', 64.42, 39.77, 'madrasa'], ['Xiva', 60.36, 41.38, 'caravanserai'], ['O‘tror', 68.3, 42.85, 'caravanserai'],
  ['Hirot', 62.2, 34.34, 'fortress'], ['Isfahon', 51.68, 32.65, 'madrasa'], ['Tabriz', 46.3, 38.08, 'caravanserai'], ['Bag‘dod', 44.4, 33.3, 'madrasa'],
  ['Konstantinopol', 28.97, 41.0, 'fortress'], ['Qohira', 31.24, 30.05, 'madrasa'], ['Damashq', 36.3, 33.5, 'caravanserai'], ['Makka', 39.8, 21.4, 'madrasa'],
  ['Dehli', 77.2, 28.6, 'fortress'], ['Vijayanagar', 76.46, 15.33, 'fortress'], ['Qashqar', 75.99, 39.47, 'caravanserai'], ['Qoraqurum', 102.85, 47.2, 'caravanserai'],
  ['Xonbaliq', 116.4, 39.9, 'fortress'], ['Xanchjou', 120.17, 30.25, 'caravanserai'], ['Kioto', 135.77, 35.0, 'fortress'], ['Malakka', 102.25, 2.2, 'caravanserai'],
  ['Venetsiya', 12.33, 45.44, 'caravanserai'], ['Rim', 12.5, 41.9, 'madrasa'], ['Parij', 2.35, 48.85, 'fortress'], ['London', -0.12, 51.5, 'fortress'], ['Kordova', -4.78, 37.88, 'madrasa'],
  ['Novgorod', 31.3, 58.5, 'caravanserai'], ['Saroy', 46.5, 47.4, 'caravanserai'], ['Timbuktu', -3.0, 16.77, 'madrasa'], ['Kilva', 39.5, -8.96, 'caravanserai'], ['Aksum', 38.72, 14.12, 'fortress'],
  ['Tenochtitlan', -99.13, 19.43, 'fortress'], ['Kusko', -71.97, -13.52, 'fortress'], ['Kaxokiya', -90.06, 38.65, 'caravanserai'], ['Buyuk Zimbabve', 30.93, -20.27, 'fortress'], ['Urganch', 60.63, 41.55, 'fortress'],
  ['Kiyev', 30.5, 50.45, 'fortress'], ['Krakov', 19.94, 50.06, 'fortress'], ['Stokgolm', 18.07, 59.33, 'fortress'], ['Edinburg', -3.19, 55.95, 'fortress'], ['Angkor', 103.87, 13.43, 'fortress'],
  ['Pagan', 94.86, 21.17, 'madrasa'], ['Ayutthaya', 100.57, 14.35, 'fortress'], ['Hanoy', 105.85, 21.03, 'fortress'], ['Gao', -0.04, 16.27, 'caravanserai'], ['Mbanza-Kongo', 14.25, -6.27, 'fortress'],
  ['Dongola', 30.47, 19.17, 'fortress'], ['Chichen-Itsa', -88.57, 20.68, 'fortress'], ['Kaesong', 126.55, 37.97, 'fortress'], ['Qozon', 49.11, 55.8, 'fortress'], ['Kabul', 69.17, 34.53, 'fortress']
];
const cities = CITIES.map(([name, lon, lat, kind]) => ({ name, lon, lat, kind, x: Math.floor(toX(lon)), y: Math.floor(toY(lat)) }));
writeFileSync(resolve(outDir, 'cities.json'), JSON.stringify(cities));
console.log('cities', cities.length);
