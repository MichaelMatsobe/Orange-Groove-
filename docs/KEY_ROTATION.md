# Automated key rotation (Android upload key)

Rotation of the **upload keystore** can be prepared by scripts; **Play Console enrollment is always manual** (Google identity checks).

---

## When to rotate

| Trigger | Action |
|---------|--------|
| Suspected leak (secret in log, stolen laptop) | Rotate **immediately** |
| Scheduled policy (e.g. yearly) | Rotate on schedule |
| Lost keystore file | Play → reset upload key → new keystore |
| Staff change with password knowledge | Rotate + update secrets |

Do **not** rotate the Play **app signing key** yourself if Play App Signing is enabled — Google holds it.

---

## Automated preparation (local)

```bash
bash scripts/rotate-android-upload-key.sh
# optional path:
bash scripts/rotate-android-upload-key.sh ./orange-groove-upload-2026.jks
```

The script:

1. Runs `keytool -genkeypair` (PKCS12)  
2. Exports `*_upload_certificate.pem` (public cert only)  
3. Prints SHA-256 fingerprint  
4. Prints the manual Play + GitHub steps  

It never commits files or calls the Play API.

---

## Manual Play Console steps (required)

1. [Play Console](https://play.google.com/console) → your app → **Setup → App signing**  
2. If the old upload key is compromised or lost: **Request upload key reset**  
3. Complete Google’s verification  
4. Provide the new **upload certificate** (`*.pem` from the script)  
5. Wait until the new upload key is active  

Until Play accepts the new cert, keep the old keystore for any in-flight releases.

---

## Update local + CI after Play accepts the new key

```bash
# 1. Point key.properties at the new keystore
# 2. Re-encode for GitHub Actions
bash scripts/keystore-to-base64.sh path/to/new.jks
# 3. Verify
npm run android:verify-signing
# 4. Canary
npm run android:bundle
```

---

## GitHub Actions

- **Key rotation checklist** — `.github/workflows/key-rotation-checklist.yml` (`workflow_dispatch`)  
- Does not mint private keys on runners  

---

## Post-rotation hygiene

- [ ] Internal testing AAB works  
- [ ] Old `.jks` destroyed after cutover  
- [ ] Password manager + GitHub secrets updated  
- [ ] API fingerprint allowlists updated  
