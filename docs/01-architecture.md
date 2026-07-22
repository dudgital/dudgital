# Architecture

See **[09-architecture-v0.md](./09-architecture-v0.md)** for the frozen v0 spine.

## Summary

```text
CLI → Command → Operation → plan() → Mutation[] → execute() → verify()
```

Framework integrations and provider plugins are **catalogs** the Operation’s `plan()` consumes. They do not own the CLI or invent host lifecycle.

Detection lives on framework catalogs (e.g. Next App Router vs Pages). The Command asks the Operation to detect as part of planning.
