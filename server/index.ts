/**
 * Orange Groove optional backend
 * - Health + party presence
 * - Core sync is still Trystero/WebRTC on the client (works without this server)
 */
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

interface Party {
  code: string;
  hostId: string | null;
  createdAt: number;
  isLive: boolean;
  currentSongIndex: number;
  deviceCount: number;
}

const parties = new Map<string, Party>();

function generatePartyCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'orange-groove', version: '0.3.0' });
});

app.post('/api/parties', (_req, res) => {
  const code = generatePartyCode();
  const party: Party = {
    code,
    hostId: null,
    createdAt: Date.now(),
    isLive: false,
    currentSongIndex: 0,
    deviceCount: 0,
  };
  parties.set(code, party);
  res.json({ code, party });
});

app.get('/api/parties/:code', (req, res) => {
  const party = parties.get(req.params.code);
  if (!party) return res.status(404).json({ error: 'Party not found' });
  res.json(party);
});

app.get('/api/parties', (_req, res) => {
  const list = Array.from(parties.values()).map((p) => ({
    code: p.code,
    isLive: p.isLive,
    deviceCount: p.deviceCount,
    createdAt: p.createdAt,
  }));
  res.json(list);
});

io.on('connection', (socket) => {
  socket.on('join-party', ({ code, role }: { code: string; role: 'host' | 'guest' }) => {
    let party = parties.get(code);
    if (!party) {
      if (role === 'host') {
        party = {
          code,
          hostId: socket.id,
          createdAt: Date.now(),
          isLive: false,
          currentSongIndex: 0,
          deviceCount: 1,
        };
        parties.set(code, party);
      } else {
        socket.emit('error', { message: 'Party not found' });
        return;
      }
    }

    socket.join(code);
    if (role === 'host') party.hostId = socket.id;
    party.deviceCount = io.sockets.adapter.rooms.get(code)?.size ?? 1;

    io.to(code).emit('party-update', {
      code,
      deviceCount: party.deviceCount,
      isLive: party.isLive,
    });
    socket.emit('joined', { code, role, party });
  });

  socket.on('host-state', ({ code, state }) => {
    const party = parties.get(code);
    if (party && party.hostId === socket.id) {
      party.isLive = !!state.isLive;
      party.currentSongIndex = state.currentSongIndex ?? party.currentSongIndex;
      socket.to(code).emit('host-heartbeat', state);
    }
  });
});

const PORT = Number(process.env.PORT) || 4000;
httpServer.listen(PORT, () => {
  console.log(`Orange Groove server http://localhost:${PORT}`);
});
