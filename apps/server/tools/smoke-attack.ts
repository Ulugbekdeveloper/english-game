// Dev test: expand repeatedly until adjacent to a bot, then attack it, watch the attack, stop it.
import { WebSocket } from 'ws';
import { EXERCISES, lonLatToCell } from '@eg/shared';
const ws = new WebSocket(process.env.URL || 'ws://localhost:8787');
const send = (m: any) => ws.send(JSON.stringify(m));
let answered = 0, attacking = false, attackId = 0, stopped = false, lastState: any = null, tried = new Set<number>();
const ask = () => send({ t: 'exercise', purpose: 'expand', speak: false });
ws.on('open', () => { send({ t: 'hello', name: 'AttackTest', flag: null }); send({ t: 'join' }); });
ws.on('message', (raw) => {
  const m = JSON.parse(String(raw));
  if (m.t === 'welcome') { send({ t: 'place', cell: lonLatToCell(64.4, 39.8) }); setTimeout(ask, 1200); }
  if (m.t === 'exercise') { const item = EXERCISES.find(e => e.promptUz === m.ex.promptUz && (e.display ?? '') === (m.ex.display ?? ''))!; setTimeout(() => send({ t: 'answer', exerciseId: m.ex.id, answer: item.accepted[0] }), 100); }
  if (m.t === 'answerResult') { answered++; if (m.r.purpose === 'expand') { if (answered < 14) setTimeout(ask, 400); else console.log('expanded', answered, 'times; cells', lastState?.me?.cells); } if (m.r.purpose === 'attack') console.log('attack exercise ->', JSON.stringify(m.r.effect)); }
  if (m.t === 'toast') console.log('toast', m.text);
  if (m.t === 'error') { console.log('ERROR', m.msg); }
  if (m.t === 'state') {
    lastState = m;
    if (answered >= 14 && !attacking) {
      // find any neighbour by probing terrainInfo on each other player's centroid is slow; just try attacking each bot until one is adjacent
      for (const p of m.players) { if (p.id === m.me.id || tried.has(p.id) || !p.alive) continue; tried.add(p.id); attacking = true; console.log('try attack', p.name, 'me cells', m.me.cells, 'army', m.me.army); send({ t: 'declareWar', to: p.id }); send({ t: 'attack', targetId: p.id, pct: 0.6 }); setTimeout(() => { if (!attackId) attacking = false; }, 1500); break; }
    }
    const a = m.attacks.find((x: any) => x.attacker === m.me.id && x.status === 'fighting');
    if (a) { attackId = a.id; console.log('attack', { troops: a.troops, sent: a.sent, captured: a.captured, viaSea: a.viaSea, power: a.power, cost: a.lossFactor.toFixed(2) }, 'me', { cells: m.me.cells, army: m.me.army, since: m.me.sinceCapture.toFixed(1) }); if (a.captured >= 20 && !stopped) { stopped = true; send({ t: 'stopAttack', attackId: a.id }); } }
    if (stopped && !a) { console.log('after stop: cells', m.me.cells, 'army', m.me.army, 'wars', m.me.wars.length); ws.close(); process.exit(0); }
  }
});
setTimeout(() => { console.log('timeout; last me', lastState && { cells: lastState.me.cells, army: lastState.me.army }); process.exit(1); }, 90000);
