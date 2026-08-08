# Build an Android APK / AAB (Orange Groove)

End-to-end guide: local debug APK, **automated Gradle release signing**, and **GitHub Actions CI/CD**.

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
npm run android:debug     # debug APK via scripts/build-android.sh
npm run android:release   # signed release APK (needs key.properties + .jks)
npm run android:bundle    # signed Play Store AAB
npm run android:setup-signing   # wire Gradle signing into android/
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

### One-liner script

```bash
npm run android:debug
```

Output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

### Android Studio

```bash
npx cap open android
```

1. Wait for Gradle sync.  
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**.  
3. Or click **Run ▶** with a device/emulator selected.  

### Install on phone

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Enable **USB debugging** and accept the RSA prompt on the device.

---

## 3. Automated Gradle release signing

### 3.1 Create a keystore (once)

```bash
keytool -genkey -v \
  -keystore orange-groove-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias orange-groove
```

Put the `.jks` in the **repo root** (same level as `android/`), or adjust the path in `key.properties`.

**Back up** the keystore and passwords offline. Loss = you cannot update the same Play listing.

### 3.2 Wire signing into the Android project

```bash
npm run android:setup-signing
```

This script:

1. Copies `scripts/android/key.properties.example` → `android/key.properties` (if missing)  
2. Appends `apply from: "../../scripts/android/signing.gradle"` to `android/app/build.gradle`  

### 3.3 Edit `android/key.properties`

```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=orange-groove
storeFile=../orange-groove-release.jks
```

`storeFile` is resolved from the **`android/`** project root (`rootProject.file`).

### 3.4 What `signing.gradle` does

File: `scripts/android/signing.gradle`

- Loads `android/key.properties` or `android/app/key.properties`  
- Defines `signingConfigs.release`  
- Sets `buildTypes.release.signingConfig` when the properties file exists  
- Leaves **debug** on the default debug keystore  

### 3.5 Build signed release

```bash
npm run android:release
# → android/app/build/outputs/apk/release/app-release.apk

npm run android:bundle
# → android/app/build/outputs/bundle/release/app-release.aab
```

Or manually:

```bash
cd android
./gradlew assembleRelease
./gradlew bundleRelease
```

### Kotlin DSL note

If Capacitor generated `app/build.gradle.kts` instead of Groovy, the setup script prints a warning. Add an equivalent `signingConfigs { create("release") { ... } }` block manually using the same `key.properties` keys (see Android docs for Kotlin DSL signing).

### Never commit

Already in `.gitignore`:

- `*.jks` / `*.keystore`  
- `key.properties`  
- `android/` (entire native tree)  

---

## 4. CI/CD (GitHub Actions)

Workflows live under `.github/workflows/`:

| Workflow | File | Trigger | Output |
|----------|------|---------|--------|
| **CI** | `ci.yml` | push/PR to main | Typecheck + `npm run build` + `dist` artifact |
| **Android** | `android.yml` | push (paths) + **workflow_dispatch** | Debug APK, or signed release APK/AAB |

### 4.1 CI (web) — no secrets

On every push/PR:

1. `npm ci`  
2. `npm run lint`  
3. `npm run build`  
4. Uploads `dist/` as artifact **web-dist**  

### 4.2 Android workflow — manual or on relevant pushes

**Automatic (debug):** pushes that touch `src/`, `package.json`, Capacitor config, or Android scripts run a **debug** APK build and upload **app-debug-apk**.

**Manual (recommended for release):**

1. GitHub repo → **Actions** → **Android APK / AAB**  
2. **Run workflow**  
3. Choose `debug` | `release` | `bundle`  
4. Download the artifact when finished  

### 4.3 Secrets for signed CI builds

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|--------|--------|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 orange-groove-release.jks` (Linux) or `base64 -i orange-groove-release.jks` (macOS) |
| `ANDROID_KEYSTORE_PASSWORD` | store password |
| `ANDROID_KEY_PASSWORD` | key password |
| `ANDROID_KEY_ALIAS` | usually `orange-groove` |

Encode keystore:

```bash
# Linux
base64 -w0 orange-groove-release.jks | pbcopy   # or redirect to a file you paste into the secret

# macOS
base64 -i orange-groove-release.jks | pbcopy
```

The workflow:

1. Builds `dist/`  
2. `cap add android` + `cap sync` (ephemeral runner)  
3. Decodes the keystore + writes `android/key.properties`  
4. Runs `setup-android-signing.sh`  
5. `assembleRelease` or `bundleRelease`  
6. Uploads APK/AAB artifact  
7. Deletes keystore files in a cleanup step  

**Without those secrets**, only **debug** builds succeed in CI.

### 4.4 Download CI artifacts

Actions → selected run → **Artifacts** → download zip → unzip APK/AAB.

---

## 5. Play Store upload (AAB)

1. Build AAB: `npm run android:bundle` or CI `bundle`  
2. [Play Console](https://play.google.com/console) → Create app → Production or closed testing  
3. Upload `app-release.aab`  
4. Complete store listing (icon, screenshots, privacy policy, content rating)  

Package name must stay **`com.orangegroove.app`** (see `capacitor.config.ts`) unless you change it before the first upload.

---

## 6. Icons before release

```bash
npm run icons
npm install -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#f97316'
npx cap sync android
```

---

## 7. Smoke test checklist

- [ ] Two devices, same Wi‑Fi or host hotspot  
- [ ] Host starts party → guest joins 6-digit code  
- [ ] Host **Go Live** → audio in sync  
- [ ] Host adds small local MP3 → guest receives / plays  
- [ ] BT speaker: pair in **system Settings**, confirm routing  

---

## 8. Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank WebView | `npm run build && npx cap sync android` |
| `android/` missing | `npx cap add android` |
| Release APK unsigned | Run `npm run android:setup-signing` + valid `key.properties` |
| CI release fails | Set all four `ANDROID_*` secrets; re-run workflow_dispatch with `release` |
| `storeFile` not found | Path is relative to `android/` (`../orange-groove-release.jks` for repo-root jks) |
| Gradle SDK error | Open project once in Android Studio to install SDK packages |
| Peers don’t join | Same network; allow local network permission on iOS/Android 13+ if prompted |

---

## 9. File map

```text
scripts/
  build-android.sh           # debug | release | bundle pipeline
  setup-android-signing.sh   # patches android/app/build.gradle
  android/
    key.properties.example
    signing.gradle           # Gradle signingConfigs.release
.github/workflows/
  ci.yml                     # web lint + build
  android.yml                # APK/AAB CI
BUILD_APK.md                 # this file
NATIVE_BUILD.md              # high-level native + iOS notes
```

---

## What stays manual on your side

- Creating the keystore and passwords  
- Adding GitHub secrets  
- Play Console listing and upload  
- Accepting device USB debugging prompts  

Everything else (web build → Capacitor sync → Gradle assemble → CI artifacts) is automated by the scripts and workflows above.
