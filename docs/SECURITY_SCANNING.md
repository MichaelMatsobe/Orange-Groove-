# GitHub Actions security scanning

Orange Groove uses free GitHub-native and OSS scanners plus **Dependabot**.

---

## Enable in GitHub UI (once)

**Settings → Code security and analysis**

| Feature | Why |
|---------|-----|
| Dependency graph | Required for Dependabot & dependency-review |
| **Dependabot alerts** | Security advisories on dependencies |
| **Dependabot security updates** | Auto-PRs for vulnerable packages |
| Dependabot version updates | Driven by `.github/dependabot.yml` |
| Secret scanning + push protection | Block accidental secret pushes |
| Code scanning | Surfaces CodeQL results |

If **Code scanning** is disabled, the CodeQL job cannot upload results — enable it under the same settings page.

Details: [`DEPENDABOT.md`](DEPENDABOT.md)

---

## Workflows

| Workflow | File | What it does |
|----------|------|----------------|
| **Security scanning** | `security.yml` | npm audit (report), Gitleaks CLI, CodeQL, dependency-review (PRs) |
| **CI** | `ci.yml` | Typecheck + production web build |
| **Android** | `android.yml` | APK/AAB |
| **iOS TestFlight** | `ios.yml` | Fastlane Match + upload |
| **Key rotation checklist** | `key-rotation-checklist.yml` | Manual Android upload-key checklist |
| **Dependabot** | `dependabot.yml` | Weekly npm + Actions version PRs |

---

## Job behaviour (designed not to false-fail)

### npm audit

- Installs with `npm ci`, falls back to `npm install` if the lockfile is out of date  
- Findings (exit code 1) are **reported** and uploaded as `npm-audit-report` — they do **not** fail the job  
- Only npm tooling crashes fail the job  
- App source and runtime are unchanged  

### Gitleaks

- Uses the **official gitleaks binary** (not `gitleaks-action`, which requires an org license)  
- Fails only if real secrets are detected in git history  

### CodeQL

- Language: `javascript-typescript`  
- **No autobuild** — Vite/React apps are extracted from source; autobuild was a common failure cause  
- Results appear under **Security → Code scanning** when Code scanning is enabled on the repo  

### Dependency review

- Runs on **pull_request** only (skipped on `schedule` / `push`)  

---

## Interpreting results

| Job | Red X means |
|-----|-------------|
| npm audit | Unexpected npm failure (not “vulns found”) |
| gitleaks | Possible secret in history — rotate & purge |
| CodeQL | Analysis error or real code alert — open Security tab |
| dependency-review | PR introduces a high-severity vulnerable package |

Local:

```bash
npm audit
npm run security:audit
```

---

## Related docs

- `docs/SECURITY_SIGNING.md`  
- `docs/KEY_ROTATION.md`  
- `docs/IOS_SIGNING.md` / `docs/FASTLANE_MATCH.md`  
- `docs/DEPENDABOT.md`  
