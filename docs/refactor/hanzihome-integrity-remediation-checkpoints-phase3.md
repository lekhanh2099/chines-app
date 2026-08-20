# HanziHome Integrity Remediation — Phase 3 Execution Checkpoints

Branch: `refactor/hanzihome-integrity-remediation`

## Checkpoint P3-01 — derived Learning Overview

Status: `DONE`
Date: 2026-08-20

- Home now reads a typed server-derived overview from mastery, due SRS,
  Learning Loop, immutable attempts, and static Reader completion.
- No new progress table or progress store was introduced.
- Targeted route/home tests, lint/source/route/UI/API checks, and typecheck
  passed before commit `fe258968`.

## Checkpoint P3-02 — content capability gates

Status: `DONE`
Date: 2026-08-20

- Data Quality, HTML Artifacts, and API Docs are gated in navigation, pages,
  and route handlers by `hanzihome_content_roles` editor/admin capability.
- Existing owner filters and editor/admin content permissions remain intact.
- Targeted route/navigation tests and lint/source/route/UI/API checks passed;
  commit `cddbff04`.

## Checkpoint P3-03 — Reader i18n, brand, and IA

Status: `DONE`
Date: 2026-08-20

- Reader study chrome, PDF tools, pronunciation selection, and contextual
  pinyin labels now use `vi`, `en`, and `zh-CN` message contracts. Static
  Reader learning corpus remains outside message catalogs.
- Shell metadata is HanziHome-branded.
- Duplicate learner navigation entries for `/reader/course`,
  `/reader/practice`, and `/reader/mock` are hidden while compatibility routes
  and deep links remain valid.
- Full Vitest passed: 173 files / 766 tests. Lint, source, route, UI, API,
  typecheck, and `git diff --check` passed. Commit: `ad7c9de2`.

Remaining external evidence is the P4 local/CI E2E gate and deployed smoke.
