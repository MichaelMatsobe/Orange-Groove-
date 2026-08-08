/**
 * Orange Groove backend
 * - Party room management
 * - Optional signaling / presence
 * - Foundation for auth, playlists, file uploads later
 */
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// In-memory party store (replace with Redis/Postgres later)
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
  // Short, memorable codes (like Xiaomi / party apps)
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'orange-groove', version: '0.2.0' });
});

// Create a new party (host)
app.post('/api/parties', (req, res) => {
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

// Get party info
app.get('/api/parties/:code', (req, res) => {
  const party = parties.get(req.params.code);
  if (!party) {
    return res.status(404).json({ error: 'Party not found' });
  }
  res.json(party);
});

// List active parties (debug / discovery)
app.get('/api/parties', (_req, res) => {
  const list = Array.from(parties.values()).map(p => ({
    code: p.code,
    isLive: p.isLive,
    deviceCount: p.deviceCount,
    createdAt: p.createdAt,
  }));
  res.json(list);
});

// Socket.IO for presence & lightweight signaling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-party', ({ code, role }: { code: string; role: 'host' | 'guest' }) => {
    let party = parties.get(code);
    if (!party) {
      // Auto-create if host starts with a preferred code
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

    if (role === 'host') {
      party.hostId = socket.id;
    }
    party.deviceCount = (io.sockets.adapter.rooms.get(code)?.size ?? 1);

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
      // Broadcast presence so guests know host is alive
      socket.to(code).emit('host-heartbeat', state);
    }
  });

  socket.on('disconnect', () => {
    // Clean up empty parties eventually
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Orange Groove server running on http://localhost:${PORT}`);
});
