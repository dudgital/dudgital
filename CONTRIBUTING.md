# Contributing — Branching, PRs & tracking

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
2. Open the PR **as a draft** into `staging` while you work.
3. Push often; mark **Ready for review** when CI should run.
4. Merge into `staging` only when checks are green and the ticket AC is met.
5. After merge: **do not** keep coding on that branch. Cut a **new** branch from current `staging` for follow-on work (e.g. `DUDG-010-docs`).
6. Production: cut SemVer `release/vX.Y.Z` from `origin/staging` → promote to `main`.

## Pull requests

- Branch name = ticket ID (`DUDG-010`). Description lives in the **PR title**, not the branch.
- PR title format: `DUDG-010: short description`
- Base branch: **`staging`** (default). Hotfixes into `main` are exceptional.
- Draft → Ready is the switch that should start PR CI (when workflows exist).

## Tracking

Source of truth: [`docs/tracking/BUILD_BACKLOG.md`](./docs/tracking/BUILD_BACKLOG.md)

Update Status / Branch when you start, merge, or split a ticket. Keep Lumivel `.lumis/progress/` in sync for agent handoffs when working from the umbrella workspace.

## Architecture compass

Read [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`docs/00-constitution.md`](./docs/00-constitution.md) before changing structure.

**Gradual correction rule:** one ticket = one coherent Operation or docs/layout slice. Do not boil the ocean on a single branch.
