---
name: hanzihome-supabase-migration
description: Design, review, apply, and verify HanziHome Supabase migrations safely. Use when changing tables, columns, indexes, RLS policies, grants, functions, RPCs, triggers, content ownership, stable editable IDs, generated database types, or migration drift.
---

# HanziHome Supabase Migration

## Overview

Keep schema history reproducible and preserve the study/edit flow while database contracts evolve.

## Trace the migration

Read [Supabase instructions](../../../supabase/AGENTS.md) for the approval,
existing-row, security and verification contract. For HanziHome content changes,
also read the affected subtree contract and accepted ownership ADRs.

Inspect related migrations, generated types, repository queries, route
authorization and tests. Trace ownership (`seed`, `custom`, or `user_override`),
stable IDs, parent relationships and affected read/write payloads to the actual
target. Use the owning contract's stop conditions when the write policy or
exercise shape is unresolved.

## Migration workflow

1. Prepare the timestamped SQL and review evidence required by the Supabase
   contract before requesting approval.
2. Apply first to the stated local, branch, or otherwise safe environment unless
   the user explicitly authorizes production.
3. Refresh generated types and affected Zod/API contracts, then run the relevant
   database and repository checks.
4. Run security/performance advisors when live access is available and report
   unresolved findings.
5. After a remote apply, the repository filename must carry the version the
   registry assigned; rename the file (content unchanged) rather than editing
   `supabase_migrations.schema_migrations`.

Order the rollout by what the deployed application reads. An additive column
or table the new code requires is applied **before** the code merges; a table
or column the old code still reads is dropped only **after** the code that
stopped reading it is deployed. A destructive migration needs its own explicit
owner confirmation, with row counts and an export offer.

Assertions in `supabase/tests` must pass on a clean database: build every row
the assertion depends on inside the test, never rely on leftover local data.

## Verification

Use [root verification tiers](../../../AGENTS.md#6-working-method) and the
database proof requirements in
[Supabase instructions](../../../supabase/AGENTS.md). Read-only review and
credentialed live operations remain separate scopes.

## Output

Report the migration review evidence from the Supabase contract, actual checks
and environment touched, and remaining deployment risk.
