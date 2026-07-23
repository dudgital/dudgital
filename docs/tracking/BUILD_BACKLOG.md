# Dudgital — Build Backlog

**Repo:** [`dudgital/dudgital`](https://github.com/dudgital/dudgital) · **Prefix:** `DUDG-*`

**Branch rule:** branch name = ticket ID (e.g. `DUDG-010`), cut from local **`staging`**, PR back into `staging`. Production (`main`) ships only via SemVer `release/vX.Y.Z` cut from `origin/staging`. Full workflow: [CONTRIBUTING.md](../../CONTRIBUTING.md).

**After merge:** never continue work on a ticket branch once its PR is merged to `staging`. Cut a **new** branch from current `staging` for follow-on work. Keep this file updated when tickets move (In Progress / Review / Done / branch rename).

**Architecture north star:** [ARCHITECTURE.md](../../ARCHITECTURE.md) · [docs/09-architecture-v0.md](../09-architecture-v0.md)

> Gradual correction: folder layout and deeper architecture evolve **ticket by ticket**. Do not rewrite the monorepo in one PR.

### Progress snapshot (updated 2026-07-22)

| Bucket | Tickets | Notes |
|--------|---------|--------|
| **Done** | 1 | `DUDG-001` merged to `staging` |
| **In Progress** | 1 | `DUDG-002` |
| **Backlog** | 7 | Gradual architecture / folder / DX tickets |
| **Total tracked** | 9 | |

**Open PRs → `staging`:** _(update when opened)_

---

## Foundation (pre-backlog, on main)

Landed before staging ladder: greenfield CLI, v0 `plan → Mutation[] → execute → verify`, constitution.

| ID | Summary | Status | Branch |
|----|---------|--------|--------|
| — | Initial platform + v0 architecture alignment | Done (on `main`/`staging`) | `main` |

---

## Sprint T0 — Tracking & git ladder

| ID | Summary | Pts | Status | Branch |
|----|---------|-----|--------|--------|
| DUDG-001 | Staging ladder, CONTRIBUTING, BUILD_BACKLOG, PR template | 3 | Done | `DUDG-001` (#1) |

---

## Sprint A0 — Gradual architecture & layout (do next)

One ticket at a time. Prefer docs + thin code moves over big-bang renames.

| ID | Summary | Pts | Status | Branch |
|----|---------|-----|--------|--------|
| DUDG-002 | Document catalog vs Operation layout; add `docs/10-layout-evolution.md` target map | 3 | In Progress | `DUDG-002` |
| DUDG-003 | Rename public story away from “engine” in CLI help/docs only (package name can stay) | 2 | Backlog | — |
| DUDG-004 | Coalesce `.dudgital/` schema docs (`state`, `history`, `auth`, `link`) | 2 | Backlog | — |
| DUDG-005 | Extract shared Operation runner helpers only if Doctor + AddModule duplicate ≥2× | 5 | Backlog | — |
| DUDG-006 | Align monorepo folders toward `operations/` package surface (thin move, keep catalogs) | 8 | Backlog | — |
| DUDG-007 | Add minimal PR CI (typecheck + test) on Ready-for-review → staging | 5 | Backlog | — |
| DUDG-008 | Fixture matrix + Pages Router rejection regression in CI | 3 | Backlog | — |
| DUDG-009 | Dashboard secrets Operation uses DownloadSecret mutation (no new kinds unless needed) | 5 | Backlog | — |

### Suggested order

`DUDG-001` → `DUDG-002` → `DUDG-004` → `DUDG-007` → `DUDG-003` → `DUDG-008` → `DUDG-005`/`DUDG-006` (only when duplication earns it) → `DUDG-009`.

---

## How to start a ticket

```bash
git switch staging && git pull
git switch -c DUDG-00N
# update this backlog: Status = In Progress, Branch = DUDG-00N
```

PR title: `DUDG-00N: short description` · base: `staging`
