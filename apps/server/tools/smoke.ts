// Dev smoke test: connects, places at Samarkand, answers an exercise correctly, declares war and attacks Safaviylar.
import { WebSocket } from 'ws';
import { EXERCISES, lonLatToCell } from '@eg/shared';
const ws = new WebSocket(process.env.URL || 'ws://localhost:8787');
const send = (m: any) => ws.send(JSON.stringify(m));
let states = 0, deltas = 0;
ws.on('open', () => { send({ t: 'hello', name: 'Smoke', flag: null }); send({ t: 'join' }); });
ws.on('message', (raw) => {
  const m = JSON.parse(String(raw));
  if (m.t === 'welcome') { console.log('welcome players', m.players.length, 'rle pairs', m.ownersRle.length / 2, 'phase', m.phase); send({ t: 'place', cell: lonLatToCell(66.97, 39.65) }); setTimeout(() => send({ t: 'exercise', purpose: 'expand', speak: false }), 1500); }
  if (m.t === 'exercise') { const item = EXERCISES.find(e => e.promptUz === m.ex.promptUz && (e.display ?? '') === (m.ex.display ?? ''))!; console.log('exercise', m.ex.kind, m.ex.promptUz, '->', item.accepted[0]); setTimeout(() => send({ t: 'answer', exerciseId: m.ex.id, answer: item.accepted[0] }), 300); }
  if (m.t === 'answerResult') { console.log('answerResult', JSON.stringify(m.r)); send({ t: 'terrainInfo', cell: lonLatToCell(60, 40) }); }
  if (m.t === 'terrain') console.log('terrain', m.r.info.nameUz, 'owner', m.r.ownerName, 'adj', JSON.stringify(m.r.adjacency), 'city', m.r.nearestCity?.name);
  if (m.t === 'delta') deltas += m.cells.length;
  if (m.t === 'toast') console.log('toast', m.text);
  if (m.t === 'error') console.log('ERROR', m.msg);
  if (m.t === 'state') {
    states++;
    if (states === 4) {
      const p = m.me; console.log('me', { cells: p.cells, army: p.army, score: p.score, since: p.sinceCapture.toFixed(1), family: p.family, lm: p.landmarks });
      console.log('ranking top3', m.ranking.slice(0, 3).map((r: any) => r.name + ':' + r.cells).join(', '), 'players', m.players.length);
      const enemy = m.players.find((x: any) => x.name === 'Safaviylar'); if (enemy) { send({ t: 'declareWar', to: enemy.id }); send({ t: 'attack', targetId: enemy.id, pct: 0.5 }); }
      const far = m.players.find((x: any) => x.name === 'Aztek'); if (far) send({ t: 'attack', targetId: far.id, pct: 0.2 });
    }
    if (states === 9) { console.log('attacks', JSON.stringify(m.attacks), 'army', m.me.army, 'cells', m.me.cells, 'deltas', deltas); ws.close(); process.exit(0); }
  }
});
setTimeout(() => { console.log('timeout'); process.exit(1); }, 25000);
