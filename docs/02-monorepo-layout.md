# Monorepo layout

Root: `ecosystem/dudgital/`

```
ecosystem/dudgital/
├── apps/
│   ├── dashboard/          # Wave D0+
│   └── docs/               # product docs site (later)
├── docs/                   # constitution + roadmap (source of truth)
├── cli/                    # @dudgital/dude → bins: dude, dg
├── engine/                 # @dudgital/engine
├── frameworks/
│   ├── nextjs/             # @dudgital/framework-nextjs
│   └── laravel/            # @dudgital/framework-laravel
├── modules/
│   ├── auth/               # @dudgital/module-auth
│   ├── notify/             # @dudgital/module-notify
│   └── payments/           # later
├── providers/
│   ├── clerk/              # @dudgital/provider-clerk
│   ├── better-auth/        # @dudgital/provider-better-auth
│   └── resend/             # @dudgital/provider-resend
├── shared/                 # @dudgital/shared
├── fixtures/               # regression fixtures
└── package.json            # pnpm workspace root
```

## Publish boundaries

| Package | Public? |
|---------|---------|
| `@dudgital/dude` | Yes — primary CLI |
| `@dudgital/engine` | Yes (or bundled; may stay private initially) |
| `@dudgital/framework-*` | Yes as needed |
| `@dudgital/module-*` | Yes as needed |
| `@dudgital/provider-*` | Yes as needed |
| `@dudgital/shared` | Internal / yes if required by peers |

All public packages use the `@dudgital` npm scope. No `@lumiarq` packages ship as Dudgital product.
