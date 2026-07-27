# Dudgital — Build Backlog

**Repo:** [`dudgital/dudgital`](https://github.com/dudgital/dudgital) · **Prefix:** `DUDG-*`

**Branch rule:** branch name = ticket ID (e.g. `DUDG-010`), cut from local **`staging`**, PR back into `staging`. Production (`main`) ships only via SemVer `release/vX.Y.Z` cut from `origin/staging`. Full workflow: [CONTRIBUTING.md](../../CONTRIBUTING.md).

**After merge:** never continue work on a ticket branch once its PR is merged to `staging`. Cut a **new** branch from current `staging` for follow-on work. Keep this file updated when tickets move (In Progress / Review / Done / branch rename).

**Architecture north star:** [ARCHITECTURE.md](../../ARCHITECTURE.md) · [docs/09-architecture-v0.md](../09-architecture-v0.md)

> Gradual correction: folder layout and deeper architecture evolve **ticket by ticket**. Do not rewrite the monorepo in one PR.

### Progress snapshot (updated 2026-07-27)

| Bucket | Tickets | Notes |
|--------|---------|--------|
| **Done** | 9 | Sprint A0 complete |
| **In Progress** | 1 | `DUDG-010` N2 publishable CLI |
| **Backlog** | 2 | First SemVer release + MVP smoke |
| **Total tracked** | 12 | |

**Open PRs → `staging`:** `DUDG-010` (this branch)

---

## Foundation (pre-backlog, on main)

| ID | Summary | Status | Branch |
|----|---------|--------|--------|
| — | Initial platform + v0 architecture alignment | Done (on `main`/`staging`) | `main` |

---

## Sprint T0 — Tracking & git ladder

| ID | Summary | Pts | Status | Branch |
|----|---------|-----|--------|--------|
| DUDG-001 | Staging ladder, CONTRIBUTING, BUILD_BACKLOG, PR template | 3 | Done | `DUDG-001` (#1) |
| DUDG-002 | Document catalog vs Operation layout; layout evolution map | 3 | Done | `DUDG-002` (#2) |

---

## Sprint C0 — CI/CD from onset

| ID | Summary | Pts | Status | Branch |
|----|---------|-----|--------|--------|
| DUDG-007 | PR CI + SemVer release→main workflows (BeyondSQM-style, slim) | 5 | Done | `DUDG-007` (#3) |

---

## Sprint A0 — Gradual architecture & layout

| ID | Summary | Pts | Status | Branch |
|----|---------|-----|--------|--------|
| DUDG-003 | Demote “engine” in public CLI/docs copy only (package name can stay) | 2 | Done | `DUDG-003` (#4) |
| DUDG-004 | Coalesce `.dudgital/` schema docs (`state`, `history`, `auth`, `link`) | 2 | Done | `DUDG-004` (#5/#6) |
| DUDG-005 | Extract shared Operation runner helpers only if Doctor + AddModule duplicate ≥2× | 5 | Done | `DUDG-005` (#10) |
| DUDG-006 | Align monorepo folders toward `operations/` package surface (thin move, keep catalogs) | 8 | Done | `DUDG-006` (#11) |
| DUDG-008 | Fixture matrix + Pages Router rejection regression in CI | 3 | Done | `DUDG-008` (#9) |
| DUDG-009 | Dashboard secrets Operation uses DownloadSecret mutation | 5 | Done | `DUDG-009` (#8) |

---

## Sprint N2 — Harden & publish

| ID | Summary | Pts | Status | Branch |
|----|---------|-----|--------|--------|
| DUDG-010 | Bundle `@dudgital/dude` for npm publish (no `workspace:*` runtime deps) | 5 | In Progress | `DUDG-010` |
| DUDG-011 | Cut first SemVer release `v0.1.0` (`staging` → `main`) | 3 | Backlog | — |
| DUDG-012 | Fresh `create-next-app` smoke + close remaining MVP checklist gates | 5 | Backlog | — |

### Suggested order

A0 complete → **`DUDG-010`** → **`DUDG-011`** (release) → `DUDG-012`.

---

## How to start a ticket

```bash
git switch staging && git pull
git switch -c DUDG-00N
# update this backlog: Status = In Progress, Branch = DUDG-00N
```

PR title: `DUDG-00N: short description` · base: `staging`
