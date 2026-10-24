begin;
select plan(9);

select ok(not has_function_privilege('anon', 'public.upsert_legacy_vocabulary_cache(text,text,text,text,jsonb)', 'EXECUTE'), 'guest cannot execute the legacy cache writer');
select ok(not has_function_privilege('authenticated', 'public.upsert_legacy_vocabulary_cache(text,text,text,text,jsonb)', 'EXECUTE'), 'browser cannot execute the legacy cache writer');
select ok(has_function_privilege('service_role', 'public.upsert_legacy_vocabulary_cache(text,text,text,text,jsonb)', 'EXECUTE'), 'trusted service retains the legacy RPC grant');
select ok(has_table_privilege('authenticated', 'public.dictionary_core', 'SELECT'), 'browser can still read canonical dictionary data');
select ok(not has_table_privilege('authenticated', 'public.dictionary_core', 'INSERT'), 'browser cannot insert canonical dictionary data');
select ok(has_table_privilege('service_role', 'public.dictionary_core', 'INSERT'), 'trusted service retains canonical dictionary writes');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000001001","role":"authenticated"}', true);
select throws_ok(
 $$select public.upsert_legacy_vocabulary_cache('__dictionary_acl_fixture__', '', '', '', '{}'::jsonb)$$,
 '42501',
 'permission denied for function upsert_legacy_vocabulary_cache',
 'a valid authenticated RPC call fails on permission, not its arguments'
);

reset role;
set local role service_role;
select lives_ok(
 $$insert into public.vocabularies (hanzi, meaning, analysis, ai_analysis)
   values ('__dictionary_acl_fixture__', 'trusted legacy cache', '{}'::jsonb, '{}'::jsonb)
   on conflict (hanzi) do update set meaning = excluded.meaning$$,
 'the server dictionary path can still upsert the legacy table directly'
);
select lives_ok(
 $$insert into public.dictionary_core (headword, lookup_key, data)
   values ('__dictionary_acl_fixture__', '__dictionary_acl_fixture__', '{}'::jsonb)
   on conflict (lookup_key) do update set data = excluded.data$$,
 'the server dictionary path can still upsert canonical cache data'
);

reset role;
select * from finish();
rollback;
