# Contributing — Branching, PRs & CI/CD

Dudgital follows the same ladder as BeyondSQM. Ticket prefix: **`DUDG-XXX`**.

## Branch ladder

```text
main (= production)     shipped releases only
 └── staging            integration trunk — all tickets merge here first
      └── DUDG-XXX      one branch per ticket, cut from local staging
      └── release/vX.Y.Z  SemVer cut from origin/staging → promote to main
```

1. Cut ticket work from **local `staging`**:  
   `git switch staging && git pull && git switch -c DUDG-010`
2. Open the PR **as a draft** into `staging` while you work — GitHub Actions stays idle.
3. Push often; mark **Ready for review** → triggers **PR CI**.
4. Merge into `staging` only when `ci-success` is green and the ticket AC is met.
5. After merge: **do not** keep coding on that branch. Cut a **new** branch from current `staging` for follow-on work.
6. Production: cut SemVer `release/vX.Y.Z` from `origin/staging` → **Release → Production** promotes `main` + tag.

## Pull requests

- Branch name = ticket ID (`DUDG-010`). Description lives in the **PR title**, not the branch.
- PR title format: `DUDG-010: short description`
- Base branch: **`staging`** (default). Hotfixes into `main` are exceptional.
- Draft → Ready is the only switch that starts PR CI.

## CI/CD triggers

| Workflow | Runs when | What it does |
|----------|-----------|--------------|
| **PR CI** (`pr.yml`) | PR into `staging`/`main` marked **Ready for review** (never on drafts) | build · typecheck · test · aggregate `ci-success` |
| **Release → Production** (`release-production.yml`) | Push of SemVer **`release/vX.Y.Z`** (or `workflow_dispatch`) | validate SemVer · build · typecheck · test · FF **`main`** · git tag `vX.Y.Z` |

- Ticket branches never deploy production.
- **`main` is the production / publish line.** Releases are cut from `origin/staging`.
- npm publish remains owner-gated ([docs/08-publish.md](./docs/08-publish.md)) — not in CI yet.
- No Vercel/E2E in v0 CI (add later when apps need them).

## Cutting a production release

```bash
git fetch origin
git switch -c release/v0.1.0 origin/staging
git push -u origin release/v0.1.0
```

Wait for **Release → Production** to go green. `main` fast-forwards to the release SHA and tag `v0.1.0` is pushed.

## Tracking

Source of truth: [`docs/tracking/BUILD_BACKLOG.md`](./docs/tracking/BUILD_BACKLOG.md)

## Architecture compass

Read [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`docs/00-constitution.md`](./docs/00-constitution.md) before changing structure.

**Gradual correction rule:** one ticket = one coherent Operation or docs/layout slice. Do not boil the ocean on a single branch.
