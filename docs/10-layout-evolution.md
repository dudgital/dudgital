# Layout evolution (gradual)

This is the **target map**. Moves land only via `DUDG-*` tickets when they remove real confusion or duplication.

## Current layout (after DUDG-006)

```text
cli/                    # Command surface (dude/dg)
operations/             # @dudgital/operations — Operations implementation
shared/                 # Domain types: Plan, Mutation, State, …
catalogs/
  modules/              # Module catalog
  providers/            # Provider catalog
  frameworks/           # Framework catalog (detect + conventions)
apps/dashboard/         # Control plane
docs/                   # Constitution + tracking
fixtures/               # Host-app fixtures
tests/                  # Integration tests
scripts/                # CI helpers (fixture matrix, …)
```

Public spine (unchanged by folder names):

```text
CLI → Command → Operation → plan() → Mutation[] → execute() → verify()
```

## Ticket map

| Move | Ticket | Status |
|------|--------|--------|
| Document this map | **DUDG-002** | Done |
| Docs-only “engine” demotion in UX copy | **DUDG-003** | Done |
| `.dudgital/` schema doc | **DUDG-004** | Done |
| Shared Operation runner (`executePlan`) | **DUDG-005** | Done |
| Physical `operations/` + `catalogs/` folders | **DUDG-006** | Done |
| PR CI + SemVer release→main | **DUDG-007** | Done |
| Fixture CI matrix | **DUDG-008** | Done |
| DownloadSecret via dashboard Operation | **DUDG-009** | Done |

## Rules

1. Catalog folders stay catalogs — they are not the architecture.
2. Do not introduce `ports/`, `workflows/`, Compiler, or IR folders in v0.
3. Prefer renaming **stories in docs** before moving packages (constitution rule 7).
