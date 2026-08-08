# iOS code signing (Orange Groove / Capacitor)

Complete steps for local Xcode signing, **Fastlane Match**, TestFlight, and GitHub Actions.

Also read: [`FASTLANE_MATCH.md`](FASTLANE_MATCH.md) · [`SECURITY_SIGNING.md`](SECURITY_SIGNING.md)

---

## Concepts

| Asset | Purpose |
|-------|---------|
| Bundle ID | `com.orangegroove.app` (must match `capacitor.config.ts`) |
| Development certificate | Run on devices from Xcode |
| Distribution certificate | App Store / TestFlight |
| Provisioning profile | Ties App ID + certs |
| App Store Connect API key | CI uploads (`.p8`) — never commit |
| Match repo | Private git repo of **encrypted** certs/profiles |

---

## Path A — Local Xcode only (fastest first install)

### 1. Apple setup

1. [Apple Developer](https://developer.apple.com) membership  
2. [App Store Connect](https://appstoreconnect.apple.com) → create app with bundle id `com.orangegroove.app`  

### 2. Generate iOS project

```bash
npm install && npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

### 3. Automatic signing

1. Target **App** → **Signing & Capabilities**  
2. **Automatically manage signing** → select **Team**  
3. Bundle ID = `com.orangegroove.app`  
4. **Product → Run** on a device, or **Product → Archive** → Distribute → App Store Connect  

---

## Path B — Fastlane Match + CI (team / automation)

```bash
bash scripts/setup-ios-fastlane.sh   # after cap add ios
# then follow docs/FASTLANE_MATCH.md end-to-end
```

Templates live in `templates/ios/fastlane/` (Fastfile, Matchfile, Appfile, Gemfile).

### GitHub Actions

- Workflow: **`.github/workflows/ios.yml`** (`workflow_dispatch`)  
- Environment: create **`ios-release`** with required reviewers  
- Secrets: `MATCH_GIT_URL`, `MATCH_PASSWORD`, `APPSTORE_KEY_ID`, `APPSTORE_ISSUER_ID`, `APPSTORE_PRIVATE_KEY`, optional `MATCH_SSH_PRIVATE_KEY` / `MATCH_GIT_BASIC_AUTHORIZATION`  

Actions → **iOS TestFlight** → Run workflow → lane `beta` or `build`.

---

## Certificate rotation (iOS)

1. If compromised: Developer portal → revoke Distribution cert  
2. With Match: `bundle exec fastlane match nuke distribution` then `match appstore`  
3. Re-run CI / local `fastlane beta`  
4. Update secrets if passphrase changed  

---

## Security rules

Never commit: `.p12`, `.mobileprovision`, `AuthKey_*.p8`, Match passphrase, deploy keys.  
Covered by root `.gitignore`. `ios/` is gitignored (generated on each machine/CI).

---

## Checklist — first TestFlight

- [ ] App record in App Store Connect  
- [ ] `cap sync ios` after latest `npm run build`  
- [ ] Automatic signing OK **or** Match `appstore` OK  
- [ ] Archive / `fastlane beta` succeeds  
- [ ] Privacy policy + screenshots for App Review when going public  
