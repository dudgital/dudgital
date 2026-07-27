# Publishing @dudgital/dude

## Preconditions

1. `pnpm install && pnpm -r build && pnpm test && pnpm typecheck` green  
2. npm user logged in with publish rights to `@dudgital`  
3. Package version bumped in `cli/package.json`  

## Commands

```bash
cd ecosystem/dudgital
pnpm --filter @dudgital/shared build
pnpm --filter @dudgital/operations build
# build remaining workspace deps then:
pnpm --filter @dudgital/dude publish --access public
```

Workspace dependencies must be published first (or bundled) before a public CLI publish. Until the npm org exists, treat publish as owner-gated — document E404/E403 in lumivel `.lumis/progress/decisions.md`.

## Telemetry (opt-in)

Set `DUDGITAL_TELEMETRY=1` to log anonymous events to stderr:

`framework`, `module`, `provider`, `success|fail` — never secrets.
