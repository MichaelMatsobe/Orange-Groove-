# Orange Groove

**Multi-device group-play music party app.**  
The host acts as a virtual DJ. Guests and additional devices sync in real-time and hear exactly what the host is playing — inspired by Xiaomi Bluetooth speaker group play.

## Vision

- **Host (Virtual DJ)** — full playback, queue, and DJ controls  
- **Guests / Devices** — join via party code and stay tightly synchronized  
- **Downloadable** — Android, iOS, Windows, macOS, Linux  
- **Full-stack** — React frontend + Express/Socket.IO backend

> True Bluetooth multipoint / speaker-group play requires native Bluetooth APIs.  
> In the web & Capacitor version we use WebRTC (Trystero) + optional Socket.IO signaling so multiple phones, tablets and desktops act as the "speakers".

## Current Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite 6 + TypeScript + Tailwind |
| Real-time sync | Trystero (WebRTC) |
| Backend | Express + Socket.IO |
| Mobile packaging | Capacitor 7 |
| Desktop packaging | Capacitor Electron **or** Tauri 2 (recommended for small binaries) |

## Quick Start (Web)

```bash
npm install
npm run dev          # frontend on :3000
npm run dev:server   # backend on :4000
# or both:
npm run dev:full
```

## Building Downloadable Apps

### 1. Mobile (Android / iOS) — Capacitor

```bash
npm install
npm run build
npx cap add android   # first time only
npx cap add ios       # first time only (macOS required)
npx cap sync
npx cap open android  # opens Android Studio → build APK/AAB
npx cap open ios      # opens Xcode → build IPA
```

Or use the convenience scripts:

```bash
npm run android
npm run ios
```

### 2. Desktop

**Option A – Capacitor + Electron** (easiest, larger binaries ~80-150 MB)

```bash
npm install @capacitor-community/electron --save-dev
npx cap add @capacitor-community/electron
npx cap sync
npx cap open @capacitor-community/electron
```

**Option B – Tauri 2** (recommended — 3-10 MB binaries, also supports mobile in Tauri v2)

```bash
# Install Rust first: https://rustup.rs
npm install -D @tauri-apps/cli
npx tauri init
# point tauri.conf.json "frontendDist" to "../dist"
npm run build
npx tauri build
```

### 3. Progressive Web App (instant install from browser)

The Vite build already produces a modern SPA. Add a service worker + manifest later for full PWA installability on desktop & mobile browsers.

## Project Structure

```
├── src/                 # React frontend
│   ├── components/      # HostApp, GuestApp, etc.
│   ├── App.tsx          # Main logic + Trystero room
│   └── ...
├── server/              # Express + Socket.IO backend
│   └── index.ts
├── capacitor.config.ts
├── package.json
└── README.md
```

## Roadmap toward full Xiaomi-style experience

- [x] Host as master player / virtual DJ
- [x] Guests tightly synced to host track + position
- [x] Connected device count
- [x] Basic backend for party codes & presence
- [ ] Capacitor Bluetooth plugins (for real speaker pairing)
- [ ] Background audio + media session controls
- [ ] Persistent playlists & user accounts
- [ ] File upload / local library on host
- [ ] Desktop installers (MSI / DMG / AppImage) via Tauri or Electron
- [ ] App Store / Play Store release pipeline

## License

Apache-2.0
