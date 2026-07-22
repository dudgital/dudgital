# Dudgital

Developer Automation Platform — CLI `dude` / `dg`, engine, modules, framework integrations, providers.

## Quick start

```bash
pnpm install
pnpm -r build
DUDGITAL_SKIP_INSTALL=1 node cli/dist/bin.js add auth --provider clerk --yes --cwd fixtures/next-app-router
node cli/dist/bin.js doctor --cwd fixtures/next-app-router
```

## Docs

See [docs/README.md](./docs/README.md).

## Publish

```bash
# after tests/typecheck green and npm org access:
pnpm --filter @dudgital/dude publish --access public
```

Local dashboard: `pnpm --filter @dudgital/dashboard build && pnpm --filter @dudgital/dashboard start`
