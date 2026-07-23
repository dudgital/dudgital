# Dudgital

> **Dudgital is a project automation engine that plans and applies safe, repeatable changes to existing software projects.**

CLI: `dude` / `dg` · Spine: `Command → Operation → plan() → Mutation[] → execute() → verify()`

Users install **`@dudgital/dude`**. The `engine/` package is an implementation detail (Operations), not a separate product.

See [ARCHITECTURE.md](./ARCHITECTURE.md) and [docs/](./docs/).

## Quick start

```bash
pnpm install
pnpm -r build
DUDGITAL_SKIP_INSTALL=1 node cli/dist/bin.js add auth --provider clerk --dry-run --cwd fixtures/next-app-router
DUDGITAL_SKIP_INSTALL=1 node cli/dist/bin.js add auth --provider clerk --yes --cwd fixtures/next-app-router
node cli/dist/bin.js doctor --cwd fixtures/next-app-router
```

## Publish

See [docs/08-publish.md](./docs/08-publish.md). Local dashboard: `pnpm --filter @dudgital/dashboard build && pnpm --filter @dudgital/dashboard start`
