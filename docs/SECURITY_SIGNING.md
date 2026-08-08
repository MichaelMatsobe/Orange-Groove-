# Secure keystore & app signing certificates

How to create, store, use, and rotate signing material for Orange Groove **without** leaking secrets into Git.

**Also read**

- [`KEY_ROTATION.md`](KEY_ROTATION.md) — upload-key rotation script + Play steps  
- [`IOS_SIGNING.md`](IOS_SIGNING.md) — Xcode / TestFlight / CI secrets  
- [`SECURITY_SCANNING.md`](SECURITY_SCANNING.md) — CodeQL, gitleaks, npm audit, dependency review  

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

**Recommendation:** enable **Play App Signing** on first upload. If you lose the upload key, Google can register a new one.

---

## 1. Create the upload keystore (once)

```bash
keytool -genkeypair -v \
  -keystore orange-groove-upload.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias orange-groove \
  -storetype PKCS12
```

Or use the rotation helper (also exports PEM):

```bash
npm run android:rotate-key
# → scripts/rotate-android-upload-key.sh
```

### Inspect fingerprint (public — safe to share)

```bash
keytool -list -v -keystore orange-groove-upload.jks -alias orange-groove
```

### Export certificate only (for Play upload-key reset)

```bash
keytool -export -rfc \
  -keystore orange-groove-upload.jks \
  -alias orange-groove \
  -file upload_certificate.pem
```

---

## 2. Local secure layout

```text
repo/                          (git)
  android/                     (gitignored)
  android/key.properties       (gitignored)
  scripts/android/signing.gradle

OUTSIDE git:
  orange-groove-upload.jks
  password manager entry
```

```bash
npm run android:setup-signing
npm run android:verify-signing
```

---

## 3. GitHub Actions secrets

| Secret | Contents |
|--------|----------|
| `ANDROID_KEYSTORE_BASE64` | `bash scripts/keystore-to-base64.sh orange-groove-upload.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | store password |
| `ANDROID_KEY_PASSWORD` | key password |
| `ANDROID_KEY_ALIAS` | `orange-groove` |

Hardening: Environment `android-release` with required reviewers; no signing secrets on fork PRs.

---

## 4. Google Play App Signing

1. Play Console → **Setup → App signing** → Google-managed key  
2. Upload AAB signed with **upload** keystore  
3. Copy SHA-256 fingerprints for API restrictions  
4. Lost upload key → request reset → new keystore via `npm run android:rotate-key`  

---

## 5. Rotation

See **[KEY_ROTATION.md](KEY_ROTATION.md)**.

---

## 6. iOS

See **[IOS_SIGNING.md](IOS_SIGNING.md)**.

---

## 7. Security scanning in CI

See **[SECURITY_SCANNING.md](SECURITY_SCANNING.md)**.

---

## 8. What never belongs in Git

```text
*.jks / *.keystore / *.p12
key.properties
*.mobileprovision / AuthKey_*.p8
```
