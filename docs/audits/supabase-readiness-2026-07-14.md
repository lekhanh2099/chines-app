# Supabase readiness snapshot — 2026-07-14

Project: `pdrzkirlhbkmfpbcsujp`

This was a read-only connector audit. No SQL, migration, policy, Auth setting, or production data was changed.

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

Supabase remediation references:

- [Database linter](https://supabase.com/docs/guides/database/database-linter)
- [Function search path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Permissive RLS policies](https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy)
- [Password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

## Security rollout status

- `harden_legacy_vocabulary_cache_and_function_paths` was applied additively.
- The shared legacy vocabulary cache now has an authenticated, input-bounded upsert RPC.
- Eight mutable function search paths were fixed and the RPC was verified with an authenticated transaction that rolled back its data.
- Direct vocabulary table writes remain temporarily available until the RPC client is deployed. `restrict_legacy_vocabulary_cache_table_writes` is the post-deploy cutover migration.

## Safe next slice

1. Deploy the RPC client and verify a real vocabulary save, then apply the table-write cutover migration.
2. Establish the baseline status of pre-2026-06-18 local migrations before any ledger repair.
3. Treat public study-content GraphQL exposure as intentional until the Data API boundary is redesigned; private tables remain ownership-filtered by RLS.
4. Enable leaked-password protection in Auth settings.
5. Treat performance findings separately and validate query plans before changing indexes/policies.
