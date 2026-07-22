# Dudgital Architectural Constitution

> **Dudgital is a project automation engine that plans and applies safe, repeatable changes to existing software projects.**

## Seven rules

1. **Dudgital automates projects; it does not become the project.**
2. **Every abstraction must remove duplication from at least two real Operations.** If it exists only because we anticipate needing it, we do not build it.
3. **Dudgital follows framework conventions rather than replacing them.** Use Laravel providers, Next middleware, Composer, and npm — never invent a “Dudgital way” when the ecosystem has a standard.
4. **Operations produce Plans. Plans produce Mutations. Mutations transform Projects.**
5. **Every change must be verifiable.**
6. **Record what Dudgital changes** (under `.dudgital/`).
7. **Optimize for developer time, not architectural cleverness.**

## Feature gate

Before any feature ships, answer:

1. What **Operation** is this?
2. What **Mutations** does it produce?
3. Can those Mutations be **verified**?
4. Should Dudgital **remember** this in `.dudgital/`?

If you cannot answer, the feature probably does not belong.

## What Dudgital is not

- Not a replacement for Next.js, Laravel, or any application framework
- Not an HTTP kernel, router, or renderer
- Not a lock-in to a single auth, payment, or mail vendor
- Not another framework developers must learn to ship product
- Not a home for Compiler / IR / CQRS / DDD cosplay in v0

## Products (secondary)

| Product | Responsibility |
|---------|----------------|
| **CLI** (`dude` / `dg`) | Commands that run Operations |
| **Dashboard** | Control plane — projects, secrets, connections (later) |
| **Catalogs** | Module / Provider / Framework metadata Operations consume |

## Success

> “I still built a Next.js / Laravel application.”  
> “I didn’t spend my weekend configuring infrastructure.”  
> “One command replaced twenty manual steps.”
