# Orange Groove

**Wi‑Fi multi-device group-play music party.**  
The host is the virtual DJ. Guests join the same network (home Wi‑Fi or the host’s mobile hotspot) with a private 6-digit code and stay tightly synchronized.

Works as a **web app**, **installable PWA**, and is **Capacitor-ready** for Android / iOS.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     Same Wi‑Fi / Hotspot                      │
│                                                               │
│   ┌──────────────┐         WebRTC (Trystero)        ┌──────┐│
│   │  HOST (DJ)   │◄────────────────────────────────►│Guest1││
│   │  Master clock│         party code room          │      ││
│   │  Play/Pause  │◄────────────────────────────────►│Guest2││
│   │  Queue / Live│                                   │  …   ││
│   └──────┬───────┘                                   └──┬───┘│
│          │                                              │    │
│          ▼                                              ▼    │
│   Phone speaker /                              Phone speaker /│
│   BT headset (OS)                              BT headset (OS)│
└─────────────────────────────────────────────────────────────┘
```

**Bluetooth speakers & headsets** pair in the phone’s system Settings.  
Orange Groove plays through the device’s current audio output — it does not pair Bluetooth itself.

```text
  [BT Speaker] ← A2DP ← [Phone OS] ← audio ← [Orange Groove browser/app]
```

---

## How to party

### A — Same Wi‑Fi

```text
Host                          Guest
────                          ─────
Open app                      Open app
Start Party ──code──►         Join with Party Code
Go Live ─────────────►        Auto-syncs track + position
```

### B — Mobile hotspot (no home Wi‑Fi)

```text
1. Host: Settings → Mobile hotspot → ON
2. Guests: join that hotspot (name + password)
3. Host: Start Party → share 6-digit code
4. Guests: Join with Party Code
5. Host: Go Live
```

### C — Party from anywhere (across networks)

By default, peers connect directly over WebRTC (free Google STUN included), which works on
same-LAN/hotspot setups. To let guests join from **other networks** (e.g. cellular data, a
different Wi‑Fi), add a TURN relay so WebRTC can punch through strict NAT.

**Recommended provider: [Metered.ca TURN](https://www.metered.ca/turn-server)** — purpose-built
TURN hosting with a free tier (2 GB relay / mo) and static credentials. Alternatives:
[Cloudflare Calls](https://developers.cloudflare.com/calls/turn/) (free, but time-limited
tokens need a small code change) or a self-hosted [coturn](https://github.com/coturn/coturn)
container.

1. Sign up at metered.ca → **TURN Server** → create a server (free plan gives
   `global.metered.ca`).
2. Copy the **TURN URL**, **username**, and **credential** from the dashboard.
3. Set these as build-time env vars (Vite inlines them into the client bundle):

```bash
VITE_TURN_URL=turn:global.metered.ca:3478
VITE_TURN_USERNAME=<username>
VITE_TURN_CREDENTIAL=<credential>
```

Or paste them into your hosting dashboard / the project Keys tab (e.g. for Freebuff: Keys/API
keys UI → `VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL`).

4. Rebuild & deploy — the app auto-detects the vars via `src/utils/rtcConfig.ts` (no code
   changes needed). Guests on any network can now join the party.

---

## Quick start (development)

```bash
git clone https://github.com/MichaelMatsobe/Orange-Groove-.git
cd Orange-Groove-
npm install
npm run dev
```

Open `http://localhost:3000` on two devices on the same network.

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite frontend (port 3000) |
| `npm run dev:server` | Optional Express API (port 4000) |
| `npm run dev:full` | Frontend + backend |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve production build locally |
| `npm run lint` | Typecheck |

---

## Deploy (web / PWA)

### 1. Build

```bash
npm install
npm run build
```

Output: `dist/` (static files + service worker).

### 2. Host as a static site (recommended)

Any static host works. SPA fallback must send all routes to `index.html`.

**Vercel** — repo includes `vercel.json`  
**Netlify** — repo includes `netlify.toml`  
**GitHub Pages / Cloudflare / nginx** — point document root at `dist/` and fall back to `index.html`.

Example nginx:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### 3. HTTPS required

WebRTC and installable PWA need **HTTPS** (or `localhost`).  
Use your host’s free TLS (Vercel / Netlify / Cloudflare) or Caddy / certbot.

### 4. Optional backend

```bash
npm run server
# or: node after compiling, default PORT=4000
```

Set `PORT` in the environment. Frontend sync works **without** the backend (Trystero is peer-to-peer).

---

## Install as app (PWA)

1. Deploy over HTTPS  
2. Open in Chrome / Safari / Edge  
3. “Add to Home Screen” / Install  

Manifest: `public/manifest.webmanifest`  
Service worker: registered from `src/main.tsx` → caches shell for offline open.

---

## Mobile (Capacitor)

```bash
npm run build
npx cap add android   # once
npx cap add ios       # once, macOS only
npx cap sync
npx cap open android  # or ios
```

`capacitor.config.ts` uses `webDir: dist` and app id `com.orangegroove.app`.

---

## Project layout

```text
Orange-Groove-/
├── index.html
├── package.json
├── vite.config.ts
├── capacitor.config.ts
├── vercel.json / netlify.toml
├── public/
│   ├── manifest.webmanifest
│   ├── sw.js                 # service worker
│   ├── icon.svg
│   └── icons (192 / 512)
├── server/                   # optional Express + Socket.IO
└── src/
    ├── App.tsx               # roles, Trystero room, master player
    ├── components/
    │   ├── WelcomeScreen.tsx
    │   ├── HostApp.tsx       # DJ controls + share code
    │   └── GuestApp.tsx      # synced listener UI
    ├── constants.ts
    └── types.ts
```

---

## Stack

| Layer | Tech |
|-------|------|
| UI | React 19, TypeScript, Tailwind 4, Motion |
| Sync | Trystero (WebRTC P2P) |
| Build | Vite 6 |
| PWA | Web manifest + service worker |
| Optional API | Express, Socket.IO |
| Native shell | Capacitor 7 |

---

## Security model

```text
┌──────────────┐
│ 6-digit code │  only shared by host (copy / OS share sheet)
└──────┬───────┘
       │ + unique Trystero appId
       ▼
 Private WebRTC room — not listed publicly
 Same LAN / hotspot recommended for reliability
```

- Codes are ephemeral (while host is in the party).  
- No account required for core group play.  
- Audio stays on each device; sample track URLs are public demo files.  
- Without TURN env vars, parties are same-LAN/hotspot only; with them, cross-network works.

---

## Roadmap

- [x] Host master player / virtual DJ  
- [x] Guest sync over Wi‑Fi / hotspot  
- [x] Private 6-digit codes + copy/share  
- [x] Connected device list  
- [x] Local file upload (host)  
- [x] PWA install + service worker  
- [x] Static deploy configs (Vercel / Netlify)  
- [x] Stream host local files to guests (chunked Trystero transfer)  
- [x] TURN relay support for cross-network parties (env-configurable)  
- [ ] Native “start hotspot” helper  
- [ ] Desktop installers (Tauri / Electron)  

---

## License

Apache-2.0
