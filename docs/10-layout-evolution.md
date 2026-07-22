# Layout evolution (gradual)

This is the **target map**, not a big-bang rename. Move folders only via `DUDG-*` tickets when a move removes real confusion or duplication.

## Current layout (v0 — keep working)

```text
cli/              Command surface (dude/dg)
engine/           Implementation of Operations (name is internal)
shared/           Domain types: Plan, Mutation, State, …
modules/          Module catalog
providers/        Provider catalog
frameworks/       Framework catalog (detect + conventions)
apps/dashboard/   Control plane
docs/             Constitution + tracking
fixtures/         Host-app fixtures
tests/            Integration tests
```

Public spine (unchanged by folder names):

```text
CLI → Command → Operation → plan() → Mutation[] → execute() → verify()
```

## Target layout (earn each move)

```text
cli/                    # stays
packages/ or top-level:
  shared/               # types
  operations/           # AddModule, Doctor, SyncSecrets (today: engine/src/operations)
  catalogs/
    modules/
    providers/
    frameworks/
apps/dashboard/
docs/
fixtures/
tests/
```

| Move | Ticket | When earned |
|------|--------|-------------|
| Document this map | **DUDG-002** | Now |
| Docs-only “engine” demotion in UX copy | DUDG-003 | After 002 |
| `.dudgital/` schema doc | DUDG-004 | Independent |
| Shared Operation runner | DUDG-005 | When Doctor + AddModule share ≥2 duplicated helpers |
| Physical `operations/` + `catalogs/` folders | DUDG-006 | After 005 or clear contributor confusion |
| PR CI | DUDG-007 | Anytime |
| Fixture CI matrix | DUDG-008 | After 007 |
| DownloadSecret via dashboard Operation | DUDG-009 | Product need |

## Rules

1. Catalog folders stay catalogs — they are not the architecture.
2. Do not introduce `ports/`, `workflows/`, Compiler, or IR folders in v0.
3. Prefer renaming **stories in docs** before moving packages (constitution rule 7).
