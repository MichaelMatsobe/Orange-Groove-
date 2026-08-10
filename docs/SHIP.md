# Ship checklist — Orange Groove

Priority path from “code on GitHub” → real users.

---

## 1. Web live URL (fastest — today)

### Option A — GitHub Pages (free, automated)

1. Repo **Settings → Pages → Source: GitHub Actions**  
2. Push to `main` (or run **Actions → Deploy GitHub Pages**)  
3. Site URL (after first success):

```text
https://michaelmatsobe.github.io/Orange-Groove-/
```

(Exact URL uses your GitHub username + repo name.)

### Option B — Vercel / Netlify

- Import the repo; build command `npm run build`, output `dist`  
- Config files already present: `vercel.json`, `netlify.toml`  

**Users:** open the HTTPS URL on any phone browser → install as PWA if prompted.

---

## 2. Debug APK (sideload)

On a PC with Android Studio:

```bash
git pull
npm install
npm run android:debug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

Or **Actions → Android APK / AAB → Run workflow → debug** → download artifact.

Full steps: [`BUILD_APK.md`](../BUILD_APK.md)

---

## 3. Signed AAB + Play internal testing

1. Create upload keystore (`npm run android:rotate-key` or `keytool`)  
2. `npm run android:setup-signing` + edit `android/key.properties`  
3. Set GitHub secrets `ANDROID_KEYSTORE_*`  
4. Actions → Android → **bundle** **or** `npm run android:bundle`  
5. Play Console → Internal testing → upload AAB  

Docs: `docs/SECURITY_SIGNING.md`, `BUILD_APK.md`

---

## 4. iOS TestFlight

Requires **Mac + Apple Developer ($99/yr)**.

```bash
npm run build && npx cap add ios && npx cap sync ios
npm run ios:setup-fastlane
# then docs/FASTLANE_MATCH.md → fastlane beta / Actions → iOS TestFlight
```

---

## 5. Polish (in repo)

| Item | Status |
|------|--------|
| Real duration from local files | `src/utils/audioMetadata.ts` |
| Lock-screen / headset controls (web) | Media Session API in App |
| Background audio notes (native) | `src/native/backgroundAudio.ts` |
| Hotspot | Settings fallback + optional plugin |
| Unit tests | `npm test` (Vitest) |

---

## Smoke test (any path)

1. Two devices, same Wi‑Fi  
2. Host → Start party → share code  
3. Guest joins → Host Go Live  
4. Host adds local MP3 → guest receives & plays  
