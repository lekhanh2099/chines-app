---
name: hanzihome-supabase-migration
description: Design, review, apply, and verify HanziHome Supabase migrations safely. Use when changing tables, columns, indexes, RLS policies, grants, functions, RPCs, triggers, content ownership, stable editable IDs, generated database types, or migration drift.
---

# HanziHome Supabase Migration

## Overview

Keep schema history reproducible and preserve the study/edit flow while database contracts evolve.

## Preflight

1. Read root `AGENTS.md`, `supabase/AGENTS.md`, and accepted ADRs.
2. Inspect related migrations, live generated types, server repository queries, route authorization, and tests.
3. Define ownership (`seed`, `custom`, or `user_override`), stable IDs, parent relationships, read payload impact, rollback/forward-fix path, and lock/rewrite risk.
4. If seed-edit policy, exercise shape, or required destructive child replacement is unclear, stop and ask.

## Migration workflow

1. Create one timestamped migration under `supabase/migrations/`; never make dashboard-only schema edits.
2. Make policy/grant/function changes explicit. Resolve identity server-side and verify parent-child membership from rows, not request claims.
3. Prefer additive/backfill/enforce sequencing for populated tables. Use transactions where partial application would be unsafe.
4. Keep normal edits row/node-level. Name bulk replacement separately and make it transactional.
5. Apply first to a local, branch, or otherwise safe environment unless the user explicitly authorizes production.
6. Refresh `src/types/supabase.generated.ts`, update Zod/API contracts, and run targeted tests plus required repository checks.
7. Run Supabase security/performance advisors when live access is available and report unresolved findings.

Read [references/migration-review.md](references/migration-review.md) before approval.

## Output

Report the invariant, migration path, authorization/ownership behavior, affected read/write contracts, verification evidence, live environment touched, and residual deployment risk.
