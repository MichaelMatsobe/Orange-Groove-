# Secure keystore & app signing certificates

How to create, store, use, and rotate signing material for Orange Groove **without** leaking secrets into Git.

---

## Threat model (what we protect against)

| Risk | Mitigation |
|------|------------|
| Keystore committed to Git | `.gitignore` for `*.jks`, `*.keystore`, `key.properties` |
| Passwords in source | Env vars / GitHub **Secrets** / local `key.properties` only |
| CI log leakage | Workflows never `echo` passwords; cleanup step deletes keystore |
| Laptop theft | Encrypt disk; store backup keystore offline (password manager + USB in safe) |
| Lost upload key | Enroll **Play App Signing** so Google holds the app signing key |
| Malicious PR | Do not expose signing secrets to `pull_request` from forks |

---

## Certificate roles (Android)

```text
┌─────────────────────┐         ┌──────────────────────────┐
│  Upload keystore    │ signs   │  AAB / APK you upload     │
│  (you hold this)    │ ──────► │  to Play Console          │
└─────────────────────┘         └────────────┬─────────────┘
                                             │
                                             ▼
                                ┌──────────────────────────┐
                                │  Google Play App Signing │
                                │  re-signs with app       │
                                │  signing key (Google)    │
                                └──────────────────────────┘
                                             │
                                             ▼
                                Users install from Play
```

| Key | Who holds it | Purpose |
|-----|--------------|---------|
| **Upload key** | You | Signs the AAB/APK you upload to Play |
| **App signing key** | Google (Play App Signing) or you (legacy) | Final signature on devices |
| **Debug keystore** | Auto (`~/.android/debug.keystore`) | Local debug builds only |

**Recommendation:** enable **Play App Signing** on first upload. If you lose the upload key, Google can register a new one. If you also held the app signing key yourself and lose it, you cannot update the app.

---

## 1. Create the upload keystore (once)

```bash
# From repo root — do NOT commit the output file
keytool -genkeypair -v \
  -keystore orange-groove-upload.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias orange-groove \
  -storetype PKCS12
```

Prompts: name/org (can be your name), store password, key password (can match store).

**Password rules**

- Prefer a long random password (password manager).  
- Never reuse your Google/Apple account password.  
- Store password + alias + backup of `.jks` in at least **two** offline places.

### Inspect the certificate (public fingerprint — safe to share)

```bash
keytool -list -v -keystore orange-groove-upload.jks -alias orange-groove
```

Note **SHA-256** fingerprint for Play Console / API restrictions. Fingerprints are **not** secret; the private key is.

### Export a certificate only (no private key) — for Play “upload key certificate”

```bash
keytool -export -rfc \
  -keystore orange-groove-upload.jks \
  -alias orange-groove \
  -file upload_certificate.pem
```

`upload_certificate.pem` can be uploaded to Play if asked; it does not contain the private key.

---

## 2. Local secure layout

```text
repo/                          (git)
  android/                     (gitignored native project)
  android/key.properties       (gitignored — passwords)
  scripts/android/signing.gradle

OUTSIDE git / encrypted backup:
  orange-groove-upload.jks
  password manager entry
  printed recovery sheet (optional)
```

`android/key.properties` example:

```properties
storePassword=***
keyPassword=***
keyAlias=orange-groove
storeFile=../orange-groove-upload.jks
```

`storeFile` is relative to the **`android/`** Gradle root.

Apply wiring:

```bash
npm run android:setup-signing
```

---

## 3. GitHub Actions secrets (CI)

### Required secrets for signed builds

| Secret | Contents |
|--------|----------|
| `ANDROID_KEYSTORE_BASE64` | Base64 of the `.jks` / `.keystore` file |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_PASSWORD` | Key password |
| `ANDROID_KEY_ALIAS` | e.g. `orange-groove` |

### Encode keystore for the secret (local machine only)

```bash
bash scripts/keystore-to-base64.sh orange-groove-upload.jks
# prints base64 — paste into GitHub Secret ANDROID_KEYSTORE_BASE64
# does not write the keystore into the repo
```

Or:

```bash
# Linux
base64 -w0 orange-groove-upload.jks
# macOS
base64 -i orange-groove-upload.jks
```

### Hardening CI

1. **Settings → Secrets and variables → Actions** — repository secrets (not variables).  
2. Prefer an **Environment** named `android-release` with required reviewers for `release` / `bundle` workflows.  
3. Never pass secrets to workflows triggered by `pull_request` from forks. Our `android.yml` signs only on `workflow_dispatch` when you choose release/bundle.  
4. Rotate passwords if a secret might have been exposed; generate a new upload key and register it in Play if needed.  

### Environment protection (recommended)

1. Repo → **Settings → Environments → New environment** → `android-release`  
2. Enable **Required reviewers**  
3. In `android.yml`, add under the release job:

```yaml
environment: android-release
```

(See workflow file for the applied config.)

---

## 4. Google Play App Signing — missing enrollment steps

1. Play Console → your app → **Setup → App signing**  
2. Choose **Use Google-generated key** (recommended) or export/import per Google’s wizard  
3. First upload an AAB signed with your **upload** keystore  
4. Play shows **App signing key certificate** and **Upload key certificate** SHA-1 / SHA-256  
5. Use those fingerprints for Firebase, OAuth, Maps API restrictions, etc.  

### Lost upload key

1. Play Console → App signing → **Request upload key reset**  
2. Follow Google’s identity check  
3. Generate a **new** keystore locally  
4. Export new `upload_certificate.pem` and submit as instructed  
5. Update local `key.properties` + GitHub secrets  

### Lost app signing key (only if you managed it yourself)

- **Cannot** update the existing listing. You must publish a new app id.  
- This is why Play App Signing is strongly recommended.

---

## 5. iOS certificates (brief)

| Asset | Where |
|-------|--------|
| Apple Developer membership | developer.apple.com |
| Distribution certificate | Xcode → Settings → Accounts → Manage Certificates |
| Provisioning profile | App Store Connect / Xcode automatic signing |
| App ID | `com.orangegroove.app` |

Prefer **Xcode automatic signing** for the Capacitor `ios/` project. Store distribution certs in the Keychain; for CI use [Fastlane match](https://docs.fastlane.tools/actions/match/) or App Store Connect API keys — **not** committed files.

---

## 6. Rotation checklist

- [ ] Generate new upload keystore  
- [ ] Export new certificate PEM  
- [ ] Register with Play (reset upload key if required)  
- [ ] Update `android/key.properties` locally  
- [ ] Update all four GitHub secrets  
- [ ] Build a test AAB and upload to internal testing track  
- [ ] Securely delete old keystore copies after cutover  

---

## 7. What never belongs in Git

```text
*.jks / *.keystore
key.properties
upload_certificate.pem   # optional to ignore; not secret but clutter
*.mobileprovision
AuthKey_*.p8             # Apple API keys
```

Verified via root `.gitignore`.

---

## 8. Related commands

```bash
npm run android:setup-signing
npm run android:release
npm run android:bundle
bash scripts/keystore-to-base64.sh path/to.jks
bash scripts/verify-signing-setup.sh
```

See also: `BUILD_APK.md` (build pipeline), `NATIVE_BUILD.md` (store overview).
