---
name: hanzihome-supabase-migration
description: Design, review, apply, and verify HanziHome Supabase migrations safely. Use when changing tables, columns, indexes, RLS policies, grants, functions, RPCs, triggers, content ownership, stable editable IDs, generated database types, or migration drift.
---

# HanziHome Supabase Migration

## Overview

Keep schema history reproducible and preserve the study/edit flow while database contracts evolve.

## Preflight

1. Read root `AGENTS.md`, `supabase/AGENTS.md`,
   `docs/agent/skill-authoring.md`, and accepted ADRs.
2. Inspect related migrations, live generated types, server repository queries, route authorization, and tests.
3. State the exact local, branch, staging, or production target. Inspect
   migration drift and define ownership (`seed`, `custom`, or `user_override`),
   stable IDs, parent relationships, existing-row safety, read payload impact
   and lock/rewrite risk.
4. Choose and document either rollback or forward-fix for this migration; do
   not claim both without an executable path.
5. If seed-edit policy, exercise shape, required destructive child replacement,
   target environment, or production authorization is unclear, stop and ask.

## Migration workflow

1. Create one timestamped migration under `supabase/migrations/`; never make dashboard-only schema edits.
2. Make policy/grant/function changes explicit. Resolve identity server-side and verify parent-child membership from rows, not request claims.
3. Prefer additive/backfill/enforce sequencing for populated tables. Use transactions where partial application would be unsafe.
4. Keep normal edits row/node-level. Name bulk replacement separately and make it transactional.
5. Apply first to the stated local, branch, or otherwise safe environment unless
   the user explicitly authorizes production.
6. Refresh `src/types/supabase.generated.ts`, update Zod/API contracts, and run targeted tests plus required repository checks.
7. Run Supabase security/performance advisors when live access is available and report unresolved findings.

Read [references/migration-review.md](references/migration-review.md) before approval.

## Verification tiers

- **Fast:** read-only migration/contract review with no file, schema, or live
  target mutation; static drift and ownership evidence is sufficient.
- **Subsystem:** one local migration plus generated types, repository queries,
  authorization and focused tests are affected.
- **Full:** live drift, RLS/RPC, production authorization, populated-table
  locking, generated-contract refresh, or release verification is involved.

Database mutations always escalate to the full risk path when the target,
authorization, rollback/forward-fix, or existing-row impact is not explicit.

## Output

Report the precedent, invariant, migration path, drift state, existing-row and
lock risk, chosen rollback or forward-fix, authorization/ownership behavior,
affected read/write contracts, verification evidence, exact environment
touched, selected tier, and residual deployment risk.
