import { Platform } from 'react-native';

export const C = {
  panel: 'rgba(24,19,14,0.88)', panelSolid: '#1a140f', line: 'rgba(217,178,95,0.35)', text: '#f1e6cf', muted: '#b9a98c',
  gold: '#d9b25f', red: '#e2574e', green: '#5fbf7a', amber: '#e8a33d', rose: '#e5534b', purple: '#9a6bd6', blue: '#4f8fd9',
  primary: '#8c2f28', primaryBorder: '#b8473f', danger: '#5b2a86', white: '#fff', bg: '#14110d',
};
export const F = {
  display: Platform.select({ web: 'Cinzel, Georgia, serif', ios: 'Georgia', android: 'serif', default: 'serif' }) as string,
  ui: Platform.select({ web: '"Source Sans 3", "Segoe UI", system-ui, sans-serif', ios: 'System', android: 'sans-serif', default: 'System' }) as string,
};
export const RELATION_COLORS: Record<string, [number, number, number]> = { self: [140, 47, 40], ally: [58, 143, 74], war: [91, 42, 134] };
export const rgb = (c: [number, number, number]) => `rgb(${c[0]},${c[1]},${c[2]})`;
