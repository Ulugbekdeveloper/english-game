import { WebSocket } from 'ws';
import {
  CELLS, W, H, terrainGrid, isLand, neighbors, xyOf, cellToLonLat, lonLatToCell, cellKm, CITIES,
  RULES, TERRAIN, incomePhase, armyIncomePerMin, expandCells, gradeAnswer, crossingLoss,
  familyForLonLat, familyById, BOT_FACTIONS, FAMILIES, flagIsValid, pickExercise, EXERCISES,
  rleEncode,
} from '@eg/shared';
import type {
  ClientMsg, ServerMsg, PlayerPublic, PlayerPrivate, AttackState, Proposal, RoomSummary, RoomPhase, Relation,
  FlagSpec, Level, ExerciseItem, ExercisePurpose, RankingRow, TreatyTerms, Landmarks, TerrainReply,
} from '@eg/shared';
import { Front, borderCells, coastCells } from './front';

const NB = new Int32Array(4);
let roomSeq = 1, playerSeq = 1, attackSeq = 1, proposalSeq = 1, exerciseSeq = 1;

interface PendingExercise { id: string; item: ExerciseItem; purpose: ExercisePurpose; targetId?: number; createdAt: number }
interface Attack { id: number; attacker: number; target: number; troops: number; sent: number; captured: number; status: AttackState['status']; viaSea: boolean; power: number; lossFactor: number; front: Front; surprise: boolean }
interface Expansion { pid: number; remaining: number; front: Front }

export class Player {
  id = playerSeq++;
  cells = 0; army: number = RULES.startArmy; score = 0; alive = true; placed = false; connected = true;
  reputation = 100; lastCaptureAt = -1; bonusArmy = 0; level: Level = 'A2';
  stats = { w: 0, wOk: 0, s: 0, sOk: 0 }; missed: string[] = [];
  allies = new Set<number>(); wars = new Set<number>(); treatyUntil = new Map<number, number>();
  attackPower = 0; attackPowerUntil = 0; defenseBoost = 0; defenseBoostUntil = 0; cooldownUntil = 0;
  pending: PendingExercise | null = null; recent = new Set<string>();
  family = 'turkic-mongol'; color: [number, number, number] = [140, 47, 40];
  centroid: [number, number] | null = null; centroidSum = [0, 0, 0];
  underAttackUntil = 0; acc = 0; home = -1; speakPref = 0.5;
  botNext = 0;
  constructor(public name: string, public flag: FlagSpec | null, public isBot: boolean, public ws: WebSocket | null) {}
  send(m: ServerMsg) { if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(m)); }
}

export class Room {
  id = 'r' + roomSeq++;
  phase: RoomPhase = 'waiting';
  time = 0;                    // seconds since match start
  owners = new Uint16Array(CELLS);
  prevOwner = new Uint16Array(CELLS);
  lostAt = new Float32Array(CELLS).fill(-1e9);
  players = new Map<number, Player>();
  attacks = new Map<number, Attack>();
  expansions: Expansion[] = [];
  proposals = new Map<number, Proposal>();
  changed = new Set<number>();
  private timer: NodeJS.Timeout | null = null;
  private lastState = 0; private started = false; private lastCentroid = 0;
  placementEnds = 0;

  constructor() { this.spawnBots(); this.timer = setInterval(() => this.tick(), RULES.tickMs); }

  // ---------- players ----------
  humans(): Player[] { return [...this.players.values()].filter(p => !p.isBot); }
  summary(): RoomSummary {
    const humans = this.humans().filter(p => p.connected).length;
    return { id: this.id, humans, bots: this.players.size - this.humans().length, elapsed: Math.floor(this.time), phase: this.phase, maxHumans: RULES.maxHumans };
  }
  addHuman(name: string, flag: FlagSpec | null, ws: WebSocket, level: Level): Player {
    const p = new Player(name.slice(0, 24) || 'O‘yinchi', flag && flagIsValid(flag).ok ? flag : null, false, ws);
    p.level = level;
    this.players.set(p.id, p);
    if (this.phase === 'waiting' && !this.started) { this.started = true; this.placementEnds = Date.now() + RULES.placementSeconds * 1000; }
    p.send({ t: 'welcome', me: p.id, room: this.summary(), players: this.publicPlayers(p), ownersRle: rleEncode(this.owners), time: this.time, phase: this.phase, placementEndsIn: Math.max(0, (this.placementEnds - Date.now()) / 1000) });
    this.broadcastToast(`${p.name} xonaga qo‘shildi`, 'info', p.id);
    return p;
  }
  disconnect(p: Player) { p.connected = false; p.ws = null; }

  spawnBots() {
    const terrain = terrainGrid();
    const used: number[] = [];
    const tryPlace = (cell: number) => {
      if (cell < 0 || !isLand(terrain[cell]) || this.owners[cell]) return false;
      for (const u of used) { const [ax, ay] = xyOf(u), [bx, by] = xyOf(cell); if (Math.abs(ax - bx) < 14 && Math.abs(ay - by) < 14) return false; }
      return true;
    };
    const makeBot = (name: string, family: string, cell: number, size: number) => {
      const b = new Player(name, null, true, null);
      b.family = family; b.color = jitter(familyById(family).color, b.id);
      b.army = 40 + Math.floor(Math.random() * 120); b.level = 'A2';
      this.players.set(b.id, b); used.push(cell); b.home = cell; b.placed = true;
      this.captureInstant(b, cell); const f = new Front(b.id, 0, this.owners);
      for (let n = 0; n < size; n++) { const c = f.next(); if (c < 0) break; this.setOwner(c, b.id); f.expandFrom(c); }
      b.lastCaptureAt = 0; b.botNext = 2 + Math.random() * 8;
    };
    for (const f of BOT_FACTIONS) { const cell = nearestLand(f.home[0], f.home[1]); if (tryPlace(cell)) makeBot(f.name, f.family, cell, 60 + Math.floor(Math.random() * 260)); }
    let guard = 0;
    while (this.players.size < RULES.botCount && guard++ < 5000) {
      const cell = Math.floor(Math.random() * CELLS);
      if (!tryPlace(cell)) continue;
      const [lon, lat] = cellToLonLat(cell); const fam = familyForLonLat(lon, lat);
      makeBot(`${familyById(fam).nameUz.split(/[- ]/)[0]} beklik ${this.players.size + 1}`, fam, cell, 20 + Math.floor(Math.random() * 120));
    }
  }

  // ---------- ownership ----------
  setOwner(i: number, pid: number) {
    const o = this.owners[i];
    if (o === pid) return;
    if (o) { const p = this.players.get(o); if (p) { p.cells--; } this.prevOwner[i] = o; this.lostAt[i] = this.time; }
    this.owners[i] = pid;
    if (pid) { const p = this.players.get(pid); if (p) p.cells++; }
    this.changed.add(i);
  }
  captureInstant(p: Player, cell: number) { this.setOwner(cell, p.id); }
  /** Capture a cell for `p`; returns true when it counts as genuinely new land (resets the expansion timer). */
  captureFor(p: Player, cell: number): boolean {
    const fresh = !(this.prevOwner[cell] === p.id && this.time - this.lostAt[cell] < RULES.recaptureWindowSeconds);
    this.setOwner(cell, p.id);
    if (fresh) p.lastCaptureAt = this.time;
    return fresh;
  }

  // ---------- placement ----------
  place(p: Player, cell: number) {
    if (p.placed || this.phase === 'ended') return p.send({ t: 'error', msg: 'Allaqachon joylashgansiz' });
    const terrain = terrainGrid();
    if (cell < 0 || cell >= CELLS || !isLand(terrain[cell]) || this.owners[cell]) return p.send({ t: 'error', msg: 'Bu joy band yoki quruqlik emas' });
    const [lon, lat] = cellToLonLat(cell);
    p.family = familyForLonLat(lon, lat); p.color = [140, 47, 40]; p.home = cell; p.placed = true;
    this.captureFor(p, cell);
    this.expansions.push({ pid: p.id, remaining: RULES.startCells - 1, front: new Front(p.id, 0, this.owners) });
    const fam = familyById(p.family);
    p.send({ t: 'toast', text: `Davlat tuzildi. Qo‘shin madaniyati: ${fam.nameUz} (${fam.units.join(', ')})`, kind: 'ok' });
    if (this.phase === 'waiting') this.phase = 'playing';
  }

  // ---------- exercises ----------
  giveExercise(p: Player, purpose: ExercisePurpose, speak: boolean, targetId?: number) {
    if (!p.placed) return p.send({ t: 'error', msg: 'Avval joy tanlang' });
    if (this.time < p.cooldownUntil) return p.send({ t: 'error', msg: `Kuting: ${Math.ceil(p.cooldownUntil - this.time)} s` });
    const item = pickExercise(p.level, speak, p.recent);
    const ex: PendingExercise = { id: 'e' + exerciseSeq++, item, purpose, targetId, createdAt: this.time };
    p.pending = ex; p.recent.add(item.id); if (p.recent.size > 12) p.recent.delete([...p.recent][0]);
    p.send({ t: 'exercise', ex: { id: ex.id, kind: item.kind, level: item.level, promptUz: item.promptUz, display: item.display, purpose, targetId, deadline: 45 } });
  }
  answer(p: Player, exerciseId: string, answer: string) {
    const ex = p.pending;
    if (!ex || ex.id !== exerciseId) return p.send({ t: 'error', msg: 'Mashq topilmadi' });
    p.pending = null;
    const quality = gradeAnswer(answer, ex.item.accepted);
    const isSpeak = ex.item.kind === 'speak';
    if (isSpeak) p.stats.s++; else p.stats.w++;
    const full = quality >= RULES.fullThreshold, partial = quality >= RULES.partialThreshold;
    if (full) { if (isSpeak) p.stats.sOk++; else p.stats.wOk++; }
    const effect: any = {};
    if (!partial) {
      p.cooldownUntil = this.time + RULES.wrongCooldownSeconds; effect.cooldown = RULES.wrongCooldownSeconds;
      const missed = ex.item.kind === 'word' ? ex.item.accepted[0] : (ex.item.display ?? ex.item.accepted[0]);
      if (!p.missed.includes(missed)) p.missed.push(missed);
      p.send({ t: 'answerResult', r: { exerciseId, quality, correct: ex.item.accepted[0], purpose: ex.purpose, effect } });
      return;
    }
    const scoreGain = full ? 10 : 5; p.score += scoreGain; effect.score = scoreGain;
    if (full) { p.army += RULES.learningBonusArmy; p.bonusArmy += RULES.learningBonusArmy; effect.army = RULES.learningBonusArmy; }
    if (ex.purpose === 'expand') {
      const lm = this.landmarks(p);
      const n = expandCells(p.score, quality, lm.madrasa);
      effect.cells = n; effect.timerReset = n > 0;
      if (n > 0) this.expansions.push({ pid: p.id, remaining: n, front: new Front(p.id, 0, this.owners) });
    } else if (ex.purpose === 'attack') {
      p.attackPower = full ? 1 : 0.75; p.attackPowerUntil = this.time + 90; effect.attackPower = p.attackPower;
    } else if (ex.purpose === 'defend') {
      p.defenseBoost = full ? 0.3 : 0.15; p.defenseBoostUntil = this.time + 30; effect.defenseBoost = p.defenseBoost;
    }
    p.send({ t: 'answerResult', r: { exerciseId, quality, correct: ex.item.accepted[0], purpose: ex.purpose, effect } });
  }

  // ---------- adjacency ----------
  adjacency(a: Player, b: Player): { land: boolean; sea: boolean; seaKm?: number } {
    const land = borderCells(this.owners, a.id, b.id, 1).length > 0;
    let sea = false, seaKm: number | undefined;
    if (!land) {
      const ca = coastCells(this.owners, a.id, 300), cb = coastCells(this.owners, b.id, 300);
      let best = Infinity;
      for (let i = 0; i < ca.length; i += Math.max(1, Math.floor(ca.length / 60))) for (let j = 0; j < cb.length; j += Math.max(1, Math.floor(cb.length / 60))) { const d = cellKm(ca[i], cb[j]); if (d < best) best = d; }
      if (best <= RULES.seaAdjacencyKm) { sea = true; seaKm = Math.round(best); }
    }
    return { land, sea, seaKm };
  }

  // ---------- attacks ----------
  startAttack(p: Player, targetId: number, pct: number) {
    const t = this.players.get(targetId);
    if (!t || !t.alive || t.id === p.id) return p.send({ t: 'error', msg: 'Nishon topilmadi' });
    if (p.allies.has(t.id)) return p.send({ t: 'error', msg: 'Ittifoqdoshga hujum qilib bo‘lmaydi. Avval shartnomani buzing.' });
    if (!p.placed || p.cells === 0) return;
    const adj = this.adjacency(p, t);
    if (!adj.land && !adj.sea) return p.send({ t: 'error', msg: 'Chegaradosh emas: quruqlik yoki dengiz orqali chegara kerak' });
    const troops = Math.floor(p.army * Math.min(1, Math.max(0.05, pct)));
    if (troops < 5) return p.send({ t: 'error', msg: 'Qo‘shin yetarli emas' });
    const surprise = !p.wars.has(t.id);
    if (surprise) { p.reputation += RULES.surpriseReputation; p.wars.add(t.id); t.wars.add(p.id); if (!p.isBot || !t.isBot) this.broadcastToast(`${p.name} ${t.name}ga e’lonsiz hujum boshladi`, 'war'); }
    const power = (this.time < p.attackPowerUntil ? p.attackPower : 0.6) * (surprise ? RULES.surpriseAttackPower : 1);
    p.army -= troops;
    let front: Front; let sent = troops;
    if (adj.land) front = new Front(p.id, t.id, this.owners, borderCells(this.owners, p.id, t.id));
    else {
      const seaLoss = Math.min(0.5, (adj.seaKm ?? 500) / 3000); sent = Math.round(troops * (1 - seaLoss));
      front = new Front(p.id, t.id, this.owners, coastCells(this.owners, t.id, 200));
    }
    const a: Attack = { id: attackSeq++, attacker: p.id, target: t.id, troops: sent, sent: troops, captured: 0, status: 'fighting', viaSea: !adj.land, power, lossFactor: 0, front, surprise };
    this.attacks.set(a.id, a);
    t.underAttackUntil = this.time + 8;
    t.send({ t: 'toast', text: `⚠ ${p.name} sizga hujum qilmoqda${a.viaSea ? ' (dengiz orqali)' : ''}!`, kind: 'war' });
    p.send({ t: 'toast', text: `⚔ Hujum boshlandi: ${sent} qo‘shin${a.viaSea ? `, dengiz orqali (${adj.seaKm} km, yo‘lda ${troops - sent} yo‘qotildi)` : ''}`, kind: 'info' });
  }
  stopAttack(p: Player, attackId: number) {
    const a = this.attacks.get(attackId);
    if (!a || a.attacker !== p.id || a.status !== 'fighting') return;
    a.status = 'stopped';
    const back = Math.floor(a.troops * RULES.returnTroopsFactor); p.army += back; a.troops = 0;
    p.send({ t: 'toast', text: `■ Hujum to‘xtatildi: ${a.captured} hudud sizniki qoldi, ${back} qo‘shin qaytdi`, kind: 'info' });
  }
  private stepAttack(a: Attack) {
    const atk = this.players.get(a.attacker), def = this.players.get(a.target);
    if (!atk || !def) { a.status = 'done'; return; }
    const terrain = terrainGrid();
    const defBoost = this.time < def.defenseBoostUntil ? def.defenseBoost : 0;
    const lm = this.landmarks(def);
    const density = def.cells ? Math.min(2, def.army / Math.max(1, def.cells) * 4) : 0;
    let steps = RULES.attackCellsPerTick + (a.power >= 1 ? 1 : 0);
    while (steps-- > 0 && a.troops > 0 && def.cells > 0) {
      const c = a.front.next();
      if (c < 0) { a.status = 'done'; break; }
      const tInfo = TERRAIN[terrain[c]];
      const recapture = this.prevOwner[c] === atk.id && this.time - this.lostAt[c] < RULES.recaptureWindowSeconds;
      let cost = (1 + tInfo.attackLoss * 2 + tInfo.defense * 2 + defBoost + density * 0.5 + lm.fortress * RULES.fortressDefense * 0.2) / a.power;
      if (recapture) cost *= RULES.recaptureCostFactor;
      a.troops -= cost; a.lossFactor = cost;
      def.army = Math.max(0, def.army - RULES.defenderLossPerCell);
      this.captureFor(atk, c); a.front.expandFrom(c); a.captured++;
      atk.score += 0.2;
      def.underAttackUntil = this.time + 6;
      if (def.cells === 0) this.eliminate(def, atk);
    }
    if (a.troops <= 0) { a.troops = 0; a.status = 'done'; }
    if (a.status === 'done' && atk.ws) atk.send({ t: 'toast', text: `Hujum tugadi: ${a.captured} hudud egallandi`, kind: 'info' });
  }
  eliminate(def: Player, by: Player) {
    def.alive = false;
    this.broadcastToast(`☠ ${def.name} qulatildi (${by.name} tomonidan)`, 'war');
    def.send({ t: 'toast', text: 'Davlatingiz qulagan. Siz tomoshabin rejimidasiz.', kind: 'war' });
    for (const [id, a] of this.attacks) if (a.attacker === def.id) a.status = 'done';
    this.checkEnd();
  }

  // ---------- diplomacy ----------
  propose(p: Player, to: number, terms: TreatyTerms, text: string) {
    const t = this.players.get(to); if (!t || !t.alive) return;
    const pr: Proposal = { id: proposalSeq++, from: p.id, to, terms: { noAttackMinutes: Math.min(30, Math.max(1, terms.noAttackMinutes | 0)), jointWar: terms.jointWar, shareLand: !!terms.shareLand, exchangeExercises: !!terms.exchangeExercises }, text: String(text || '').slice(0, 200), status: 'pending' };
    this.proposals.set(pr.id, pr);
    t.send({ t: 'proposal', p: pr }); p.send({ t: 'proposal', p: pr });
    if (t.isBot) setTimeout(() => this.respond(t, pr.id, Math.random() < (p.reputation >= 90 ? 0.7 : 0.3)), 3000 + Math.random() * 4000);
  }
  respond(p: Player, proposalId: number, accept: boolean) {
    const pr = this.proposals.get(proposalId); if (!pr || pr.to !== p.id || pr.status !== 'pending') return;
    pr.status = accept ? 'accepted' : 'declined';
    const from = this.players.get(pr.from); if (!from) return;
    if (accept) {
      from.allies.add(p.id); p.allies.add(from.id);
      from.wars.delete(p.id); p.wars.delete(from.id);
      const until = this.time + pr.terms.noAttackMinutes * 60; from.treatyUntil.set(p.id, until); p.treatyUntil.set(from.id, until);
      for (const [, a] of this.attacks) if ((a.attacker === p.id && a.target === from.id) || (a.attacker === from.id && a.target === p.id)) a.status = 'stopped';
      this.broadcastToast(`🤝 Ittifoq: ${from.name} + ${p.name}`, 'ally');
      if (pr.terms.jointWar) { const tgt = this.players.get(pr.terms.jointWar); if (tgt && tgt.alive) { this.declareWar(from, tgt.id, true); this.declareWar(p, tgt.id, true); } }
    } else from.send({ t: 'toast', text: `${p.name} ittifoq taklifini rad etdi`, kind: 'warn' });
    from.send({ t: 'proposal', p: pr }); p.send({ t: 'proposal', p: pr });
  }
  declareWar(p: Player, to: number, joint = false) {
    const t = this.players.get(to); if (!t || !t.alive || t.id === p.id) return;
    if (p.allies.has(to)) {
      p.allies.delete(to); t.allies.delete(p.id); p.reputation += RULES.treatyBreakReputation; p.army = Math.floor(p.army * RULES.treatyBreakArmyFactor);
      this.broadcastToast(`${p.name} ${t.name} bilan shartnomani buzdi (obro‘ ${RULES.treatyBreakReputation}, qo‘shin -20%)`, 'war');
    }
    p.wars.add(to); t.wars.add(p.id);
    if (!p.isBot || !t.isBot) this.broadcastToast(`⚔ ${p.name} ${t.name}ga urush e’lon qildi${joint ? ' (ittifoq bilan)' : ''}`, 'war');
  }
  chat(p: Player, to: number, text: string) {
    const t = this.players.get(to); if (!t) return;
    const clean = String(text).slice(0, 240);
    const english = /^[\x00-\x7F]+$/.test(clean) && clean.split(' ').length >= 3;
    const points = english ? 3 : 0; p.score += points;
    const m: ServerMsg = { t: 'chat', from: p.id, fromName: p.name, text: clean, points };
    t.send(m); p.send(m);
    if (t.isBot) setTimeout(() => p.send({ t: 'chat', from: t.id, fromName: t.name, text: botReply(), points: 0 }), 2000);
  }

  // ---------- info ----------
  terrainInfo(p: Player, cell: number) {
    if (cell < 0 || cell >= CELLS) return;
    const terrain = terrainGrid(); const info = TERRAIN[terrain[cell]];
    const owner = this.owners[cell]; const op = owner ? this.players.get(owner) : undefined;
    const [lon, lat] = cellToLonLat(cell);
    let nearest: TerrainReply['nearestCity']; let best = Infinity;
    for (const c of CITIES) { const d = cellKm(cell, lonLatToCell(c.lon, c.lat)); if (d < best) { best = d; nearest = { name: c.name, kind: c.kind, km: Math.round(d) }; } }
    const adjacency = op && op.id !== p.id && p.placed ? this.adjacency(p, op) : null;
    p.send({ t: 'terrain', r: { cell, info, owner, ownerName: op?.name, relation: op ? this.relation(p, op) : 'neutral', adjacency, nearestCity: nearest } });
  }
  relation(p: Player, o: Player): Relation { return o.id === p.id ? 'self' : p.allies.has(o.id) ? 'ally' : p.wars.has(o.id) ? 'war' : 'neutral'; }
  landmarks(p: Player): Landmarks {
    const lm: Landmarks = { madrasa: 0, caravanserai: 0, fortress: 0 };
    for (const c of CITIES) if (this.owners[c.y * W + c.x] === p.id) lm[c.kind]++;
    return lm;
  }
  publicPlayers(viewer?: Player): PlayerPublic[] {
    return [...this.players.values()].filter(p => p.placed || !p.isBot).map(p => this.pub(p, viewer));
  }
  pub(p: Player, viewer?: Player): PlayerPublic {
    return { id: p.id, name: p.name, flag: p.flag, family: p.family, color: p.color, cells: p.cells, army: Math.floor(p.army), score: Math.floor(p.score), alive: p.alive, isBot: p.isBot, placed: p.placed, connected: p.connected, reputation: p.reputation, centroid: p.centroid, sinceCapture: p.lastCaptureAt < 0 ? 0 : this.time - p.lastCaptureAt, relation: viewer ? this.relation(viewer, p) : 'neutral', underAttack: this.time < p.underAttackUntil };
  }
  priv(p: Player): PlayerPrivate {
    return { ...this.pub(p, p), level: p.level, bonusArmy: p.bonusArmy, stats: p.stats, missed: p.missed, allies: [...p.allies], wars: [...p.wars], landmarks: this.landmarks(p), attackPower: this.time < p.attackPowerUntil ? p.attackPower : 0, defenseBoost: this.time < p.defenseBoostUntil ? p.defenseBoost : 0 };
  }
  ranking(): RankingRow[] {
    return [...this.players.values()].filter(p => p.placed && p.alive).sort((a, b) => b.cells - a.cells).map(p => ({ id: p.id, name: p.name, cells: p.cells, army: Math.floor(p.army), score: Math.floor(p.score), isBot: p.isBot }));
  }
  broadcastToast(text: string, kind: 'info' | 'ok' | 'warn' | 'war' | 'ally', except?: number) { for (const p of this.humans()) if (p.id !== except) p.send({ t: 'toast', text, kind }); }

  // ---------- simulation ----------
  private tick() {
    if (this.phase === 'ended') return;
    if (this.phase === 'waiting') { if (this.started && Date.now() > this.placementEnds && this.humans().some(p => p.placed)) this.phase = 'playing'; }
    const dt = RULES.tickMs / 1000;
    if (this.phase === 'playing') this.time += dt;
    // income
    for (const p of this.players.values()) {
      if (!p.placed || !p.alive) continue;
      const lm = this.landmarks(p);
      const since = p.lastCaptureAt < 0 ? 0 : this.time - p.lastCaptureAt;
      p.acc += armyIncomePerMin(p.cells, since, lm.caravanserai) * dt / 60;
      if (p.acc >= 1) { const n = Math.floor(p.acc); p.acc -= n; p.army += n; }
    }
    // expansions (neutral)
    for (const e of this.expansions) {
      const p = this.players.get(e.pid); if (!p || !p.alive) { e.remaining = 0; continue; }
      let n = Math.max(1, Math.ceil(e.remaining / 5));
      while (n-- > 0 && e.remaining > 0) { const c = e.front.next(); if (c < 0) { e.remaining = 0; break; } this.captureFor(p, c); e.front.expandFrom(c); e.remaining--; }
    }
    this.expansions = this.expansions.filter(e => e.remaining > 0);
    // attacks
    for (const [id, a] of this.attacks) { if (a.status === 'fighting') this.stepAttack(a); if (a.status !== 'fighting' && this.time - (a as any).endedAt > 10) this.attacks.delete(id); else if (a.status !== 'fighting' && !(a as any).endedAt) (a as any).endedAt = this.time; }
    // bots
    if (this.phase === 'playing') this.bots(dt);
    // deltas
    if (this.changed.size) {
      const cells = [...this.changed]; const owners = cells.map(c => this.owners[c]); this.changed.clear();
      const m: ServerMsg = { t: 'delta', cells, owners };
      for (const p of this.humans()) p.send(m);
    }
    // state (1/s)
    const now = Date.now();
    if (now - this.lastState > 1000) {
      this.lastState = now;
      if (now - this.lastCentroid > 3000) { this.lastCentroid = now; this.computeCentroids(); }
      const ranking = this.ranking();
      for (const p of this.humans()) {
        if (!p.connected) continue;
        const attacks = [...this.attacks.values()].filter(a => a.attacker === p.id || a.target === p.id).map(a => ({ id: a.id, attacker: a.attacker, target: a.target, troops: Math.floor(a.troops), sent: a.sent, captured: a.captured, status: a.status, viaSea: a.viaSea, power: a.power, lossFactor: a.lossFactor }));
        const proposals = [...this.proposals.values()].filter(x => x.from === p.id || x.to === p.id).slice(-10);
        p.send({ t: 'state', time: this.time, phase: this.phase, players: this.publicPlayers(p), me: this.priv(p), attacks, proposals, ranking });
      }
      if (this.phase === 'playing' && this.time >= RULES.matchSeconds) this.endMatch();
    }
  }
  private computeCentroids() {
    for (const p of this.players.values()) p.centroidSum = [0, 0, 0];
    for (let i = 0; i < CELLS; i++) { const o = this.owners[i]; if (!o) continue; const p = this.players.get(o); if (!p) continue; const x = i % W; p.centroidSum[0] += x; p.centroidSum[1] += (i - x) / W; p.centroidSum[2]++; }
    for (const p of this.players.values()) p.centroid = p.centroidSum[2] ? [p.centroidSum[0] / p.centroidSum[2], p.centroidSum[1] / p.centroidSum[2]] : null;
  }
  private checkEnd() {
    const alive = [...this.players.values()].filter(p => p.placed && p.alive);
    const humansAlive = alive.filter(p => !p.isBot && p.connected);
    if (this.humans().length && humansAlive.length === 0 && this.time > 30) this.endMatch();
  }
  endMatch() {
    if (this.phase === 'ended') return;
    this.phase = 'ended';
    const ranking = this.ranking(); const winner = ranking[0];
    for (const p of this.humans()) p.send({ t: 'gameOver', winner: winner?.id ?? 0, winnerName: winner?.name ?? '-', ranking, myRank: ranking.findIndex(r => r.id === p.id) + 1, me: this.priv(p) });
  }
  // ---------- bots ----------
  private bots(dt: number) {
    for (const b of this.players.values()) {
      if (!b.isBot || !b.alive) continue;
      b.botNext -= dt; if (b.botNext > 0) continue;
      b.botNext = 6 + Math.random() * 10;
      // "exercise": bots succeed 70%
      if (Math.random() < 0.7) {
        b.score += 10; b.army += RULES.learningBonusArmy;
        const front = new Front(b.id, 0, this.owners);
        if (!front.exhausted) { this.expansions.push({ pid: b.id, remaining: 6 + Math.floor(Math.random() * 14), front }); continue; }
      }
      // no neutral land: consider attacking a weaker land neighbour (never a human unless at war with it, never an ally)
      if (b.army < 60 || Math.random() < 0.5) continue;
      const candidates = new Map<number, number>();
      for (let i = 0; i < CELLS; i += 3) { if (this.owners[i] !== b.id) continue; neighbors(i, NB); for (let k = 0; k < 4; k++) { const j = NB[k]; if (j >= 0) { const o = this.owners[j]; if (o && o !== b.id) candidates.set(o, (candidates.get(o) ?? 0) + 1); } } }
      const targets = [...candidates.keys()].map(id => this.players.get(id)!).filter(t => t && t.alive && !b.allies.has(t.id) && (t.isBot || t.wars.has(b.id)) && t.army < b.army * 0.8);
      if (!targets.length) continue;
      const t = targets[Math.floor(Math.random() * targets.length)];
      if (!b.wars.has(t.id)) this.declareWar(b, t.id);
      b.attackPower = 0.85; b.attackPowerUntil = this.time + 5;
      this.startAttack(b, t.id, 0.4);
    }
  }
  destroy() { if (this.timer) clearInterval(this.timer); }
}

function jitter(c: [number, number, number], seed: number): [number, number, number] {
  const r = ((seed * 9301 + 49297) % 233280) / 233280 - 0.5;
  return [clamp(c[0] + r * 40), clamp(c[1] + r * 30), clamp(c[2] - r * 30)];
}
const clamp = (v: number) => Math.max(20, Math.min(235, Math.round(v)));
function nearestLand(lon: number, lat: number): number {
  const terrain = terrainGrid(); const c = lonLatToCell(lon, lat);
  if (isLand(terrain[c])) return c;
  const [cx, cy] = xyOf(c);
  for (let r = 1; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const y = cy + dy; if (y < 0 || y >= H) continue; const i = y * W + (((cx + dx) % W) + W) % W; if (isLand(terrain[i])) return i; }
  return -1;
}
const REPLIES = ['Agreed. Let us keep the peace for now.', 'We will consider your offer.', 'Our armies are ready, but we prefer trade.', 'Send your terms, and we shall answer.'];
const botReply = () => REPLIES[Math.floor(Math.random() * REPLIES.length)];
