<!-- PR title MUST reference the ticket, e.g. "DUDG-010: short description" -->

## Ticket

DUDG-___  ·  Base branch: `staging`

## Summary

<!-- What changed and why. -->

## Acceptance Criteria

<!-- Checklist from the ticket / BUILD_BACKLOG. -->

## Architecture gate

- [ ] Answers: What Operation? What Mutations? Verifiable? Remembered in `.dudgital/`?
- [ ] No anticipatory abstraction (constitution rule 2)
- [ ] Follows host framework conventions (rule 3)

## Tests

- [ ] `pnpm -r build`
- [ ] `pnpm test`
- [ ] `pnpm -r typecheck`

## Checklist

- [ ] Branch name = ticket ID, cut from local `staging`
- [ ] PR was a **draft** while WIP; marked **Ready for review** when ready
- [ ] `docs/tracking/BUILD_BACKLOG.md` Status/Branch updated
- [ ] Canonical docs updated if behavior changed
