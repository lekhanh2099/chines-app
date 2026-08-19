# Supabase readiness snapshot — 2026-07-14

Project: `pdrzkirlhbkmfpbcsujp`

This started as a read-only connector audit and now records the reviewed production hardening rollout.

## Types and migration history

- Live TypeScript database types were generated and checked into `src/types/supabase.generated.ts`.
- The live migration ledger has 23 entries.
- The five live-only migrations were recovered from the authoritative SQL stored in `supabase_migrations.schema_migrations`.
- The six HTML-artifact migrations were verified byte-for-byte against the live statements (excluding the repository trailing newline) and renamed to their live versions.
- Older local migrations are still absent from the live ledger. Do not run migration repair against production until their baseline status is established; the recovered live history must not be treated as proof that those older files were applied by Supabase migrations.

## Advisor summary

Security advisor: 99 notices (86 warnings, 13 info).

- 8 functions have mutable `search_path`.
- 2 `vocabularies` write policies are always true for authenticated users.
- GraphQL exposure warnings cover anon/authenticated grants across multiple tables.
- Security-definer functions are executable by broad roles; each must be reviewed for intentional API exposure.
- leaked-password protection is disabled.

Performance advisor: 121 notices (42 warnings, 79 info).

- 35 unindexed foreign keys.
- 31 RLS init-plan findings.
- 12 objects without primary keys.
- 11 tables with multiple permissive policies.
- 32 unused-index notices; do not remove indexes based on a single usage snapshot.

After the reviewed performance migration:

- all 31 RLS init-plan findings are resolved without changing policy roles or ownership expressions;
- unindexed foreign-key findings decreased from 35 to 25;
- 10 indexes were added only for repository/API filters, lesson-detail relations, and reverse vocabulary lookups;
- newly created indexes may appear as unused until production traffic has exercised them, so no index-removal work is justified by this snapshot.

Supabase remediation references:

- [Database linter](https://supabase.com/docs/guides/database/database-linter)
- [Function search path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Permissive RLS policies](https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy)
- [Password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

## Security rollout status

- `harden_legacy_vocabulary_cache_and_function_paths` was applied additively.
- The shared legacy vocabulary cache now has an authenticated, input-bounded upsert RPC.
- Eight mutable function search paths were fixed and the RPC was verified with an authenticated transaction that rolled back its data.
- The RPC client was deployed successfully before the table-write cutover.
- `restrict_legacy_vocabulary_cache_table_writes` was then applied: authenticated clients retain read access but can no longer write the shared cache table directly.
- The authenticated RPC was verified again after cutover in a transaction that rolled back its data.

## Safe next slice

1. Establish the baseline status of pre-2026-06-18 local migrations before any ledger repair.
2. Treat public study-content GraphQL exposure as intentional until the Data API boundary is redesigned; private tables remain ownership-filtered by RLS.
3. Enable leaked-password protection in Auth settings; the current connector cannot mutate this Auth dashboard setting.
4. Reassess the remaining foreign-key and unused-index findings only with production query evidence; do not optimize audit columns speculatively.
