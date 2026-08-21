# HanziHome Phase 1 — Learning-state merge contract

> **Historical migration note (2026-08-21):** The individual migration ID
> recorded below is historical evidence. The live state is represented by
> `supabase/migrations/20260820163000_hanzihome_remote_schema_baseline.sql`.

Branch: `refactor/hanzihome-integrity-remediation`  
Master plan: `docs/refactor/hanzihome-integrity-remediation-plan.md`  
Date: 2026-08-20

This document is the focused implementation checkpoint for the Phase 0 -> Phase 1 handoff and P1-01. It does not replace the master remediation plan or the append-only execution ledger.

## Phase 0 handoff evidence

Evidence supplied from the user's local/deployed verification:

- full repository gate `npm run check` passed after the Phase 0 type/lint fixes;
- real A -> logout -> B verification used two distinct accounts and passed: a clean B account did not inherit A's "Bài vừa học" state;
- deployed microphone/header verification is intentionally deferred until this branch is merged/deployed to `main`; P0-02 must not be called fully verified before that smoke test.

Live Supabase read-only postflight on project `pdrzkirlhbkmfpbcsujp` confirms the Dictionary authorization lock is present:

- migration history contains `20260819235500 lock_shared_dictionary_writes_to_server`;
- `dictionary_core` retains authenticated `SELECT` only;
- no authenticated/anon shared-table write grants remain;
- authenticated/public/anon cannot execute `upsert_legacy_vocabulary_cache`;
- `service_role` retains execute authority;
- Dictionary/user-vocab row counts observed after apply match the pre-apply counts recorded in the Phase 0 runbook.

Phase 1 may proceed because the master plan gates it on stable P0-01, P0-04, P0-05, and P0-06. P0-02 deployed capability verification remains a post-merge release check, not a reason to reopen the completed learning-state integrity work.

## P1-01 authoritative merge rules

One pending local learning-state generation is rebased over the latest authoritative remote row using deterministic 3-way rules.

### Settings

- scalar fields merge independently against the base;
- if only remote changed a field, keep remote;
- if local changed a field, preserve the pending local intent;
- if both changed the same scalar field, pending local wins deterministically.

### Lesson text display preferences

`lessonTextDisplayMode` merges per nested field rather than replacing the whole object.

When persisted display settings are absent, the product's existing lesson-display defaults are the semantic base. This allows two first-time edits on different nested fields to survive one another instead of treating a full settings object as one atomic replacement.

### Bookmarks

Bookmark arrays represent membership, not ordered edit history.

- compute local additions/removals relative to base;
- apply those deltas to the latest remote membership set;
- preserve remote order for surviving remote items;
- append genuinely local additions in local order;
- local removal of a base membership removes it even if it is still present remotely.

### Progress items

A vocab/grammar progress item is one atomic review snapshot because `status`, `level`, and `lastReviewedAt` describe the same review transition and must not be field-spliced into an impossible combination.

If local and remote both changed the same item:

1. the later valid `lastReviewedAt` wins;
2. an exact or missing-timestamp tie keeps the pending local snapshot;
3. an explicit local deletion wins because deletion has no review timestamp to compare.

This rule is deterministic and preserves the later review action without mixing correlated fields.

### Review history

The existing additive conflict merge remains only as compatibility behavior. P1-02 is responsible for moving immutable review/practice evidence to `hanzihome_practice_attempts`; P1-01 must not expand `reviewHistory` ownership.

## P1-01 implementation scope

- `src/features/hanzihome/local/learning-state-conflict-merge.ts`
- `src/features/hanzihome/local/learning-state-local-first.ts`
- `src/features/hanzihome/utils/learning-state.ts`
- `src/features/hanzihome/components/lesson-overview/types.ts`
- deterministic merge tests

No DB/RLS/schema change, dependency change, public route change, or persisted-state shape change is authorized or required for P1-01.

## Required verification before P1-01 DONE

Run targeted merge/sync tests first, then the full gate:

```bash
npm run test:run -- \
  src/features/hanzihome/local/learning-state-conflict-merge.test.ts \
  src/features/hanzihome/local/learning-state-local-first.test.ts \
  src/features/hanzihome/local/learning-state-local-first.race.test.ts

npm run check
```

## P1-01 verification closeout

Status: `DONE`

The user confirmed the requested targeted merge/sync verification and full repository gate passed on the completed P1-01 branch head before P1-02 work started. This is recorded as user-supplied local execution evidence; the connector environment did not execute npm/Vitest itself.

P1-02 therefore starts from a verified deterministic merge baseline rather than layering attempt-evidence work on an unverified conflict implementation.
