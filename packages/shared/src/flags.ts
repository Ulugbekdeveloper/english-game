// Three-layer flag constructor: background, pattern, symbol. Predefined assets only.
export const FLAG_PALETTE = ['#8c2f28', '#d9b25f', '#1f4e79', '#3a8f4a', '#f1e6cf', '#1b1611', '#5b2a86', '#c9662a', '#2b7a78', '#a83a5c', '#e8e2d2', '#6b4a1e'];
export type FlagBgKind = 'solid' | 'split-v' | 'split-h' | 'diag' | 'cross';
export type FlagPattern = 'none' | 'stripes' | 'girih' | 'border' | 'chevron';
export type FlagSymbol = 'none' | 'rings' | 'lion' | 'crescent' | 'sun' | 'sword' | 'star' | 'eagle' | 'shield';
export interface FlagSpec { bg: { kind: FlagBgKind; c1: number; c2?: number }; pattern?: { id: FlagPattern; color: number }; symbol?: { id: FlagSymbol; color: number; scale?: number } }
export const FLAG_PATTERNS: FlagPattern[] = ['none', 'stripes', 'girih', 'border', 'chevron'];
export const FLAG_SYMBOLS: FlagSymbol[] = ['none', 'rings', 'lion', 'crescent', 'sun', 'sword', 'star', 'eagle', 'shield'];
export const FLAG_BG_KINDS: FlagBgKind[] = ['solid', 'split-v', 'split-h', 'diag', 'cross'];

export function defaultFlag(seed = 0): FlagSpec {
  const n = FLAG_PALETTE.length;
  return { bg: { kind: 'split-v', c1: seed % n, c2: (seed + 1) % n }, pattern: { id: 'none', color: (seed + 1) % n }, symbol: { id: 'rings', color: 4, scale: 1 } };
}
/** Relative luminance contrast check between symbol and background colour (>= 3:1). */
function lum(hex: string): number {
  const c = hex.replace('#', '');
  const f = (i: number) => { const v = parseInt(c.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(0) + 0.7152 * f(2) + 0.0722 * f(4);
}
export function flagIsValid(spec: FlagSpec): { ok: boolean; reason?: string } {
  const n = FLAG_PALETTE.length;
  const idx = [spec.bg.c1, spec.bg.c2 ?? 0, spec.pattern?.color ?? 0, spec.symbol?.color ?? 0];
  if (idx.some(i => i < 0 || i >= n || !Number.isInteger(i))) return { ok: false, reason: 'rang' };
  if (!FLAG_BG_KINDS.includes(spec.bg.kind)) return { ok: false, reason: 'fon' };
  if (spec.bg.kind !== 'solid' && spec.bg.c1 === spec.bg.c2) return { ok: false, reason: 'ikki rang bir xil' };
  if (spec.symbol && spec.symbol.id !== 'none') {
    const l1 = lum(FLAG_PALETTE[spec.symbol.color]), l2 = lum(FLAG_PALETTE[spec.bg.c1]);
    const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    if (contrast < 3) return { ok: false, reason: 'ramz va fon kontrasti kam' };
  }
  return { ok: true };
}
/** SVG markup for a flag (w x h). Works on web and in react-native-svg via SvgXml. */
export function flagSvg(spec: FlagSpec, w = 100, h = 130): string {
  const c = (i: number) => FLAG_PALETTE[i] ?? FLAG_PALETTE[0];
  const k = spec.bg.kind, c1 = c(spec.bg.c1), c2 = c(spec.bg.c2 ?? spec.bg.c1);
  let bg = `<rect width="${w}" height="${h}" fill="${c1}"/>`;
  if (k === 'split-v') bg += `<rect x="${w / 2}" width="${w / 2}" height="${h}" fill="${c2}"/>`;
  else if (k === 'split-h') bg += `<rect y="${h / 2}" width="${w}" height="${h / 2}" fill="${c2}"/>`;
  else if (k === 'diag') bg += `<path d="M0 0L${w} ${h}V0z" fill="${c2}"/>`;
  else if (k === 'cross') bg += `<rect x="${w * 0.4}" width="${w * 0.2}" height="${h}" fill="${c2}"/><rect y="${h * 0.4}" width="${w}" height="${h * 0.2}" fill="${c2}"/>`;
  let pat = '';
  if (spec.pattern && spec.pattern.id !== 'none') {
    const pc = c(spec.pattern.color);
    if (spec.pattern.id === 'stripes') pat = Array.from({ length: 5 }, (_, i) => `<rect y="${i * h / 5 + h / 10 - 2}" width="${w}" height="4" fill="${pc}" opacity=".7"/>`).join('');
    else if (spec.pattern.id === 'girih') pat = Array.from({ length: 12 }, (_, i) => { const cx = (i % 4) * w / 4 + w / 8, cy = Math.floor(i / 4) * h / 3 + h / 6; return `<rect x="${cx - 5}" y="${cy - 5}" width="10" height="10" transform="rotate(45 ${cx} ${cy})" fill="${pc}" opacity=".55"/>`; }).join('');
    else if (spec.pattern.id === 'border') pat = `<rect x="6" y="6" width="${w - 12}" height="${h - 12}" fill="none" stroke="${pc}" stroke-width="4"/>`;
    else if (spec.pattern.id === 'chevron') pat = `<path d="M0 ${h * 0.35}L${w / 2} ${h * 0.55}L${w} ${h * 0.35}V${h * 0.45}L${w / 2} ${h * 0.65}L0 ${h * 0.45}z" fill="${pc}" opacity=".8"/>`;
  }
  let sym = '';
  if (spec.symbol && spec.symbol.id !== 'none') {
    const s = c(spec.symbol.color), cx = w / 2, cy = h / 2, r = w * 0.14 * (spec.symbol.scale ?? 1);
    switch (spec.symbol.id) {
      case 'rings': sym = `<g fill="none" stroke="${s}" stroke-width="5"><circle cx="${cx - r * 0.8}" cy="${cy - r * 0.5}" r="${r}"/><circle cx="${cx + r * 0.8}" cy="${cy - r * 0.5}" r="${r}"/><circle cx="${cx}" cy="${cy + r * 0.9}" r="${r}"/></g>`; break;
      case 'crescent': sym = `<circle cx="${cx}" cy="${cy}" r="${r * 1.5}" fill="${s}"/><circle cx="${cx + r * 0.6}" cy="${cy}" r="${r * 1.3}" fill="${c1}"/>`; break;
      case 'sun': sym = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${s}"/>` + Array.from({ length: 8 }, (_, i) => `<rect x="${cx - 3}" y="${cy - r * 2.2}" width="6" height="${r * 0.8}" fill="${s}" transform="rotate(${i * 45} ${cx} ${cy})"/>`).join(''); break;
      case 'lion': sym = `<path d="M${cx - r * 1.4} ${cy + r * 1.3} l${r * 0.6} -${r * 2.2} l${r * 0.5} ${r * 0.9} l${r * 0.5} -${r * 1.4} l${r * 0.5} ${r * 1.2} l${r * 0.7} -${r * 0.9} l-${r * 0.3} ${r * 2.4} z" fill="${s}"/>`; break;
      case 'sword': sym = `<rect x="${cx - 3}" y="${cy - r * 2}" width="6" height="${r * 3.6}" fill="${s}"/><rect x="${cx - r}" y="${cy + r * 0.6}" width="${r * 2}" height="5" fill="${s}"/>`; break;
      case 'star': sym = `<polygon points="${Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? r * 0.6 : r * 1.5; return (cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1); }).join(' ')}" fill="${s}"/>`; break;
      case 'eagle': sym = `<path d="M${cx} ${cy - r * 1.6} l${r * 0.5} ${r * 0.8} l${r * 1.4} -${r * 0.4} l-${r * 1.0} ${r * 1.2} l${r * 0.3} ${r * 1.2} l-${r * 1.2} -${r * 0.7} l-${r * 1.2} ${r * 0.7} l${r * 0.3} -${r * 1.2} l-${r * 1.0} -${r * 1.2} l${r * 1.4} ${r * 0.4} z" fill="${s}"/>`; break;
      case 'shield': sym = `<path d="M${cx - r * 1.2} ${cy - r * 1.4} h${r * 2.4} v${r * 1.6} q0 ${r * 1.2} -${r * 1.2} ${r * 1.6} q-${r * 1.2} -${r * 0.4} -${r * 1.2} -${r * 1.6} z" fill="${s}"/>`; break;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${bg}${pat}${sym}</svg>`;
}
