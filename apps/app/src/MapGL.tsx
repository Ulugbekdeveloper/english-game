// World map renderer: one WebGL quad, terrain + ownership textures, borders computed in the fragment shader.
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, PanResponder, Platform, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { W, H, terrainGrid, CITIES } from '@eg/shared';
import { owners, dirtyCells, useStore } from './store';
import { C, F, RELATION_COLORS } from './theme';

const VERT = `attribute vec2 aPos; varying vec2 vScreen; void main(){ vScreen = aPos; gl_Position = vec4(aPos, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
varying vec2 vScreen;
uniform vec2 uView;      // viewport size in px
uniform vec2 uCam;       // camera centre in cells
uniform float uZoom;     // px per cell
uniform vec2 uGrid;      // W,H
uniform sampler2D uTerrain, uOwner, uPalette;
uniform float uTime;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 terrainColor(float t, vec2 cell, float lat){
  float n = hash(floor(cell)) * 0.12 - 0.06;
  if (t < 0.5) { float d = 0.5 + 0.5 * sin(cell.x * 0.07 + uTime * 0.3) * sin(cell.y * 0.11 - uTime * 0.2); return mix(vec3(0.20,0.33,0.48), vec3(0.27,0.42,0.58), d * 0.6 + n); }
  if (t < 1.5) return vec3(0.77,0.70,0.52) + n;
  if (t < 2.5) return vec3(0.50,0.58,0.37) + n;
  if (t < 3.5) return vec3(0.87,0.77,0.51) + n;
  if (t < 4.5) return vec3(0.54,0.46,0.37) + n * 1.8;
  return vec3(0.91,0.91,0.88) + n * 0.5;
}
float ownerAt(vec2 cell){ vec2 uv = (cell + 0.5) / uGrid; uv.x = fract(uv.x); vec4 o = texture2D(uOwner, uv); return o.r * 255.0 + o.g * 255.0 * 256.0; }
void main(){
  vec2 px = (vScreen * 0.5 + 0.5) * uView;
  px.y = uView.y - px.y;
  vec2 world = (px - uView * 0.5) / uZoom + uCam;
  vec2 cell = floor(world);
  if (cell.y < 0.0 || cell.y >= uGrid.y) { gl_FragColor = vec4(0.08,0.07,0.06,1.0); return; }
  vec2 uv = (cell + 0.5) / uGrid; uv.x = fract(uv.x);
  float t = texture2D(uTerrain, uv).r * 255.0;
  vec3 col = terrainColor(t, cell, uv.y);
  float o = ownerAt(cell);
  if (o > 0.5) {
    vec4 pal = texture2D(uPalette, vec2((o + 0.5) / 1024.0, 0.5));
    col = mix(col, pal.rgb, 0.55);
    float oe = ownerAt(cell + vec2(1.0, 0.0)), ow = ownerAt(cell - vec2(1.0, 0.0)), on = ownerAt(cell - vec2(0.0, 1.0)), os = ownerAt(cell + vec2(0.0, 1.0));
    bool border = abs(oe - o) > 0.5 || abs(ow - o) > 0.5 || abs(on - o) > 0.5 || abs(os - o) > 0.5;
    if (border) { float flash = pal.a < 0.5 ? 0.0 : (0.5 + 0.5 * sin(uTime * 8.0)); vec3 bc = mix(pal.rgb * 0.45, vec3(1.0, 0.3, 0.25), flash); col = mix(col, bc, 0.85); }
  }
  // subtle grid at high zoom
  if (uZoom > 14.0) { vec2 f = fract(world); float g = (f.x < 0.04 || f.y < 0.04) ? 0.06 : 0.0; col -= g; }
  gl_FragColor = vec4(col, 1.0);
}`;

export interface Camera { cx: number; cy: number; zoom: number }
interface Props { onCellPress: (cell: number) => void; cameraRef?: React.MutableRefObject<Camera>; focusCell?: number }

export function MapGL({ onCellPress, cameraRef, focusCell }: Props) {
  const cam = useRef<Camera>({ cx: W * 0.62, cy: H * 0.28, zoom: 2.2 });
  if (cameraRef) cameraRef.current = cam.current;
  const size = useRef({ w: 1, h: 1, dpr: 1 });
  const glRef = useRef<{ gl: ExpoWebGLRenderingContext; prog: WebGLProgram; tex: { terrain: WebGLTexture; owner: WebGLTexture; palette: WebGLTexture }; u: Record<string, WebGLUniformLocation | null> } | null>(null);
  const ownerBytes = useRef(new Uint8Array(W * H * 4));
  const paletteBytes = useRef(new Uint8Array(1024 * 4));
  const [labelTick, setLabelTick] = useState(0);
  const players = useStore(s => s.players);
  const me = useStore(s => s.me);
  const raf = useRef<number>(0);
  const lastUpload = useRef(0);

  // palette from players (relation-aware colours, alpha flags "under attack")
  useEffect(() => {
    const p = paletteBytes.current; p.fill(0);
    for (const pl of players) {
      if (pl.id >= 1024) continue;
      const c = pl.relation === 'self' ? RELATION_COLORS.self : pl.relation === 'ally' ? RELATION_COLORS.ally : pl.relation === 'war' ? RELATION_COLORS.war : pl.color;
      const k = pl.id * 4; p[k] = c[0]; p[k + 1] = c[1]; p[k + 2] = c[2]; p[k + 3] = pl.underAttack && (pl.relation === 'self' || pl.relation === 'war') ? 255 : 0;
    }
    const g = glRef.current; if (g) { g.gl.bindTexture(g.gl.TEXTURE_2D, g.tex.palette); g.gl.texSubImage2D(g.gl.TEXTURE_2D, 0, 0, 0, 1024, 1, g.gl.RGBA, g.gl.UNSIGNED_BYTE, p); }
  }, [players]);

  useEffect(() => { if (focusCell !== undefined && focusCell >= 0) { const x = focusCell % W, y = (focusCell - x) / W; cam.current.cx = x; cam.current.cy = y; cam.current.zoom = Math.max(cam.current.zoom, 6); } }, [focusCell]);

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    const compile = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
    const prog = gl.createProgram()!; gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos'); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const mkTex = (unit: number, w: number, h: number, data: ArrayBufferView, format: number) => { const t = gl.createTexture()!; gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texImage2D(gl.TEXTURE_2D, 0, format, w, h, 0, format, gl.UNSIGNED_BYTE, data as any); return t; };
    const terrain = terrainGrid(); const tb = new Uint8Array(W * H * 4); for (let i = 0; i < W * H; i++) { tb[i * 4] = terrain[i]; tb[i * 4 + 3] = 255; }
    const texTerrain = mkTex(0, W, H, tb, gl.RGBA);
    const ob = ownerBytes.current; for (let i = 0; i < W * H; i++) { ob[i * 4] = owners[i] & 255; ob[i * 4 + 1] = owners[i] >> 8; ob[i * 4 + 3] = 255; }
    const texOwner = mkTex(1, W, H, ob, gl.RGBA);
    const texPalette = mkTex(2, 1024, 1, paletteBytes.current, gl.RGBA);
    const u: Record<string, WebGLUniformLocation | null> = {}; for (const n of ['uView', 'uCam', 'uZoom', 'uGrid', 'uTerrain', 'uOwner', 'uPalette', 'uTime']) u[n] = gl.getUniformLocation(prog, n);
    gl.uniform1i(u.uTerrain, 0); gl.uniform1i(u.uOwner, 1); gl.uniform1i(u.uPalette, 2); gl.uniform2f(u.uGrid, W, H);
    glRef.current = { gl, prog, tex: { terrain: texTerrain, owner: texOwner, palette: texPalette }, u };
    dirtyCells.length = 0; dirtyCells.push(-1);
    const t0 = Date.now();
    const loop = () => {
      const g = glRef.current; if (!g) return;
      const { gl } = g; const { w, h, dpr } = size.current;
      const pw = Math.max(1, Math.round(w * dpr)), ph = Math.max(1, Math.round(h * dpr));
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      // upload ownership changes (throttled)
      const now = Date.now();
      if (dirtyCells.length && now - lastUpload.current > 150) {
        lastUpload.current = now; const ob = ownerBytes.current;
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, g.tex.owner);
        if (dirtyCells[0] === -1 || dirtyCells.length > 4000) { for (let i = 0; i < W * H; i++) { ob[i * 4] = owners[i] & 255; ob[i * 4 + 1] = owners[i] >> 8; } gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, ob); }
        else { let minY = H, maxY = -1; for (const c of dirtyCells) { const y = (c / W) | 0; ob[c * 4] = owners[c] & 255; ob[c * 4 + 1] = owners[c] >> 8; if (y < minY) minY = y; if (y > maxY) maxY = y; } gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, minY, W, maxY - minY + 1, gl.RGBA, gl.UNSIGNED_BYTE, ob.subarray(minY * W * 4, (maxY + 1) * W * 4)); }
        dirtyCells.length = 0;
      }
      gl.useProgram(g.prog);
      gl.uniform2f(g.u.uView, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform2f(g.u.uCam, cam.current.cx, cam.current.cy);
      gl.uniform1f(g.u.uZoom, cam.current.zoom * dpr);
      gl.uniform1f(g.u.uTime, (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.flush(); (gl as any).endFrameEXP?.();
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  }, []);
  useEffect(() => () => { cancelAnimationFrame(raf.current); glRef.current = null; }, []);

  // ---- input: drag to pan, wheel / pinch to zoom, tap to select ----
  const gesture = useRef({ x: 0, y: 0, cx: 0, cy: 0, moved: false, dist: 0, zoom0: 1 });
  const screenToCell = (x: number, y: number) => { const { w, h } = size.current; const wx = (x - w / 2) / cam.current.zoom + cam.current.cx; const wy = (y - h / 2) / cam.current.zoom + cam.current.cy; const cx = ((Math.floor(wx) % W) + W) % W, cy = Math.floor(wy); if (cy < 0 || cy >= H) return -1; return cy * W + cx; };
  const clampCam = () => { const c = cam.current; c.zoom = Math.min(40, Math.max(0.8, c.zoom)); c.cy = Math.min(H, Math.max(0, c.cy)); c.cx = ((c.cx % W) + W) % W; };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => { const t = e.nativeEvent; gesture.current = { x: t.locationX, y: t.locationY, cx: cam.current.cx, cy: cam.current.cy, moved: false, dist: 0, zoom0: cam.current.zoom }; },
    onPanResponderMove: (e, gs) => {
      const touches = e.nativeEvent.touches;
      if (touches && touches.length >= 2) {
        const dx = touches[0].pageX - touches[1].pageX, dy = touches[0].pageY - touches[1].pageY; const d = Math.hypot(dx, dy);
        if (!gesture.current.dist) { gesture.current.dist = d; gesture.current.zoom0 = cam.current.zoom; }
        cam.current.zoom = gesture.current.zoom0 * (d / gesture.current.dist); clampCam(); gesture.current.moved = true; return;
      }
      if (Math.abs(gs.dx) + Math.abs(gs.dy) > 4) gesture.current.moved = true;
      cam.current.cx = gesture.current.cx - gs.dx / cam.current.zoom; cam.current.cy = gesture.current.cy - gs.dy / cam.current.zoom; clampCam();
      setLabelTick(t => t + 1);
    },
    onPanResponderRelease: (e) => { if (!gesture.current.moved) { const c = screenToCell(gesture.current.x, gesture.current.y); if (c >= 0) onCellPress(c); } setLabelTick(t => t + 1); },
  })).current;
  const viewRef = useRef<any>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = viewRef.current as any; if (!el || !el.addEventListener) return;
    const onWheel = (ev: WheelEvent) => { ev.preventDefault(); const r = el.getBoundingClientRect(); const mx = ev.clientX - r.left, my = ev.clientY - r.top; const { w, h } = size.current; const c = cam.current; const before = [(mx - w / 2) / c.zoom + c.cx, (my - h / 2) / c.zoom + c.cy]; c.zoom *= Math.exp(-ev.deltaY * 0.0015); clampCam(); c.cx = before[0] - (mx - w / 2) / c.zoom; c.cy = before[1] - (my - h / 2) / c.zoom; clampCam(); setLabelTick(t => t + 1); };
    el.addEventListener('wheel', onWheel, { passive: false }); return () => el.removeEventListener('wheel', onWheel);
  }, []);
  useEffect(() => { const id = setInterval(() => setLabelTick(t => t + 1), 1000); return () => clearInterval(id); }, []);
  const onLayout = (e: LayoutChangeEvent) => { const { width, height } = e.nativeEvent.layout; size.current = { w: width, h: height, dpr: Platform.OS === 'web' ? Math.min(2, (globalThis as any).devicePixelRatio || 1) : 1 }; };

  // ---- labels (HTML overlay) ----
  const { w, h } = size.current; const c = cam.current;
  const toScreen = (x: number, y: number) => { let dx = x - c.cx; if (dx > W / 2) dx -= W; if (dx < -W / 2) dx += W; return [w / 2 + dx * c.zoom, h / 2 + (y - c.cy) * c.zoom]; };
  const labels = players.filter(p => p.centroid && p.cells > 0 && p.alive).map(p => { const [sx, sy] = toScreen(p.centroid![0] + 0.5, p.centroid![1] + 0.5); const size = Math.min(22, Math.sqrt(p.cells) * c.zoom * 0.45); return { p, sx, sy, size }; }).filter(l => (l.size >= 9 || l.p.id === me) && l.sx > -80 && l.sx < w + 80 && l.sy > -30 && l.sy < h + 30);
  const cities = c.zoom >= 4 ? CITIES.map(ci => { const [sx, sy] = toScreen(ci.x + 0.5, ci.y + 0.5); return { ci, sx, sy }; }).filter(l => l.sx > -40 && l.sx < w + 40 && l.sy > -20 && l.sy < h + 20) : [];
  return (
    <View ref={viewRef} style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} onLayout={onLayout} {...pan.panHandlers}>
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
        {cities.map(({ ci, sx, sy }) => (
          <View key={ci.name} style={{ position: 'absolute', left: sx - 30, top: sy - 6, width: 60, alignItems: 'center' }}>
            <Text style={{ color: '#2a1d0c', fontSize: Math.min(12, c.zoom * 1.6), fontWeight: '700' }}>{ci.kind === 'madrasa' ? '◆' : ci.kind === 'fortress' ? '■' : '▲'}</Text>
            {c.zoom >= 6 && <Text style={{ color: '#2a1d0c', fontSize: 10, fontWeight: '600', textShadowColor: 'rgba(251,246,232,.9)', textShadowRadius: 3 }}>{ci.name}</Text>}
          </View>
        ))}
        {labels.map(({ p, sx, sy, size }) => (
          <View key={p.id} style={{ position: 'absolute', left: sx - 100, top: sy - size, width: 200, alignItems: 'center' }}>
            <Text numberOfLines={1} style={{ fontFamily: F.display, color: p.id === me ? '#fff' : '#1a120a', fontSize: size, fontWeight: '700', textShadowColor: p.id === me ? '#8c2f28' : 'rgba(251,246,232,.85)', textShadowRadius: 4 }}>{p.name}</Text>
            {size >= 12 && <Text style={{ color: '#1a120a', fontSize: size * 0.6, fontWeight: '600', textShadowColor: 'rgba(251,246,232,.85)', textShadowRadius: 3 }}>{p.cells} ▣  {p.army} ⚔</Text>}
          </View>
        ))}
      </View>
    </View>
  );
}
