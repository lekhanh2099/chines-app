---
name: hanzihome-test-review
description: Review and improve HanziHome tests against real data, state, renderer, API, edit, and Supabase contracts. Use for coverage audits, regression-test requests, query loading/error behavior, lesson renderer shapes, node-level mutations, ownership checks, migration verification, or CI readiness.
---

# HanziHome Test Review

## Overview

Judge coverage by protected behavior and failure modes, not test-file count or a green build.

## Workflow

1. Read root `AGENTS.md`, the changed files, their call sites, and current tests.
2. Map the change onto [references/coverage-matrix.md](references/coverage-matrix.md).
3. Identify the highest-risk unproven contract: state transition, response validation, renderer shape, node isolation, authorization, or migration invariant.
4. Add the smallest deterministic test at the lowest useful boundary. Prefer pure schema/mapper tests, then hook/component integration, then route/database integration, then a focused end-to-end smoke flow.
5. Use representative real shapes and sparse/error variants. Do not assert fabricated fixtures that cannot occur in the app.
6. Run targeted tests first, then the repository quality gate `npm run check` for source changes.

## Required assertions by change type

- Query: first pending render, error vs empty, retry, cache-key variables, stale/refetch behavior.
- Mapper/renderer: exact source shape, sparse fields, unknown shape fallback, no hidden available data.
- Edit: one field/node changes, siblings remain untouched, dirty/reset/error/disabled states.
- Route/RPC: invalid payload, unauthenticated request, wrong owner, wrong parent, success, conflict/stale update.
- Migration/import: counts, duplicates, orphans, nullability, policies/grants, generated-type drift.

## Output

List behaviors already covered, false-confidence tests, new tests added, commands/results, manual checks still required, and remaining risk by severity.
