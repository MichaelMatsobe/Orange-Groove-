# Fastlane Match setup (Orange Groove iOS)

Match stores **encrypted** iOS certificates and provisioning profiles in a **private** Git repo so every machine and CI uses the same signing assets.

Official docs: https://docs.fastlane.tools/actions/match/

---

## Architecture

```text
Private repo (MATCH_GIT_URL)
  └── encrypted certs + profiles
          ▲
          │ match (decrypt with MATCH_PASSWORD)
          │
   ┌──────┴──────┐
   │  Xcode / CI │  → signs App → TestFlight
   └─────────────┘
```

---

## Prerequisites

| Item | Notes |
|------|--------|
| macOS + Xcode | Local Match init and first cert create |
| Apple Developer Program | Paid membership |
| App ID | `com.orangegroove.app` already in developer portal |
| Private Git repo | e.g. `your-org/orange-groove-certs` — **empty**, private |
| App Store Connect API key | Issuer ID, Key ID, `.p8` file |

---

## 1. Create App Store Connect API key

1. [App Store Connect](https://appstoreconnect.apple.com) → **Users and Access → Integrations → App Store Connect API**  
2. **Generate API Key** → role **Admin** or **App Manager**  
3. Download `AuthKey_XXXXXXXXXX.p8` **once**  
4. Note **Key ID** and **Issuer ID**  
5. Store the `.p8` in a password manager — never commit it  

---

## 2. Private Match storage repo

1. Create a **private** empty GitHub repo (no README if you prefer a clean Match init)  
2. Ensure your Mac can `git push` via SSH or HTTPS  
3. You will set:

```bash
export MATCH_GIT_URL="git@github.com:YOUR_ORG/orange-groove-certs.git"
export MATCH_PASSWORD="long-random-passphrase"  # encrypts the repo contents
```

Back up `MATCH_PASSWORD` offline. Losing it means re-creating all certs.

---

## 3. Capacitor iOS + Fastlane templates

```bash
npm install
npm run build
npx cap add ios
npx cap sync ios
bash scripts/setup-ios-fastlane.sh
cd ios
bundle install   # uses templates/ios/fastlane/Gemfile copied into ios/fastlane or place Gemfile at ios/
```

If Bundler looks for a Gemfile at `ios/Gemfile`, copy it:

```bash
cp templates/ios/fastlane/Gemfile ios/Gemfile
cd ios && bundle install
```

---

## 4. Initialize Match (once, on your Mac)

```bash
cd ios
export MATCH_GIT_URL="git@github.com:YOUR_ORG/orange-groove-certs.git"
export MATCH_PASSWORD="your-strong-passphrase"

# Optional API key env for non-interactive Apple auth:
export APPSTORE_KEY_ID="..."
export APPSTORE_ISSUER_ID="..."
export APPSTORE_PRIVATE_KEY="$(cat /secure/path/AuthKey_XXX.p8)"

bundle exec fastlane match init
bundle exec fastlane match appstore
```

`match appstore` creates/downloads the Distribution cert + App Store profile into the encrypted repo.

For local device runs:

```bash
bundle exec fastlane match development
```

---

## 5. Local TestFlight upload

```bash
# From repo root — refresh web assets
npm run build && npx cap sync ios

cd ios
bundle exec fastlane beta
```

Lane `beta` → Match (readonly on CI) → `build_app` → `upload_to_testflight`.

---

## 6. GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|--------|
| `MATCH_GIT_URL` | `git@github.com:ORG/orange-groove-certs.git` or HTTPS URL |
| `MATCH_PASSWORD` | Match encryption passphrase |
| `APPSTORE_KEY_ID` | API Key ID |
| `APPSTORE_ISSUER_ID` | Issuer ID |
| `APPSTORE_PRIVATE_KEY` | Full `.p8` PEM text (use `\n` for newlines if needed) |
| `MATCH_GIT_BASIC_AUTHORIZATION` | Optional: `base64 -i <(echo -n "user:ghp_pat")` if HTTPS to certs repo |
| `MATCH_SSH_PRIVATE_KEY` | Optional: deploy key private key for SSH to certs repo |

Also create Environment **`ios-release`** with required reviewers for production uploads.

---

## 7. CI workflow

`.github/workflows/ios.yml` runs on `workflow_dispatch`:

1. Checkout + Node build + `cap sync`  
2. Install Ruby / Bundler / Fastlane  
3. Configure SSH or basic auth to Match repo  
4. `bundle exec fastlane beta`  

If secrets are missing, the workflow fails fast with a pointer to this doc.

---

## 8. Match repo access from GitHub Actions

### Option A — Deploy key (SSH)

1. Generate a deploy key pair; add **read-only** public key on `orange-groove-certs`  
2. Secret `MATCH_SSH_PRIVATE_KEY` = private key  
3. Workflow runs `webfactory/ssh-agent`  

### Option B — HTTPS + PAT

1. Fine-scoped PAT with access to the certs repo  
2. `MATCH_GIT_BASIC_AUTHORIZATION=$(echo -n "x-access-token:ghp_..." | base64)`  
3. Match uses `git_basic_authorization`  

---

## 9. Rotation / nuke

```bash
# Danger: revokes certs in Apple portal and regenerates
bundle exec fastlane match nuke distribution
bundle exec fastlane match appstore
```

Only after coordinating with anyone else using the certs repo. Update CI secrets if the passphrase changes.

---

## 10. Checklist

- [ ] Private certs repo created  
- [ ] `MATCH_PASSWORD` backed up  
- [ ] API key `.p8` created  
- [ ] `match appstore` succeeded once locally  
- [ ] `fastlane beta` uploaded to TestFlight  
- [ ] GitHub secrets set  
- [ ] `ios-release` environment configured  
- [ ] Actions → **iOS TestFlight** workflow run succeeded  

Related: `docs/IOS_SIGNING.md`, `templates/ios/fastlane/*`.
