# iOS code signing (Orange Groove / Capacitor)

Complete steps to sign and distribute the iOS app. Requires **macOS**, **Xcode**, and an **Apple Developer Program** membership.

---

## Concepts

| Asset | Purpose |
|-------|---------|
| **Team ID** | Your Apple Developer team |
| **App ID / Bundle ID** | `com.orangegroove.app` (must match `capacitor.config.ts`) |
| **Development certificate** | Run on your devices from Xcode |
| **Distribution certificate** | App Store / Ad Hoc / Enterprise |
| **Provisioning profile** | Ties App ID + cert + devices (or App Store) |
| **App Store Connect API key** | CI uploads (`.p8`) — never commit |

Prefer **Xcode Automatic Signing** for the Capacitor `ios/` project unless you have a complex enterprise setup.

---

## 1. One-time Apple setup

1. Enroll at [developer.apple.com](https://developer.apple.com)  
2. [App Store Connect](https://appstoreconnect.apple.com) → **My Apps → +** → bundle id `com.orangegroove.app`  
3. Certificates, Identifiers & Profiles → **Identifiers** → ensure App ID exists with capabilities you need (Push optional later)  

---

## 2. Generate the Xcode iOS project

```bash
npm install
npm run build
npx cap add ios          # once, macOS only
npx cap sync ios
npx cap open ios
```

---

## 3. Automatic signing in Xcode (recommended)

1. Select the **App** target → **Signing & Capabilities**  
2. Check **Automatically manage signing**  
3. **Team** → your Apple Developer team  
4. Confirm Bundle Identifier = `com.orangegroove.app`  
5. Xcode creates/uses Development + Distribution certs and profiles in your account  

### Device run

1. Connect iPhone → trust computer  
2. Select the device as run destination  
3. **Product → Run**  
4. On device: Settings → General → VPN & Device Management → trust developer if prompted  

---

## 4. Archive for App Store / TestFlight

1. Destination: **Any iOS Device (arm64)**  
2. **Product → Archive**  
3. Organizer → **Distribute App** → **App Store Connect** → Upload  
4. In App Store Connect → TestFlight → wait for processing → add internal testers  

---

## 5. Manual signing (optional)

Only if automatic signing is disabled:

1. Create **Apple Distribution** certificate in the developer portal (CSR from Keychain Access)  
2. Create **App Store** provisioning profile for `com.orangegroove.app`  
3. Download/install both  
4. Xcode → Signing → Manual → select cert + profile  

---

## 6. CI signing (GitHub Actions on macOS) — outline

Full iOS CI needs a `macos-latest` runner and stored secrets:

| Secret | Purpose |
|--------|---------|
| `APPSTORE_ISSUER_ID` | App Store Connect API |
| `APPSTORE_KEY_ID` | API key id |
| `APPSTORE_PRIVATE_KEY` | Contents of `AuthKey_xxx.p8` |
| `MATCH_PASSWORD` | If using Fastlane Match |
| `MATCH_GIT_URL` | Private repo of encrypted certs |

**Recommended path:** [Fastlane match](https://docs.fastlane.tools/actions/match/) + `fastlane deliver` / `pilot`.

Minimal Fastlane lane sketch (add under `ios/fastlane/` when you adopt Fastlane):

```ruby
lane :beta do
  setup_ci if ENV['CI']
  match(type: "appstore", readonly: true)
  build_app(workspace: "App/App.xcworkspace", scheme: "App")
  upload_to_testflight(skip_waiting_for_build_processing: true)
end
```

A starter workflow file is included as `.github/workflows/ios-placeholder.yml` (`workflow_dispatch` only) documenting required secrets without assuming Match is configured.

---

## 7. Certificate rotation (iOS)

1. Developer portal → revoke old **Distribution** cert if compromised  
2. Xcode → Settings → Accounts → Manage Certificates → **+** Apple Distribution  
3. Re-archive and upload  
4. Update Match repo / CI secrets if used  
5. Devices using old Ad Hoc profiles need new profiles  

App Store apps already installed keep working; **new** uploads need a valid distribution cert.

---

## 8. Security rules

- Never commit `.p12`, `.mobileprovision`, `AuthKey_*.p8`, or `match` passphrases  
- Use GitHub Environments with required reviewers for iOS release jobs  
- Prefer API keys with least privilege (App Manager / Developer)  

Covered by root `.gitignore`.

---

## 9. Checklist before first TestFlight

- [ ] `npm run build && npx cap sync ios`  
- [ ] Automatic signing shows no errors  
- [ ] Archive succeeds  
- [ ] App Store Connect app record exists  
- [ ] Privacy policy URL + screenshots ready for submission  
- [ ] Export compliance / encryption answers prepared  

Related: `NATIVE_BUILD.md`, `docs/SECURITY_SIGNING.md`.
