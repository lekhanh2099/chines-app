begin;

-- Apply only after the application version that calls
-- `upsert_legacy_vocabulary_cache` is deployed.
drop policy if exists "Authenticated users can insert vocabularies" on public.vocabularies;
drop policy if exists "Authenticated users can update vocabularies" on public.vocabularies;

revoke all privileges on table public.vocabularies from anon;
revoke all privileges on table public.vocabularies from authenticated;
grant select on table public.vocabularies to authenticated;

commit;
