# MVP: Next.js App Router × Auth × Clerk

## Success

A developer with an existing Next App Router app runs:

```bash
npx @dudgital/dude@latest add auth --provider clerk --yes
# or: dg add auth --provider clerk --yes
```

and ends with a working Clerk wiring path plus `dg doctor` exit 0 — without becoming a different framework.

## Task list (Clerk × Next)

1. `npmInstall` — `@clerk/nextjs` (and required peers)  
2. `envMerge` — `.env.local` placeholders (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, …)  
3. `ensureFile` — `middleware.ts` with Clerk middleware  
4. `writeFile` — minimal example (e.g. sign-in route or layout hint)  
5. `doctorCheck` — packages, env key names, middleware present  
6. Print next steps (Dashboard Clerk keys, restart dev server)

## Acceptance gates

- [ ] Works on fresh `create-next-app` (App Router)  
- [ ] `--dry-run` prints tasks without writes  
- [ ] Idempotent re-run does not corrupt the project  
- [ ] Pages Router projects rejected with a clear message  
- [ ] `dg doctor` exit 0 after successful add  

## Out of scope for MVP

Dashboard, secrets sync, Laravel, Better Auth (Wave N1b), payments, notify.
