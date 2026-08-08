# Native builds & store signing (Android / iOS)

Orange Groove is a Capacitor app. **Store-signed binaries require your own developer accounts** — this repo cannot sign or publish for you.

## Prerequisites

| Platform | You need |
|----------|----------|
| Android | [Google Play Console](https://play.google.com/console) account, JDK 17+, Android Studio |
| iOS | [Apple Developer Program](https://developer.apple.com) ($99/yr), macOS, Xcode |

## 1. Generate web assets

```bash
npm install
npm run build
```

## 2. Add native projects (once)

```bash
npx cap add android
npx cap add ios   # macOS only
npx cap sync
```

## 3. Icons (192 / 512 PNG)

```bash
# Requires ImageMagick: convert
npm run icons
# or: bash scripts/generate-icons.sh
```

Copies `public/icon-192.png` and `public/icon-512.png`.  
Then use [Capacitor Assets](https://github.com/ionic-team/capacitor-assets) or Android Studio / Xcode to generate full mipmap / AppIcon sets.

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#f97316'
```

## 4. Hotspot button (native)

`src/native/hotspot.ts`:

- Detects Capacitor
- Tries optional plugin `OrangeGrooveHotspot.startLocalOnly()` (you implement in Java/Kotlin)
- Falls back to opening system hotspot settings / user instructions

**iOS limitation:** apps cannot toggle Personal Hotspot; users must enable it in Settings.

Optional helper packages:

```bash
npm i @capacitor/app
npm i capacitor-native-settings   # opens Android tether settings
npx cap sync
```

## 5. Android — signed release (Play Store)

1. Open Android Studio: `npx cap open android`
2. Create a keystore (once):

```bash
keytool -genkey -v -keystore orange-groove-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias orange-groove
```

3. Configure `android/app/key.properties` (do **not** commit):

```properties
storePassword=****
keyPassword=****
keyAlias=orange-groove
storeFile=../orange-groove-release.jks
```

4. Wire signing in `android/app/build.gradle` (standard Android release signing block).
5. Build → Generate Signed Bundle / APK → **AAB** for Play Store.
6. Upload to Play Console → create release → complete store listing (icons, screenshots, privacy policy).

## 6. iOS — signed release (App Store)

1. `npx cap open ios`
2. Xcode → Signing & Capabilities → Team = your Apple Developer team
3. Bundle ID must match App Store Connect app record (`com.orangegroove.app`)
4. Archive → Distribute App → App Store Connect
5. Complete listing in App Store Connect (icons, screenshots, privacy)

## 7. What we cannot do from this repo

- Create your Play / Apple accounts  
- Generate or store your release keystore / certificates  
- Upload binaries to the stores  
- Bypass Apple’s Personal Hotspot restrictions  

## Smoke test before store submit

1. Two physical devices on same Wi‑Fi  
2. Host starts party → guest joins code → Go Live  
3. Host adds a small local MP3 → guest shows download progress → plays in sync  
4. Bluetooth speaker: pair in OS Settings, confirm audio routes correctly  
