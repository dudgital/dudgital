# Publishing @dudgital/dude

## Preconditions

1. `pnpm install && pnpm -r build && pnpm test && pnpm typecheck` green  
2. `pnpm pack:check` green (no `workspace:*` in published deps; tarball includes `dist/bin.js`)  
3. npm user logged in with publish rights to `@dudgital`  
4. Package version bumped in `cli/package.json`  

## How the CLI is packaged

`@dudgital/dude` is **bundled** with `tsup`. Workspace packages (`@dudgital/operations`, catalogs, `shared`) are compiled into `dist/` so end users only install `@dudgital/dude` — they never need the monorepo.

Those packages stay as `devDependencies` with `workspace:*` for local development; they are **not** published runtime dependencies.

## Commands

```bash
cd ecosystem/dudgital
pnpm pack:check
pnpm --filter @dudgital/dude publish --access public
```

Until the npm org exists, treat publish as owner-gated.

## Telemetry (opt-in)

Set `DUDGITAL_TELEMETRY=1` to log anonymous events to stderr:

`framework`, `module`, `provider`, `success|fail` — never secrets.
