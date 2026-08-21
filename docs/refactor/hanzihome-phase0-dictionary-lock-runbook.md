# HanziHome Phase 0 — Dictionary Authorization Lock Runbook

> **Historical migration note (2026-08-21):** The standalone migration named
> below is no longer executable. Its final authorization state is included in
> `supabase/migrations/20260820163000_hanzihome_remote_schema_baseline.sql`.

Status: historical record; superseded by the canonical baseline
Branch: `refactor/hanzihome-integrity-remediation`  
Target inspected: Supabase `chines-app` / `pdrzkirlhbkmfpbcsujp`  
Migration: `supabase/migrations/20260819235500_lock_shared_dictionary_writes_to_server.sql`

This runbook exists so the high-risk authorization cutover is reproducible and reviewable. It does not authorize a production mutation. Applying the migration still requires explicit confirmation for the exact target above.

## 1. Preconditions

Before apply, verify all of the following:

1. Application source containing `/api/dictionary/srs`, `service-role.server.ts`, and `dictionary-persistence.server.ts` is the version intended for deployment.
2. Browser Dictionary save callers no longer invoke shared canonical upsert helpers directly.
3. Shared Dictionary writes follow the reviewed trust model:
   - fixed basic lookup canonicalization may persist through server authority;
   - `/api/dictionary/srs` may canonicalize from an existing canonical row, trusted server-read legacy row, or the fixed basic lookup contract;
   - general/deep/editor/generate-vocab output that can use learner-owned prompt/model settings remains request-local and MUST NOT overwrite shared canonical truth.
4. `upsert_legacy_vocabulary_cache` is no longer required by normal browser runtime source.
5. `npm run check` (or the explicitly approved equivalent release gate) passes in a real checkout/CI environment.
6. Exact production migration drift is re-read immediately before apply.
7. The user explicitly authorizes applying this exact migration to `pdrzkirlhbkmfpbcsujp`.

## 2. Read-only preflight

Re-run these checks immediately before apply.

```sql
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('dictionary_core', 'vocabularies')
order by tablename, policyname;
```

```sql
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('dictionary_core', 'vocabularies')
  and grantee in ('anon', 'authenticated', 'service_role')
order by table_name, grantee, privilege_type;
```

```sql
select
 n.nspname as schema_name,
 p.proname,
 pg_get_function_identity_arguments(p.oid) as args,
 p.prosecdef,
 p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'upsert_legacy_vocabulary_cache';
```

```sql
select
 (select count(*) from public.dictionary_core) as dictionary_core_rows,
 (select count(*) from public.vocabularies) as vocabularies_rows,
 (select count(*) from public.user_vocab_progress) as user_vocab_progress_rows,
 (select count(*) from public.user_vocabularies) as user_vocabularies_rows;
```

The migration is privilege/policy-only and does not rewrite these rows. Unexpected row-count changes between preflight and postflight are therefore a stop signal.

### Preflight evidence captured 2026-08-20

Read-only inspection of `pdrzkirlhbkmfpbcsujp` confirmed before handoff:

- `dictionary_core`: 42 rows;
- `vocabularies`: 42 rows;
- `user_vocab_progress`: 26 rows;
- `user_vocabularies`: 26 rows;
- every legacy `vocabularies.hanzi` currently has a matching `dictionary_core.lookup_key` (`unmatched_legacy = 0`);
- matching legacy/canonical rows have no pinyin mismatch in the current sample (`pinyin_mismatch = 0`);
- authenticated still has broad table grants on `dictionary_core`, including INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER, while current RLS exposes authenticated INSERT and UPDATE through non-null `auth.uid()` policies;
- `upsert_legacy_vocabulary_cache` remains SECURITY DEFINER and executable by authenticated.

### Existing-data residue — intentionally not part of this lock migration

Two of the 42 current `dictionary_core` rows have `headword` length greater than 32 characters (71 and 175 characters). Inspection shows they are historical sentence/dialogue concatenations rather than normal dictionary headwords. Current Phase 0 source prevents this class of new pollution by constraining SRS canonical identity and by keeping learner-custom/deep analysis transient.

Do **not** delete or rewrite these two rows as part of the authorization migration. That would be a separate production-data cleanup decision requiring its own dependency/reference check and explicit authorization, especially because user relationships or historical cache references may exist.

## 3. Apply

Apply only through the repository migration workflow using the exact migration file. Do not reproduce the DDL manually in the dashboard.

Expected effects:

- remove authenticated INSERT/UPDATE policies from `dictionary_core`;
- remove browser write-like table grants on `dictionary_core`;
- retain authenticated SELECT on `dictionary_core`;
- revoke public/anon/authenticated execute on `upsert_legacy_vocabulary_cache`;
- retain service-role execute on the legacy RPC for compatibility.

No table data, column, index, or function body is changed by this migration.

## 4. Post-apply verification

Re-run the policy/grant/function queries from the preflight and verify:

```text
authenticated dictionary_core SELECT       -> allowed
authenticated dictionary_core INSERT       -> not granted / no insert policy
authenticated dictionary_core UPDATE       -> not granted / no update policy
authenticated legacy cache RPC EXECUTE     -> revoked
service_role legacy cache RPC EXECUTE      -> retained
```

Then run Supabase security and performance advisors and record any new findings.

Application smoke checks:

1. signed-in Dictionary lookup can still read an existing shared entry;
2. fixed basic lookup requiring canonical enrichment can persist through server authority;
3. learner-custom/deep/editor/generate-vocab analysis does not mutate shared canonical rows;
4. Save-to-SRS succeeds through `/api/dictionary/srs`;
5. repeating a plain Save-to-SRS does not erase an existing personal note/context when those optional fields are omitted;
6. user progress/note is created only for the authenticated user;
7. direct browser shared-table write attempt fails;
8. direct authenticated call to the legacy shared-cache RPC fails;
9. another user's Dictionary personal state remains invisible.

## 5. Failure handling

Preferred recovery is a forward fix: repair any missed browser caller so it uses the server/BFF boundary. Do not reopen shared writes merely to make an old caller pass.

If an emergency rollback is explicitly authorized, create a **new timestamped migration**; do not edit or delete the applied migration. The rollback would restore the former authenticated write surface and therefore reintroduce the audited vulnerability. Its minimum inverse is:

```sql
begin;

grant insert, update on table public.dictionary_core to authenticated;

create policy "Authenticated users can insert dictionary core"
on public.dictionary_core
for insert
to authenticated
with check ((select auth.uid()) is not null);

create policy "Authenticated users can update dictionary core"
on public.dictionary_core
for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

grant execute on function public.upsert_legacy_vocabulary_cache(text, text, text, text, jsonb)
to authenticated;

commit;
```

That rollback is security-regressive and must be treated as a temporary emergency measure followed immediately by a forward fix.

## 6. Closeout evidence

The Phase 0 checkpoint must record:

- exact migration version applied;
- exact Supabase target;
- pre/post policy and grant observations;
- advisors result;
- application smoke result;
- generated-type check result;
- rollback/forward-fix decision if anything failed.
