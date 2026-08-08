# GitHub Actions security scanning

Orange Groove uses several free GitHub-native / OSS scanners.

---

## Workflows

| Workflow | File | What it does |
|----------|------|----------------|
| **Security scanning** | `.github/workflows/security.yml` | npm audit, Gitleaks, CodeQL, dependency-review (PRs) |
| **CI** | `ci.yml` | Typecheck + production web build |
| **Android** | `android.yml` | APK/AAB (signed only with secrets) |
| **Key rotation checklist** | `key-rotation-checklist.yml` | Manual rotation reminder (no keygen in CI) |
| **iOS placeholder** | `ios-placeholder.yml` | Documents iOS CI secrets |

Triggers for `security.yml`: push/PR to main, weekly cron, manual dispatch.

---

## Scanners explained

### npm audit

- Runs `npm audit --omit=dev --audit-level=high`  
- Full JSON uploaded as artifact `npm-audit-report`  
- `continue-on-error` on the high gate so informational findings don’t hard-block; tighten to `exit 1` when the dependency tree is clean  

Fix locally:

```bash
npm audit
npm audit fix
```

### Gitleaks

- Scans full git history for accidental secrets (AWS keys, private keys, tokens)  
- Uses `gitleaks/gitleaks-action@v2`  
- Enable [GitHub secret scanning](https://docs.github.com/en/code-security/secret-scanning) on the repo for push protection  

### CodeQL

- Semantic analysis for JavaScript/TypeScript (`security-extended` queries)  
- Results appear under the repo **Security → Code scanning** tab  
- Requires `security-events: write` permission (set in the workflow)  

### Dependency review (pull requests only)

- Blocks PRs that introduce **high** severity vulnerable packages  
- Requires GitHub Dependency graph (enabled by default on public repos; for private repos enable under Settings → Code security)  

---

## Recommended repo settings (manual, once)

1. **Settings → Code security and analysis**  
   - Dependency graph: On  
   - Dependabot alerts: On  
   - Dependabot security updates: On  
   - Secret scanning: On  
   - Push protection: On  
2. **Settings → Actions → General**  
   - Restrict actions to required marketplace actions if desired  
3. **Environments → `android-release`**  
   - Required reviewers for signed Android jobs  

---

## Interpreting failures

| Job fails | Typical fix |
|-----------|-------------|
| npm audit | Upgrade dependency; or accept risk and document |
| gitleaks | Remove secret, rotate credential, purge from history if needed |
| CodeQL | Fix flagged sink or mark false positive in Security UI |
| dependency-review | Change the dependency version in the PR |

---

## Related docs

- `docs/SECURITY_SIGNING.md` — keystores & certificates  
- `docs/KEY_ROTATION.md` — upload key rotation  
- `docs/IOS_SIGNING.md` — Apple signing  
