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

Details: [`DEPENDABOT.md`](DEPENDABOT.md)

---

## Workflows

| Workflow | File | What it does |
|----------|------|----------------|
| **Security scanning** | `security.yml` | npm audit, Gitleaks, CodeQL, dependency-review (PRs) |
| **CI** | `ci.yml` | Typecheck + production web build |
| **Android** | `android.yml` | APK/AAB |
| **iOS TestFlight** | `ios.yml` | Fastlane Match + upload |
| **Key rotation checklist** | `key-rotation-checklist.yml` | Manual Android upload-key checklist |
| **Dependabot** | `dependabot.yml` | Weekly npm + Actions version PRs |

---

## Scanners

### npm audit

```bash
npm audit
npm run security:audit
```

### Gitleaks

Full-history secret scan via `gitleaks/gitleaks-action@v2`.

### CodeQL

JS/TS `security-extended` → **Security → Code scanning**.

### Dependency review

On pull requests: fails on **high** severity new vulnerabilities.

### Dependabot

Weekly PRs for npm and GitHub Actions; security alerts when advisories publish.

---

## Related docs

- `docs/SECURITY_SIGNING.md`  
- `docs/KEY_ROTATION.md`  
- `docs/IOS_SIGNING.md` / `docs/FASTLANE_MATCH.md`  
- `docs/DEPENDABOT.md`  
