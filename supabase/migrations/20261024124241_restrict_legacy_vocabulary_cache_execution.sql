begin;

-- Supabase bootstrap grants anon/authenticated EXECUTE directly. Revoking only
-- PUBLIC in the captured baseline leaves those grants on this definer RPC.
revoke execute on function public.upsert_legacy_vocabulary_cache(text, text, text, text, jsonb)
 from public, anon, authenticated;
grant execute on function public.upsert_legacy_vocabulary_cache(text, text, text, text, jsonb)
 to service_role;

commit;
