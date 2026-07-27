# Monorepo layout

Root: `ecosystem/dudgital/` (GitHub: `dudgital/dudgital`)

Public product story is the **CLI + Operations spine**. Catalogs feed `plan()`; they are not the architecture.

```
ecosystem/dudgital/
├── apps/
│   └── dashboard/          # control plane
├── docs/                   # constitution + tracking (source of truth)
├── cli/                    # @dudgital/dude → bins: dude, dg  (public)
├── operations/             # @dudgital/operations — plan / execute / verify
├── catalogs/
│   ├── frameworks/         # nextjs, laravel (detect + conventions)
│   ├── modules/            # auth, notify
│   └── providers/          # clerk, better-auth, resend
├── shared/                 # @dudgital/shared — Plan, Mutation, State types
├── fixtures/
├── scripts/
└── package.json
```

Layout history: [10-layout-evolution.md](./10-layout-evolution.md) (`DUDG-006` applied this map).

## Publish boundaries

| Package | Public? |
|---------|---------|
| `@dudgital/dude` | **Yes** — primary CLI users install |
| `@dudgital/operations` | Prefer bundled / private; not marketed as a product |
| `@dudgital/framework-*` | As needed |
| `@dudgital/module-*` | As needed |
| `@dudgital/provider-*` | As needed |
| `@dudgital/shared` | Internal unless peers require it |

All packages use the `@dudgital` npm scope.
