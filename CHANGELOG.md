# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/), and the project follows
[Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-10-29

First public release.

### Added

- Cross-platform, dependency-free initializer `scripts/init.mjs` (Node ≥18):
  installs the original template and optionally fetches Superpowers at a pinned
  tag (`v7.0.1`), retaining its MIT license in the generated project; refuses
  non-empty targets; removes overlapping skills when stacking.
- Original template (`template/`):
  - Single-source `AGENTS.md` with standing orders, anti-rationalization red
    flags, an AI git-permission boundary, and a session-handoff protocol.
  - Durable memory: living `docs/spec.md`, ADRs, postmortems, AI-usage disclosure.
  - Judgment skills: code review, ADR writing, error handling, simplification,
    performance, test reliability, definition-of-done, idea clarification.
  - Tech-debt **ratchet** gate with negative-control tests, in both
    [Node](template/optional/node) and [Python](template/optional/python);
    the Python build hardens Windows console output (forced UTF-8).
  - Guidance docs: scaling triggers, parallel development, recorded replay for
    LLM apps, and the exact division of labor with Superpowers.
- CI matrix (Node 20/22/24, Python 3.10/3.12) running the gate tests and an
  offline installer smoke test.
- English and Chinese READMEs; MIT license, third-party attribution
  (`NOTICE.md`); issue templates and contribution guide.
