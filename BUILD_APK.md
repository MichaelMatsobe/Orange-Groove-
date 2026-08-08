# Build an Android APK / AAB (Orange Groove)

End-to-end guide: local debug APK, **automated Gradle release signing**, and **GitHub Actions CI/CD**.

**Secure keystore & certificates:** see [`docs/SECURITY_SIGNING.md`](docs/SECURITY_SIGNING.md)  
(Play App Signing, upload vs app signing keys, CI secrets, rotation, what never to commit).

The `android/` folder is generated on your machine (`npx cap add android`) and is gitignored.

---

## Prerequisites

| Tool | Notes |
|------|--------|
| Node.js 18+ | `node -v` |
| npm | with lockfile support |
| [Android Studio](https://developer.android.com/studio) | SDK + platform-tools |
| JDK 17 | Android Studio’s embedded JDK is fine |
| `keytool` | ships with the JDK |

---

## Quick commands (after first setup)

```bash
npm run android:debug            # debug APK
npm run android:setup-signing    # wire Gradle + key.properties template
npm run android:verify-signing   # check keystore not tracked by git
npm run android:release          # signed release APK
npm run android:bundle           # signed Play Store AAB
bash scripts/keystore-to-base64.sh orange-groove-upload.jks  # for CI secret
```

---

## 1. First-time local setup

```bash
git clone https://github.com/MichaelMatsobe/Orange-Groove-.git
cd Orange-Groove-
npm install
npm run build
npx cap add android
npx cap sync android
```

Confirm:

- `dist/index.html` exists  
- `android/app/build.gradle` (or `.kts`) exists  

---

## 2. Debug APK (no signing secrets)

```bash
npm run android:debug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

Android Studio: `npx cap open android` → **Build → Build APK(s)** or **Run ▶**.

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 3. Automated Gradle release signing

### 3.1 Create upload keystore (once)

```bash
keytool -genkeypair -v \
  -keystore orange-groove-upload.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias orange-groove -storetype PKCS12
```

Back up the `.jks` + passwords offline. Full security process: **docs/SECURITY_SIGNING.md**.

### 3.2 Wire signing

```bash
npm run android:setup-signing
# edit android/key.properties (storePassword, keyPassword, storeFile)
npm run android:verify-signing
```

`scripts/android/signing.gradle` defines `signingConfigs.release` and attaches it to `buildTypes.release`.

### 3.3 Build signed artifacts

```bash
npm run android:release   # APK
npm run android:bundle    # AAB for Play
```

---

## 4. CI/CD (GitHub Actions)

| Workflow | Trigger | Output |
|----------|---------|--------|
| `ci.yml` | push/PR | Web typecheck + `dist` |
| `android.yml` | push (paths) + **workflow_dispatch** | Debug APK or signed release/bundle |

### Secrets (Settings → Secrets → Actions)

| Secret | How to create |
|--------|----------------|
| `ANDROID_KEYSTORE_BASE64` | `bash scripts/keystore-to-base64.sh orange-groove-upload.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | store password |
| `ANDROID_KEY_PASSWORD` | key password |
| `ANDROID_KEY_ALIAS` | `orange-groove` |

### Optional environment protection

1. **Settings → Environments → New** → name: `android-release`  
2. Enable **Required reviewers**  
3. Release/bundle jobs use this environment when selected in **Run workflow**  

### Run a signed build

Actions → **Android APK / AAB** → **Run workflow** → `release` or `bundle` → download artifact.

---

## 5. Play App Signing (certificates)

1. Play Console → **Setup → App signing** → use Google-managed app signing key  
2. Upload an AAB signed with your **upload** keystore  
3. Copy **SHA-256** fingerprints for API console restrictions  
4. If upload key is lost: request reset in Play Console, generate a new keystore, update secrets  

Details and diagrams: **docs/SECURITY_SIGNING.md**.

---

## 6. Icons

```bash
npm run icons
npm install -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#f97316'
npx cap sync android
```

---

## 7. Smoke test

- [ ] Two devices, same Wi‑Fi or hotspot  
- [ ] Host party → guest code → Go Live  
- [ ] Local MP3 streams to guest  
- [ ] BT speaker via OS settings  

---

## 8. Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank WebView | `npm run build && npx cap sync android` |
| Unsigned release | `android:setup-signing` + valid `key.properties` |
| CI release fails | All four `ANDROID_*` secrets set |
| `storeFile` not found | Path relative to `android/` (`../orange-groove-upload.jks`) |
| key.properties in git | `git rm --cached` + verify `.gitignore` |

---

## 9. File map

```text
docs/SECURITY_SIGNING.md     # keystore security + certificates
scripts/build-android.sh
scripts/setup-android-signing.sh
scripts/verify-signing-setup.sh
scripts/keystore-to-base64.sh
scripts/android/signing.gradle
scripts/android/key.properties.example
.github/workflows/ci.yml
.github/workflows/android.yml
```
