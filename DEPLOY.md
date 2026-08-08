# Deploy Orange Groove

## Checklist

- [ ] `npm install && npm run build` succeeds
- [ ] Host `dist/` on **HTTPS**
- [ ] SPA fallback: all routes → `index.html`
- [ ] Test two devices on same Wi‑Fi: Start Party → Join code → Go Live
- [ ] Optional: Install as PWA from browser menu

## Diagram — production traffic

```text
  Users (phones / laptops)
           │
           │  HTTPS
           ▼
  ┌────────────────────┐
  │  Static host       │  Vercel / Netlify / nginx
  │  dist/ + sw.js     │
  └─────────┬──────────┘
            │
            │  WebRTC signaling (public STUN)
            │  then direct peer data on LAN when possible
            ▼
  Host ◄──────────► Guests   (Trystero room = appId + 6-digit code)
```

Backend (`server/`) is **optional**. Core party sync does not need it.

## Vercel

```bash
npm i -g vercel
vercel
```

Uses `vercel.json` already in the repo.

## Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

Or connect the GitHub repo; build command `npm run build`, publish `dist`.

## Docker (optional static serve)

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
npm ci
COPY . .
npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Example `nginx.conf`:

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
  location = /sw.js {
    add_header Cache-Control "no-cache";
  }
}
```

## Capacitor store builds

1. `npm run build && npx cap sync`
2. Open Android Studio / Xcode
3. Sign with your developer account and ship

## Post-deploy smoke test

1. Open the HTTPS URL on phone A → Start Party → copy code  
2. Open same URL on phone B (same network) → Join → enter code  
3. Host Go Live → both play the same track  
4. Optional: pair a Bluetooth speaker in OS settings on either phone  
