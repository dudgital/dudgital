# Dudgital architecture

> **Dudgital is a project automation engine that plans and applies safe, repeatable changes to existing software projects.**

## Spine (v0)

```text
CLI → Command → Operation → plan() → Mutation[] → execute() → verify()
```

## Rules (read these first)

1. Automate projects; do not become the project.
2. Every abstraction must remove duplication from **at least two real Operations**. Anticipatory abstractions are rejected.
3. Follow host framework conventions (Laravel, Next, Composer, npm) — never invent a Dudgital lifecycle.
4. Operations → Plans → Mutations → Projects.
5. Every change must be verifiable.
6. Record changes under `.dudgital/`.
7. Optimize for developer time, not cleverness.

Full text: [docs/00-constitution.md](./docs/00-constitution.md) · [docs/09-architecture-v0.md](./docs/09-architecture-v0.md)
