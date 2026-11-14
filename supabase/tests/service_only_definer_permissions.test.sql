begin;
select plan(7);

-- Layer 1 (grants): no service-only SECURITY DEFINER RPC may be executable by
-- the browser roles. *_as_server wrappers impersonate p_user_id and ai_*
-- runtime functions trust p_user_id, so either grant is a cross-user boundary.
select is(
 (
  select coalesce(array_agg(p.oid::regprocedure::text order by 1), '{}')
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
   and p.prosecdef
   and (p.proname like '%\_as\_server' or p.proname like 'ai\_%'
        or p.proname like 'hanzihome\_%external\_seed%')
   and (has_function_privilege('anon', p.oid, 'EXECUTE')
        or has_function_privilege('authenticated', p.oid, 'EXECUTE'))
 ),
 '{}'::text[],
 'service-only definer RPCs are not executable by anon or authenticated'
);

-- Layer 2 (body guards): every service-only definer that is still callable by
-- the service role must also reject other callers itself. Functions with no
-- grants at all (retired wrappers) are excluded because nobody can call them,
-- and trigger functions are excluded because they run as part of a write.
select is(
 (
  select coalesce(array_agg(p.oid::regprocedure::text order by 1), '{}')
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
   and p.prosecdef
   and (p.proname like '%\_as\_server' or p.proname like 'ai\_%'
        or p.proname like 'hanzihome\_%external\_seed%')
   and p.prorettype <> 'trigger'::regtype
   and has_function_privilege('service_role', p.oid, 'EXECUTE')
   and pg_get_functiondef(p.oid) not like '%service_role%'
 ),
 '{}'::text[],
 'every callable service-only definer RPC checks the caller role in its body'
);

select ok(
 has_function_privilege(
  'service_role',
  'public.hanzihome_upsert_personal_learning_state_as_server(uuid,text,jsonb,integer)',
  'EXECUTE'
 ),
 'the server keeps its personal learning state RPC'
);

select ok(
 has_function_privilege(
  'service_role',
  'public.ai_match_memories(uuid,uuid,text,integer,double precision)',
  'EXECUTE'
 ),
 'the server keeps AI memory retrieval'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000001001","role":"authenticated"}', true);
select throws_ok(
 $$select public.hanzihome_upsert_personal_learning_state_as_server(
   '00000000-0000-4000-8000-000000009999', 'node-1', '{}'::jsonb, 0)$$,
 '42501',
 null,
 'a browser session cannot impersonate another user through the server wrapper'
);
reset role;

-- Simulate an accidental re-grant: the body guard must still stop the call.
grant execute on function public.hanzihome_upsert_personal_learning_state_as_server(uuid, text, jsonb, integer)
 to authenticated;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000001001","role":"authenticated"}', true);
select throws_ok(
 $$select public.hanzihome_upsert_personal_learning_state_as_server(
   '00000000-0000-4000-8000-000000009999', 'node-1', '{}'::jsonb, 0)$$,
 '42501',
 'Service role is required',
 'the wrapper rejects a browser caller even if EXECUTE is granted again'
);
reset role;

-- The service role passes the guard (any later failure is the inner function's
-- own validation, not the caller check).
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select is(
 (
  select count(*)::int
  from public.ai_match_memories(
   '00000000-0000-4000-8000-000000009999', null, '[0]', 1, -1
  )
 ),
 0,
 'the service role can call AI memory retrieval (no fixture memories exist)'
);
reset role;

select * from finish();
rollback;
