import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { RULES, terrainGrid, W, H } from '@eg/shared';
import type { ClientMsg, FlagSpec, Level, RoomSummary } from '@eg/shared';
import { Room, Player } from './room';

const PORT = Number(process.env.PORT || 8787);
const rooms = new Map<string, Room>();

function roomList(): RoomSummary[] { return [...rooms.values()].map(r => r.summary()); }
function pickRoom(roomId?: string): Room {
  if (roomId && rooms.has(roomId)) return rooms.get(roomId)!;
  for (const r of rooms.values()) if (r.phase !== 'ended' && r.summary().humans < RULES.maxHumans) return r;
  const r = new Room(); rooms.set(r.id, r); console.log('room created', r.id);
  return r;
}

const http = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.url === '/health') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: true, rooms: roomList(), grid: [W, H] })); return; }
  res.writeHead(404); res.end();
});
const wss = new WebSocketServer({ server: http });

wss.on('connection', (ws: WebSocket) => {
  let name = 'O‘yinchi', flag: FlagSpec | null = null, level: Level = 'A2';
  let room: Room | null = null, player: Player | null = null;
  const send = (m: any) => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify(m));
  ws.on('message', (raw) => {
    let m: ClientMsg; try { m = JSON.parse(String(raw)); } catch { return; }
    try {
      switch (m.t) {
        case 'hello': name = String(m.name || '').slice(0, 24); flag = m.flag; level = m.level ?? 'A2'; send({ t: 'rooms', rooms: roomList() }); break;
        case 'rooms': send({ t: 'rooms', rooms: roomList() }); break;
        case 'join': if (player) return; room = pickRoom(m.roomId); player = room.addHuman(name, flag, ws, level); break;
        case 'ping': send({ t: 'pong' }); break;
        default:
          if (!room || !player) return send({ t: 'error', msg: 'Avval xonaga kiring' });
          switch (m.t) {
            case 'place': room.place(player, m.cell | 0); break;
            case 'exercise': room.giveExercise(player, m.purpose, !!m.speak, m.targetId); break;
            case 'answer': room.answer(player, String(m.exerciseId), String(m.answer ?? '')); break;
            case 'attack': room.startAttack(player, m.targetId | 0, Number(m.pct)); break;
            case 'stopAttack': room.stopAttack(player, m.attackId | 0); break;
            case 'propose': room.propose(player, m.to | 0, m.terms, m.text); break;
            case 'respond': room.respond(player, m.proposalId | 0, !!m.accept); break;
            case 'declareWar': room.declareWar(player, m.to | 0); break;
            case 'chat': room.chat(player, m.to | 0, String(m.text ?? '')); break;
            case 'terrainInfo': room.terrainInfo(player, m.cell | 0); break;
          }
      }
    } catch (e) { console.error(e); send({ t: 'error', msg: 'Server xatosi' }); }
  });
  ws.on('close', () => { if (room && player) room.disconnect(player); });
});

terrainGrid();
http.listen(PORT, () => console.log(`Imperiya server: ws://localhost:${PORT}  (grid ${W}x${H})`));
