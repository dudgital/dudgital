# `.dudgital/` project state

Dudgital records what it changed under **`.dudgital/`** in the host project (constitution rule 6). Prefer these files over guessing when running `dg doctor`.

## Files

| File | Written by | Purpose |
|------|------------|---------|
| `state.json` | `AddModule` after successful verify | Current modules + providers + framework |
| `history.json` | `AddModule` execute | Append-only operation log |
| `auth.json` | `dg login` | Local dashboard auth stub (D0) |
| `link.json` | `dg link` | Linked dashboard project id + token |

Do not commit secrets. Add `.dudgital/` to `.gitignore` in host apps when appropriate (CLI fixtures already ignore it in the Dudgital repo).

## `state.json`

```json
{
  "version": 1,
  "framework": "nextjs",
  "modules": {
    "auth": {
      "provider": "clerk",
      "updatedAt": "2026-07-23T12:00:00.000Z"
    }
  },
  "updatedAt": "2026-07-23T12:00:00.000Z"
}
```

- **version** — schema version (currently `1`)
- **framework** — last detected framework for recorded installs
- **modules** — map of module id → `{ provider, updatedAt }`

## `history.json`

Array of entries:

```json
[
  {
    "timestamp": "2026-07-23T12:00:00.000Z",
    "operation": "AddModule",
    "moduleId": "auth",
    "providerId": "clerk",
    "framework": "nextjs",
    "dryRun": false,
    "mutationIds": ["install-npm", "merge-env", "file-0-middleware.ts"],
    "verifyOk": true
  }
]
```

Dry-runs that only call `plan()` do **not** append history (CLI dry-run stops after plan).

## `auth.json` / `link.json`

Dashboard session stubs for `dg secrets pull`. Not the source of truth for installed modules — that is `state.json`.

## Doctor behavior

1. If `state.json` has modules → load provider checks for those providers (**from state**).
2. Else → heuristic scan of package.json / composer.json for known provider packages.

## Related types

See `@dudgital/shared`: `DudgitalState`, `HistoryEntry` in [`shared/src/index.ts`](../shared/src/index.ts).
