# Dependabot alerts & version updates

## Enable alerts (required once — GitHub UI)

Scripts cannot flip these for you. In the repo:

1. **Settings → Code security and analysis** (or **Code security**)  
2. Enable:
   - **Dependency graph**  
   - **Dependabot alerts**  
   - **Dependabot security updates**  
   - **Dependabot version updates** (uses `.github/dependabot.yml`)  

Public repos usually have the graph available; private repos need it turned on.

Also recommended:

- **Secret scanning** + **Push protection**  
- **Code scanning** (CodeQL workflow already in `.github/workflows/security.yml`)  

---

## What `.github/dependabot.yml` does

| Ecosystem | Schedule | Notes |
|-----------|----------|--------|
| **npm** | Weekly Monday 06:00 SAST | Groups Capacitor and Vite/React updates |
| **github-actions** | Weekly Monday 06:30 SAST | Keeps Actions on patched versions |

Dependabot opens PRs labeled `dependencies`. CI (`ci.yml` + `security.yml`) runs on those PRs.

---

## Handling alert PRs

1. Read the advisory severity  
2. Merge Dependabot PR after CI green  
3. Or pin/override if a breaking change blocks release — document why  

```bash
npm audit
npm run security:audit
```

---

## Related

- `docs/SECURITY_SCANNING.md`  
- `.github/workflows/security.yml`  
