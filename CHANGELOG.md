# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/), and the project follows
[Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-10-29

### Added

- Cross-platform, dependency-free initializer `scripts/init.mjs` (Node ≥18):
  installs the original template and optionally fetches Superpowers at a pinned
  tag, retaining its MIT license; refuses non-empty targets; removes overlapping
  skills when stacking.
- Original template (`template/`):
  - Single-source `AGENTS.md` with standing orders, anti-rationalization red
    flags, AI git-permission boundary, and a session-handoff protocol.
  - Durable memory: living `docs/spec.md`, ADRs, postmortems, AI-usage disclosure.
  - Judgment skills: code review, ADR writing, error handling, simplification,
    performance, test reliability, definition-of-done, idea clarification.
  - Tech-debt **ratchet** gate with negative-control tests, in both
    [Node](template/optional/node) and [Python](template/optional/python).
  - Guidance docs: scaling triggers, parallel development, recorded replay for
    LLM apps, and the exact division of labor with Superpowers.
- CI matrix (Node 20/22/24, Python 3.10/3.12) running the gate tests and an
  offline installer smoke test.
- English and Chinese READMEs; MIT license and third-party attribution.

[0.1.0]: https://github.com/phy013X/agentic-craft/releases/tag/v0.1.0
