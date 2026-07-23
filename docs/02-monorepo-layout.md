# Monorepo layout

Root: `ecosystem/dudgital/` (GitHub: `dudgital/dudgital`)

Public product story is the **CLI + Operations spine**, not an “engine” product. The `engine/` folder is an **implementation package** that hosts Operations (`plan` / `execute` / `verify`).

```
ecosystem/dudgital/
├── apps/
│   ├── dashboard/          # control plane (later polish)
│   └── docs/               # product docs site (later)
├── docs/                   # constitution + tracking (source of truth)
├── cli/                    # @dudgital/dude → bins: dude, dg  (public)
├── engine/                 # @dudgital/engine — Operations implementation (internal-ish)
├── frameworks/             # framework catalogs
│   ├── nextjs/
│   └── laravel/
├── modules/                # module catalogs
│   ├── auth/
│   └── notify/
├── providers/              # provider catalogs
│   ├── clerk/
│   ├── better-auth/
│   └── resend/
├── shared/                 # @dudgital/shared — Plan, Mutation, State types
├── fixtures/
└── package.json
```

See [10-layout-evolution.md](./10-layout-evolution.md) for gradual folder moves (`operations/` rename later via DUDG-006).

## Publish boundaries

| Package | Public? |
|---------|---------|
| `@dudgital/dude` | **Yes** — primary CLI users install |
| `@dudgital/engine` | Prefer bundled / private; not marketed as a product |
| `@dudgital/framework-*` | As needed |
| `@dudgital/module-*` | As needed |
| `@dudgital/provider-*` | As needed |
| `@dudgital/shared` | Internal unless peers require it |

All packages use the `@dudgital` npm scope.
