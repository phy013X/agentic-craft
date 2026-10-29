# Contributing

Thanks for your interest in improving agentic-craft.

## What this project is

A thin layer of **hard guardrails + durable memory + human/AI responsibility boundaries** for agentic coding. It deliberately stays small and works either standalone or alongside [Superpowers](https://github.com/obra/superpowers), which owns the development *workflow* (brainstorm → plan → TDD → review → verify).

When proposing a rule or mechanism, prefer the project's core principle:

> If it is mechanically checkable, make it an executable check (with a negative-control test) — don't rely on prose. Add process only for what cannot be automated.

## Changes

- **Template content** (`template/`): keep instructions short; one home per fact; no project-specific assumptions.
- **The initializer** (`scripts/init.mjs`) is dependency-free and must stay cross-platform (Node >=18).
- **Guardrails** must ship with tests that prove they fail on an invalid input (negative control).

## Local checks

```sh
npm test                                   # ratchet unit tests
node scripts/init.mjs /tmp/smoke --no-superpowers --no-git   # template-only smoke
```

The CI matrix runs both on Node 20/22/24.

## Commit/PR

- Keep PRs focused; describe the problem, the change, and how you verified it.
- New heavy mechanisms should be opt-in and justified by a recurring pain point (see `template/docs/scaling.md`).

By contributing you agree your contributions are licensed under the project's MIT License.
