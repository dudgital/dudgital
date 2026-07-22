# Architecture v0 (frozen)

## Public spine

```text
CLI → Command → Operation → plan() → Mutation[] → execute() → verify()
```

There is no “Engine” in the product story. `@dudgital/engine` is an implementation package name only.

## Domain nouns (six only)

| Noun | Role |
|------|------|
| **Project** | Host app tree Dudgital mutates |
| **Module** | Catalog capability (`auth`, `notify`) |
| **Provider** | Catalog vendor (`clerk`, `resend`) |
| **Mutation** | One reversible-shaped change instruction |
| **State** | What Dudgital recorded under `.dudgital/` |
| **Operation** | `AddModule`, `Doctor`, `SyncSecrets`, … |

## Mutation kinds (start with seven)

`InstallPackage` · `WriteFile` · `UpdateFile` · `MergeEnv` · `RunCommand` · `DownloadSecret` · `DeleteFile`

Add a kind only when a second real Operation needs it (constitution rule 2).

## Catalogs vs architecture

Folders `modules/`, `providers/`, `frameworks/` are **catalogs / adapters**. They feed `plan()`. They are not the public architecture.

## Explicitly not in v0

- Compiler / Intent→IR pipeline
- Reporter subsystem
- CQRS / event bus / full DDD layout
- `dg undo` (Mutation shape allows later; do not build yet)

## `.dudgital/`

```text
.dudgital/
  state.json      # modules, providers, framework, timestamps
  history.json    # append-only operation history
  auth.json       # dashboard login (D0)
  link.json       # linked project (D0)
```

`doctor` prefers `state.json`; heuristics only if state is empty.

See also [00-constitution.md](./00-constitution.md), root [ARCHITECTURE.md](../ARCHITECTURE.md), and [10-layout-evolution.md](./10-layout-evolution.md) for gradual folder moves.