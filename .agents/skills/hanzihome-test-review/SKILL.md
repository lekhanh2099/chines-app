---
name: hanzihome-test-review
description: Review HanziHome regression coverage and test quality against real content, query, edit, API and Supabase contracts. Use for requested coverage audits, regression-test work or CI-readiness reviews; skip isolated test maintenance and non-test changes.
---

# HanziHome Test Review

## Overview

Judge coverage by protected behavior and failure modes, not test-file count or a green build.

## Workflow

1. Read the affected HanziHome subtree contract, changed files, their call
   sites and current tests; root `AGENTS.md` owns the generic workflow.
2. Map the change onto [references/coverage-matrix.md](references/coverage-matrix.md).
3. Identify the highest-risk unproven contract: state transition, response validation, renderer shape, node isolation, authorization, or migration invariant.
4. Add the smallest deterministic test at the lowest boundary that still
   reproduces the real failure. Prefer schema/mapper tests only when they can
   fail for that regression; otherwise use hook/component, route/database, or a
   focused end-to-end flow.
5. Use representative real shapes and sparse/error variants. Do not assert fabricated fixtures that cannot occur in the app.
6. Run the targeted reproducer first. Use root verification tiers and escalate
   when the affected contract requires it; an application-file edit alone does
   not require `npm run check`.

## Required assertions by change type

- Query: first pending render, error vs empty, retry, cache-key variables, stale/refetch behavior.
- Mapper/renderer: exact source shape, sparse fields, unknown shape fallback, no hidden available data.
- Edit: one field/node changes, siblings remain untouched, dirty/reset/error/disabled states.
- Route/RPC: invalid payload, unauthenticated request, wrong owner, wrong parent, success, conflict/stale update.
- Migration/import: counts, duplicates, orphans, nullability, policies/grants, generated-type drift.

## Output

Follow the root handoff rule. Include the reproduced failure/protected
invariant, existing coverage or false-confidence tests that affect the result,
and any remaining manual or database proof. Rank review findings by evidenced
impact rather than test count.
