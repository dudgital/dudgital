# Dudgital Architectural Constitution

## Mission

Dudgital is a **Developer Automation Platform**.

It does **not** own the application lifecycle.

- Next.js remains Next.js.
- Laravel remains Laravel.
- npm remains npm.
- Composer remains Composer.

Dudgital automates the repetitive work developers do before they can build their product: authentication, payments, notifications, storage, analytics, secrets, environment wiring, and third-party integrations.

> Let developers spend their time building products instead of wiring infrastructure together.

## What Dudgital is

Three complementary products:

| Product | Responsibility |
|---------|----------------|
| **CLI** (`dude` / `dg`) | Automation — one command replaces many manual steps |
| **Dashboard** | Control plane — projects, secrets, provider connections, billing |
| **Packages / plugins** | Modules, framework integrations, and provider plugins that follow host conventions |

## What Dudgital is not

- Not a replacement for Next.js, Laravel, or any application framework
- Not an HTTP kernel, router, or renderer
- Not a lock-in to a single auth, payment, or mail vendor
- Not “another framework” developers must learn to ship product

## Philosophy

Modern developers do not need another framework. They need fewer setup steps.

Every new application repeats nearly identical infrastructure work. None of that creates business value. Dudgital exists to automate that repetition while remaining **provider-friendly** and **framework-native**.

## Provider philosophy

Dudgital integrates existing providers (Clerk, Better Auth, Stripe, Paystack, Resend, Termii, S3, PostHog, …). It does not replace them. Developers choose providers; Dudgital installs and configures them consistently.

## Engineering principles

Every feature must answer **yes** to most of these before acceptance:

1. Does it eliminate repetitive work?
2. Does it reduce setup time?
3. Does it follow the conventions of the target framework?
4. Does it automate configuration instead of replacing framework behavior?
5. Can it integrate multiple providers without locking developers into one?
6. Is it modular and independently installable?
7. Is it easy to explain in one sentence?
8. Would we use it ourselves on every new project?
9. Does it improve DX more than it increases complexity?
10. Does it keep Dudgital smaller than a framework and more valuable than a single package?

## Success criteria

Developers should say:

> “I still built a Next.js application.”  
> “I still built a Laravel application.”  
> “I didn’t spend my weekend configuring infrastructure.”  
> “One command replaced twenty manual steps.”

## Positioning phrase

Prefer **Developer Automation Platform** over the vague term “Developer Platform.”
