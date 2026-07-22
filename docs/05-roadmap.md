# Roadmap

| Wave | Focus | Exit |
|------|--------|------|
| **W0** | Docs + governance | Constitution + agent contract point at Dudgital |
| **N0** | Skeleton + Next detect | `dg detect` reports nextjs on App Router sample |
| **N1** | `dg add auth` Clerk | Doctor 0, dry-run, idempotent |
| **N1b** | Better Auth provider | Second provider, same module |
| **N2** | Harden + publish `@dudgital/dude` | Fixtures green; package publishable |
| **D0** | Dashboard + `login`/`link`/`secrets pull` | Env pull from vault |
| **M2** | Notify + Resend | `dg add notify --provider resend` |
| **L0** | Laravel auth integration | `dg add auth` on Laravel; Next still green |

## Priority rules

1. Docs before code each wave  
2. All product work in `ecosystem/dudgital`  
3. Next before Laravel  
4. Auth before other modules  
5. One new provider OR module OR framework per wave  
6. Never own host lifecycle (routing, serve, render)
