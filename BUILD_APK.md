# Build an Android APK (Orange Groove)

This guide turns the web app into an installable **APK** using Capacitor + Android Studio.

The repo does **not** include the `android/` folder until you generate it once on your machine.

---

## What you need

| Tool | Notes |
|------|--------|
| Node.js 18+ | `node -v` |
| npm | comes with Node |
| [Android Studio](https://developer.android.com/studio) | with Android SDK |
| JDK 17 | Android Studio usually installs one |
| Android phone or emulator | USB debugging on for physical device |

Optional for Play Store: Google Play Console account + a release keystore.

---

## 1. Install dependencies and build the web app

```bash
git clone https://github.com/MichaelMatsobe/Orange-Groove-.git
cd Orange-Groove-
npm install
npm run build
```

Confirm `dist/` exists and contains `index.html`.

---

## 2. Add the Android project (once)

```bash
npx cap add android
npx cap sync
```

This creates `android/` (gitignored by default — do not commit secrets).

**After any future web change:**

```bash
npm run build
npx cap sync
```

---

## 3. Open in Android Studio

```bash
npx cap open android
```

Or: Android Studio → **File → Open** → select the `android/` folder.

Wait for **Gradle sync** to finish (bottom status bar).

---

## 4. Debug APK (fast — for testing on your phone)

### Option A — Run on a connected device

1. Enable **Developer options** + **USB debugging** on the phone.  
2. Plug in USB (or start an emulator).  
3. In Android Studio toolbar: select your device.  
4. Click the green **Run** ▶ button.  

App installs and launches.

### Option B — Build a debug APK file

1. Menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.  
2. Wait for success → click **locate** in the notification.  

Typical path:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Copy that file to the phone and open it (allow “Install unknown apps” for your file manager).

Or install via USB:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 5. Release APK (signed — share or sideload widely)

### 5.1 Create a keystore (once — keep it safe)

```bash
keytool -genkey -v \
  -keystore orange-groove-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias orange-groove
```

Store the `.jks` file and passwords offline. **Losing the keystore means you cannot update the same app on Play Store.**

### 5.2 Point Gradle at the keystore

Create `android/app/key.properties` (do **not** commit this file):

```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=orange-groove
storeFile=../orange-groove-release.jks
```

Place `orange-groove-release.jks` next to the `android/` folder (or adjust `storeFile` path).

### 5.3 Wire signing in `android/app/build.gradle`

Near the top of `android/app/build.gradle` (Groovy) or `build.gradle.kts`, load the properties and add a `signingConfigs` / `release` block. Example (Groovy):

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('app/key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...

    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            // proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

(Exact file layout can vary slightly by Capacitor version — match the existing `android { }` block in your project.)

### 5.4 Build the release APK

**Android Studio**

1. **Build → Generate Signed App Bundle or APK…**  
2. Choose **APK** (or **Android App Bundle** for Play Store).  
3. Select your keystore, alias, passwords.  
4. Build **release**.  

**CLI**

```bash
cd android
./gradlew assembleRelease
```

Output:

```text
android/app/build/outputs/apk/release/app-release.apk
```

---

## 6. Play Store (AAB, not APK)

Google Play prefers an **Android App Bundle**:

```bash
cd android
./gradlew bundleRelease
```

```text
android/app/build/outputs/bundle/release/app-release.aab
```

Upload the `.aab` in [Play Console](https://play.google.com/console) → your app → Production / Testing track.

You will also need:

- App icon & feature graphic  
- Screenshots  
- Privacy policy URL  
- Content rating questionnaire  

---

## 7. Icons (recommended before release)

```bash
npm run icons
# optional full set:
npm install -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#f97316'
npx cap sync
```

---

## 8. Smoke test on device

1. Install APK on **two** phones on the same Wi‑Fi (or host hotspot).  
2. Host → **Start Party** → share code.  
3. Guest → **Join with Party Code**.  
4. Host → **Go Live** — both should play the same track.  
5. Host adds a small local MP3 — guest should download then sync.  
6. Pair a Bluetooth speaker in **phone Settings** (not in-app) and confirm audio routes.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `dist/` missing / blank WebView | Run `npm run build` then `npx cap sync` |
| Gradle sync failed | Open SDK Manager; install recommended SDK + build-tools |
| App can’t use network / WebRTC | Check Android manifest has `INTERNET`; use HTTPS or cleartext if debugging |
| Peers don’t connect | Same Wi‑Fi/hotspot; some guest isolation blocks client-to-client — host-mediated sync still works |
| “App not installed” | Uninstall older build with different signature; enable unknown sources |
| Release build unsigned | Confirm `signingConfigs.release` and `key.properties` |

Cleartext / network notes: production should load the app from the packaged `dist/` assets (no remote server required for core party sync).

---

## Related docs

- `NATIVE_BUILD.md` — signing overview + iOS notes  
- `DEPLOY.md` — web / PWA hosting  
- `README.md` — product overview  

---

## What this repo cannot do for you

- Run Android Studio in the cloud for your account  
- Create or store your release keystore  
- Upload to Google Play  

Once `android/` exists on your machine, building an APK is a standard Capacitor → Gradle step.
