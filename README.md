# Orange Groove

**Wi‑Fi multi-device group-play music party.**  
The host is the virtual DJ. Guests join the same network (home Wi‑Fi or the host’s mobile hotspot) with a private 6-digit code and stay tightly synchronized.

No Bluetooth required. Works in the browser and is packageable for Android / iOS / desktop.

## How it works

1. **Host** starts a party → gets a private 6-digit code  
2. Everyone joins the **same Wi‑Fi** *or* the host turns on a **mobile hotspot** and guests connect to it  
3. Guests enter the party code  
4. Host taps **Go Live** → all devices play the same track at the same position  

Transport: **Trystero (WebRTC)** over the local network. Party rooms are isolated by app ID + code.

## Why Wi‑Fi (not Bluetooth)

| | Bluetooth group play | Wi‑Fi + Orange Groove |
|--|----------------------|------------------------|
| Phones / tablets / laptops | Awkward | Excellent |
| Device count | Often 2–8 | Practical 5–15+ |
| Bandwidth | Limited | High |
| Offline party | Yes | Yes (hotspot) |
| Web app | Almost impossible | Native fit |

## Quick start (web)

```bash
npm install
npm run dev
```

Open `http://localhost:3000` on two devices on the same network:

- Device A → **Start Party** → copy/share the code  
- Device B → **Join with Party Code** → enter code  
- Host → **Go Live**

### Offline / hotspot party

1. Host: Settings → Mobile hotspot → turn on  
2. Guests: join that hotspot (Wi‑Fi name + password from host)  
3. Both open Orange Groove → host shares party code → guests join → Go Live  

## Stack

- React 19 + Vite 6 + TypeScript + Tailwind  
- Trystero (WebRTC P2P) for real-time sync  
- Optional Express + Socket.IO backend (`server/`)  
- Capacitor-ready for Android / iOS builds  

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Frontend |
| `npm run dev:server` | Backend |
| `npm run dev:full` | Both |
| `npm run build` | Production build |
| `npm run android` / `ios` | Capacitor native projects |

## Roadmap

- [x] Host as master player / virtual DJ  
- [x] Guests tightly synced over Wi‑Fi / hotspot  
- [x] Private 6-digit party codes + copy/share  
- [x] Connected device list  
- [x] Local file upload on host  
- [ ] Stream host local files to guests over the LAN  
- [ ] Native “Start Hotspot” helper (Capacitor)  
- [ ] Desktop installers (Tauri / Electron)  

## License

Apache-2.0
