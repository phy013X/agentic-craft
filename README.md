# agentic-craft

> Hard guardrails and durable memory for agentic / vibe coding — works standalone or on top of [Superpowers](https://github.com/obra/superpowers).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

AI coding agents are fast, but they share three traits that turn a fast-moving
codebase into a mess: they **forget** when the context clears, they
**rationalize** skipping process ("just this once"), and they don't **own the
consequences** of what ships.

Superpowers gives agents an excellent development *workflow* (brainstorm → plan
→ TDD → review → verify). It is, deliberately, **purely soft guidance** driven by
prompts, and it lives inside a single session. **agentic-craft adds the layers it
doesn't have:**

| Layer | What it provides |
|---|---|
| **Hard guardrails** | A tested, zero-dependency **tech-debt ratchet** (existing debt allowed, *new* debt fails), plus git-hook/CI integration points — checks an agent cannot rationalize its way past. |
| **Durable memory** | A living project `spec`, ADRs (with rejected alternatives), and postmortems — state a fresh agent rebuilds from disk instead of inheriting chat history. |
| **Responsibility boundaries** | An explicit AI git-permission boundary and an **AI-usage disclosure** in the PR template (how much was `hint`…`auto`, and who made the key calls). |
| **Judgment skills** | Compact, model-agnostic skills for code review, error handling, simplification, performance, and test reliability. |

The philosophy in one line: **soft guidance persuades, hard guardrails enforce,
durable memory remembers.** Agents stay fast; humans review only the semantics
machines can't reach and approve the irreversible decisions.

## Quick start

```sh
git clone https://github.com/phy013X/agentic-craft.git
cd agentic-craft

# Initialize a new project (template + Superpowers pinned at v7.0.1)
node scripts/init.mjs ../my-app

# Or: template only, no Superpowers, no network
node scripts/init.mjs ../my-app --no-superpowers

# Or: use a local Superpowers checkout (offline / CI)
node scripts/init.mjs ../my-app --source ./superpowers
```

Options:

| Flag | Meaning |
|---|---|
| `--no-superpowers` | Install only the original template (8 skills, no SessionStart hook). |
| `--ref <tag>` | Superpowers version to pin (default `v7.0.1`). |
| `--source <path>` | Copy Superpowers from a local path instead of cloning. |
| `--no-git` | Don't run `git init` in the target. |
| `--name <name>` | Project name written into the generated README. |

The initializer refuses a **non-empty target**, keeps Superpowers' MIT license in
the generated project, and removes the two overlapping template skills when
stacking (`clarify-idea`, `definition-of-done`) so nothing conflicts.

## What a generated project contains

```
AGENTS.md                 # Standing orders for humans + every AI tool (CLAUDE.md just @-imports it)
CLAUDE.md                 # @AGENTS.md
.claude/
  skills/                 # 15 Superpowers + 6 judgment skills (or 8 template-only skills)
  hooks/ + settings.json  # SessionStart auto-injection (Superpowers mode)
  SUPERPOWERS_LICENSE     # Third-party MIT attribution, retained on install
docs/
  spec.md                 # Project-level living requirements (present tense)
  adr/                    # Irreversible decisions + rejected alternatives
  postmortem/             # Blameless incident reviews that must add a guardrail
  ai-usage.md             # hint/assist/pair/copilot/auto disclosure standard
  scaling.md              # When (not) to adopt heavier machinery
  parallel-development.md # worktrees / stacked PRs / multi-agent fan-out
  with-superpowers.md     # Exact division of labor with Superpowers
optional/node/            # Ratchet gate (Node) + lefthook config (opt-in)
optional/python/          # Ratchet gate (Python, stdlib only)
.github/PULL_REQUEST_TEMPLATE.md
```

### How the two systems divide work

- **Superpowers owns the workflow**: when to brainstorm, plan, TDD, debug,
  review, and verify. Feature specs go in `docs/superpowers/specs/`, plans in
  `docs/superpowers/plans/`.
- **agentic-craft owns the rest**: project-level requirements, durable decisions,
  hard gates, AI permissions, and technical checklists. On a workflow conflict,
  Superpowers wins; the template never re-defines the workflow.

## The ratchet gate (the one runnable tool)

Most "coding standards" are prose an agent can ignore. The ratchet is executable:

- Snapshots current debt (`any`, `@ts-ignore`, `eslint-disable`, `TODO`, oversize
  files) into a committed baseline.
- **New occurrences fail the check; the baseline only ever shrinks.** You can set
  the bar at "never worse than today" on day one, without a rewrite.
- Shipped with a negative-control test suite and an empty-scan guard, so the gate
  itself can't silently pass everything.

```sh
# Node (zero-dependency)
node optional/node/scripts/ratchet.mjs --update   # snapshot current debt
node optional/node/scripts/ratchet.mjs           # CI/pre-push: new debt -> exit 1
node optional/node/scripts/ratchet.mjs --prune   # remove stale baseline entries

# Python (stdlib only, >=3.8)
python optional/python/ratchet.py --update
python optional/python/ratchet.py
```

Both implementations share the same baseline format and ship with negative-control tests.

## Repository layout

```
template/        # everything copied into a generated project (original content only)
  .agents/skills/   # 8 original, model-agnostic skills
  docs/ optional/ .github/ AGENTS.md CLAUDE.md PROJECT_README.md
scripts/init.mjs # the cross-platform, dependency-free initializer
.github/workflows/ci.yml
```

## Scope and non-goals

This is intentionally a **thin, opt-in layer**, not a 300-package platform. It
does not (yet) ship heavy machinery — per-file coverage gates, AST dependency
analysis, merge queues, weighted code-owner review. `template/docs/scaling.md`
describes the *recurring-pain signals* that justify adopting each one later.

## Credits

Methodology learned from studying [deepseek-harness](https://github.com/deepseek-harness/deepseek-harness);
designed to complement [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent.
See [NOTICE.md](NOTICE.md) for attribution. No third-party source is vendored;
Superpowers is fetched on demand under its MIT license.

## License

[MIT](LICENSE), except third-party components installed into your project, which
remain under their own licenses.
