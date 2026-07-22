# Architecture

## Layers

```
dg add auth
    → CLI (@dudgital/dude)
    → Automation Engine
    → Module (what) + Framework Integration (how) + Provider Plugin (which)
    → Task Pipeline
    → Host project
```

| Layer | Responsibility | Must not contain |
|-------|----------------|------------------|
| CLI | UX, prompts, flags | Laravel/Next knowledge |
| Engine | Detect → resolve → compose → run tasks | Provider business APIs |
| Modules | Capability metadata, prompts, docs, install rules | Framework source files |
| Framework integrations | Task runners that mutate a host tree | Payment/auth vendor logic |
| Provider plugins | Packages, env keys, templates, hooks | CLI orchestration |

Prefer the term **framework integrations** over “adapters” (these are installers/configurators, not runtime abstractions).

## Task pipeline

Installers are declarative lists of task kinds, for example:

- `npmInstall` / `composerRequire`
- `envMerge`
- `writeFile` / `ensureFile`
- `patchMiddleware`
- `doctorCheck`

The engine composes tasks from module rules + provider metadata + framework capabilities. Adding Stripe is a new provider plugin. Adding Django is a new framework integration. Modules stay stable.

## Detection

Framework integrations own detection (e.g. Next App Router vs Pages Router). The CLI only asks the engine to detect and report.
