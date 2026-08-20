begin;

-- Shared dictionary rows are canonical application data. Authenticated browser
-- sessions may read them, but only server authority may create or change them.
drop policy if exists "Authenticated users can insert dictionary core" on public.dictionary_core;
drop policy if exists "Authenticated users can update dictionary core" on public.dictionary_core;

revoke insert, update, delete, truncate, references, trigger
on table public.dictionary_core
from authenticated;

revoke insert, update, delete, truncate, references, trigger
on table public.dictionary_core
from anon;

grant select on table public.dictionary_core to authenticated;

-- The legacy vocabulary table is already read-only to authenticated callers,
-- but this historical SECURITY DEFINER RPC still permits any signed-in browser
-- to mutate the shared cache. The Phase 0 application no longer calls this RPC:
-- shared cache writes go through the server-only authority client instead.
-- Keep the RPC as a server/admin compatibility surface without rewriting its
-- body or auth semantics in the same lock-down migration.
revoke execute on function public.upsert_legacy_vocabulary_cache(text, text, text, text, jsonb)
from public, anon, authenticated;

grant execute on function public.upsert_legacy_vocabulary_cache(text, text, text, text, jsonb)
to service_role;

commit;
