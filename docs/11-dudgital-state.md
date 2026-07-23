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

Dashboard session stubs used by CLI for `dg login` / `dg link`. Not the source of truth for installed modules — that is `state.json`.

## Secrets pull (`SyncSecrets`)

`dg secrets pull` is a real Operation (`planSyncSecrets` → `executeSyncSecrets`), not a CLI-only env write:

1. `plan()` → `DownloadSecret` + `MergeEnv` mutations
2. CLI supplies `fetchSecrets` (HTTP to dashboard using `link.json`)
3. Operation fills both mutations’ `env`, then `execute()` / `verify()`
4. Successful runs append `history.json` (`operation: "SyncSecrets"`)

Dry-run (`--dry-run`) stops after plan and does not fetch or write.

## Doctor behavior

1. If `state.json` has modules → load provider checks for those providers (**from state**).
2. Else → heuristic scan of package.json / composer.json for known provider packages.

## Related types

See `@dudgital/shared`: `DudgitalState`, `HistoryEntry` in [`shared/src/index.ts`](../shared/src/index.ts).
