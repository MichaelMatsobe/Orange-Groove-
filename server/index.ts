/**
 * Orange Groove optional backend
 *
 * - Party registry + presence (REST): lets guests validate a code, lets the
 *   host re-claim its party after a refresh, and tracks host online-ness via
 *   heartbeats so parties survive host refreshes.
 * - Health + Socket.IO room echo (kept for live device counts).
 *
 * Core sync is still Trystero/WebRTC on the client — this server is optional
 * and the app degrades to offline mode when it is unreachable.
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
  lastSeen: number;
  isLive: boolean;
  currentSongIndex: number;
  deviceCount: number;
}

const parties = new Map<string, Party>();

/** A party whose host has not heartbeated for this long is considered dead. */
const HOST_ONLINE_MS = 60_000;
const PARTY_TTL_MS = 2 * 60_000;

function generatePartyCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function partyInfo(party: Party) {
  return {
    code: party.code,
    isLive: party.isLive,
    currentSongIndex: party.currentSongIndex,
    deviceCount: party.deviceCount,
    hostOnline: Date.now() - party.lastSeen < HOST_ONLINE_MS,
    createdAt: party.createdAt,
  };
}

function createParty(code: string, hostId: string | null): Party {
  const party: Party = {
    code,
    hostId,
    createdAt: Date.now(),
    lastSeen: Date.now(),
    isLive: false,
    currentSongIndex: 0,
    deviceCount: 1,
  };
  parties.set(code, party);
  return party;
}

// Reap parties whose host vanished (refresh without restore, network loss…).
setInterval(() => {
  const cutoff = Date.now() - PARTY_TTL_MS;
  for (const [code, party] of parties) {
    if (party.lastSeen < cutoff) parties.delete(code);
  }
}, 30_000).unref();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'orange-groove', version: '0.4.0' });
});

/** Host creates or re-claims its party (idempotent — survives refreshes). */
app.post('/api/parties/:code/claim', (req, res) => {
  const code = req.params.code;
  if (!/^\d{6}$/.test(code)) return res.status(400).json({ error: 'Invalid party code' });
  const existing = parties.get(code);
  const party = existing
    ? { ...existing, lastSeen: Date.now() }
    : createParty(code, null);
  parties.set(code, party);
  res.json(partyInfo(party));
});

/** Host presence beacon; keeps the party alive in the registry. */
app.post('/api/parties/:code/heartbeat', (req, res) => {
  const party = parties.get(req.params.code);
  if (!party) return res.status(404).json({ error: 'Party not found' });
  const state = req.body ?? {};
  party.lastSeen = Date.now();
  party.isLive = !!state.isLive;
  if (typeof state.currentSongIndex === 'number') {
    party.currentSongIndex = state.currentSongIndex;
  }
  if (typeof state.deviceCount === 'number') party.deviceCount = state.deviceCount;
  res.json(partyInfo(party));
});

app.get('/api/parties/:code', (req, res) => {
  const party = parties.get(req.params.code);
  if (!party) return res.status(404).json({ error: 'Party not found' });
  res.json(partyInfo(party));
});

/** Host ended the party. */
app.delete('/api/parties/:code', (req, res) => {
  if (!parties.delete(req.params.code)) {
    return res.status(404).json({ error: 'Party not found' });
  }
  res.json({ ok: true });
});

app.get('/api/parties', (_req, res) => {
  const list = Array.from(parties.values()).map((p) => ({
    code: p.code,
    isLive: p.isLive,
    deviceCount: p.deviceCount,
    hostOnline: Date.now() - p.lastSeen < HOST_ONLINE_MS,
    createdAt: p.createdAt,
  }));
  res.json(list);
});

io.on('connection', (socket) => {
  socket.on('join-party', ({ code, role }: { code: string; role: 'host' | 'guest' }) => {
    let party = parties.get(code);
    if (!party) {
      if (role === 'host') {
        party = createParty(code, socket.id);
      } else {
        socket.emit('error', { message: 'Party not found' });
        return;
      }
    }
    socket.join(code);
    if (role === 'host') {
      party.hostId = socket.id;
      party.lastSeen = Date.now();
    }
    party.deviceCount = io.sockets.adapter.rooms.get(code)?.size ?? 1;

    io.to(code).emit('party-update', {
      code,
      deviceCount: party.deviceCount,
      isLive: party.isLive,
    });
    socket.emit('joined', { code, role, party: partyInfo(party) });
  });

  socket.on('host-state', ({ code, state }) => {
    const party = parties.get(code);
    if (party && party.hostId === socket.id) {
      party.isLive = !!state.isLive;
      party.currentSongIndex = state.currentSongIndex ?? party.currentSongIndex;
      party.lastSeen = Date.now();
      socket.to(code).emit('host-heartbeat', state);
    }
  });

  socket.on('disconnect', () => {
    for (const party of parties.values()) {
      if (party.hostId === socket.id) {
        party.hostId = null;
        break;
      }
    }
  });
});

const PORT = Number(process.env.PORT) || 4000;
httpServer.listen(PORT, () => {
  console.log(`Orange Groove server http://localhost:${PORT}`);
});
