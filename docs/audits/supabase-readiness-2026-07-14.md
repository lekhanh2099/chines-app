# Supabase readiness snapshot — 2026-07-14

Project: `pdrzkirlhbkmfpbcsujp`

This was a read-only connector audit. No SQL, migration, policy, Auth setting, or production data was changed.

## Types and migration history

- Live TypeScript database types were generated and checked into `src/types/supabase.generated.ts`.
- The live migration ledger has 23 entries.
- The repository and live ledger are not fully reproducible from each other. The live project contains Boya listening migrations and `create_temporary_hanyu_v3_import_chunks` that are absent locally; several HTML-artifact migrations also have different live timestamps. Older local migrations are absent from the live ledger.
- Do not run repair/push against production until this history is reconciled from authoritative SQL. Do not fabricate missing migrations from generated types.

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

## Safe next slice

1. Recover the four missing live migration SQL bodies and reconcile timestamp/name differences.
2. Classify public study-content reads versus private/user-owned tables before revoking grants.
3. Fix mutable function search paths and obviously broad legacy vocabulary write policies in a reviewed migration.
4. Re-run security advisors, then address RLS/grant exposure by resource family.
5. Treat performance findings separately and validate query plans before changing indexes/policies.
