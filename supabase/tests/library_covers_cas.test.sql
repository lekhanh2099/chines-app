begin;
select plan(28);

insert into auth.users (id, email) values
 ('00000000-0000-4000-8000-000000003101', 'cover-editor-a@example.test'),
 ('00000000-0000-4000-8000-000000003102', 'cover-editor-b@example.test'),
 ('00000000-0000-4000-8000-000000003103', 'cover-viewer@example.test');
insert into public.hanzihome_content_roles (user_id, role) values
 ('00000000-0000-4000-8000-000000003101', 'editor'),
 ('00000000-0000-4000-8000-000000003102', 'admin');
create temporary table library_cover_test_state (first_updated_at timestamptz, last_updated_at timestamptz);
grant select, insert, update on library_cover_test_state to authenticated;

select ok(not has_table_privilege('anon', 'public.hanzihome_library_covers', 'SELECT'), 'guest cannot read covers');
select ok(not has_table_privilege('authenticated', 'public.hanzihome_library_covers', 'INSERT'), 'direct client insert cannot bypass audit');
select ok(not has_table_privilege('authenticated', 'public.hanzihome_library_covers', 'UPDATE'), 'direct client update cannot bypass CAS');
select ok(not has_table_privilege('authenticated', 'public.hanzihome_library_covers', 'DELETE'), 'direct client delete cannot bypass CAS');
select ok(not has_function_privilege('anon', 'public.hanzihome_mutate_library_cover_as_user(text,text,timestamptz,boolean,text)', 'EXECUTE'), 'guest cannot invoke cover mutation');

set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select throws_ok($$select public.hanzihome_mutate_library_cover_as_user('group:hanyu', 'https://images.example.test/a.png')$$, '28000', 'Authenticated actor is required', 'RPC resolves its own authenticated actor');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000003103","role":"authenticated"}', true);
select throws_ok($$select public.hanzihome_mutate_library_cover_as_user('group:hanyu', 'https://images.example.test/a.png', null, false, 'Denied viewer')$$, '42501', 'HanziHome editor role is required', 'viewer cannot create a shared override');
select is((select count(*)::integer from public.hanzihome_library_covers), 0, 'missing override has no stored default row');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000003101","role":"authenticated"}', true);
insert into library_cover_test_state
select (result#>>'{item,updatedAt}')::timestamptz, (result#>>'{item,updatedAt}')::timestamptz
from public.hanzihome_mutate_library_cover_as_user('group:hanyu', 'https://images.example.test/a.png', null, false, 'Create family cover') as mutation(result);
select is((select cover_url from public.hanzihome_library_covers where collection_id='group:hanyu'), 'https://images.example.test/a.png', 'editor creates the family override');
select throws_ok($$select public.hanzihome_mutate_library_cover_as_user('group:hanyu', 'https://images.example.test/stale-create.png', null, false, 'Rejected absent creator')$$, '40001', 'Library cover changed since it was loaded', 'second observed-absence creator cannot replace the first');
select throws_ok($$select public.hanzihome_mutate_library_cover_as_user('group:hanyu', null, null, true, 'Rejected reset without base')$$, '22023', 'expectedUpdatedAt is required to reset a cover', 'reset requires the observed override version');
select throws_ok($$select public.hanzihome_mutate_library_cover_as_user('static:missing', 'https://images.example.test/a.png')$$, '22023', 'Invalid library cover mutation', 'unknown collection cannot be manufactured by the client');
select throws_ok($$select public.hanzihome_mutate_library_cover_as_user('static:nhip-cau', 'javascript:alert(1)')$$, '22023', 'Cover URL must use HTTP or HTTPS', 'direct RPC rejects non-HTTP cover URLs');
select is(public.hanzihome_mutate_library_cover_as_user('static:nhip-cau', 'https://images.example.test/sibling.png', null, false, 'Create static cover')#>>'{item,collectionId}', 'static:nhip-cau', 'static curriculum uses the same shared owner');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000003102","role":"authenticated"}', true);
update library_cover_test_state
set last_updated_at = (public.hanzihome_mutate_library_cover_as_user('group:hanyu', 'https://images.example.test/b.png', first_updated_at, false, 'Update shared family cover')#>>'{item,updatedAt}')::timestamptz;
select ok((select last_updated_at > first_updated_at from library_cover_test_state), 'acknowledged update advances the CAS version within the same transaction');
select is((select cover_url from public.hanzihome_library_covers where collection_id='group:hanyu'), 'https://images.example.test/b.png', 'another content editor can update the shared cover');
select throws_ok($$select public.hanzihome_mutate_library_cover_as_user('group:hanyu', 'https://images.example.test/stale.png', (select first_updated_at from library_cover_test_state), false, 'Rejected stale update')$$, '40001', 'Library cover changed since it was loaded', 'stale update cannot overwrite a newer editor');
select throws_ok($$select public.hanzihome_mutate_library_cover_as_user('group:hanyu', null, (select first_updated_at from library_cover_test_state), true, 'Rejected stale reset')$$, '40001', 'Library cover changed since it was loaded', 'stale reset cannot remove a newer editor cover');
select is(public.hanzihome_mutate_library_cover_as_user('group:hanyu', null, (select last_updated_at from library_cover_test_state), true, 'Reset family cover')->>'reset', 'true', 'acknowledged reset removes the override');
select is((select count(*)::integer from public.hanzihome_library_covers where collection_id='group:hanyu'), 0, 'reset returns family to implicit default');
select is((select cover_url from public.hanzihome_library_covers where collection_id='static:nhip-cau'), 'https://images.example.test/sibling.png', 'reset preserves a sibling curriculum override');
select throws_ok($$select public.hanzihome_mutate_library_cover_as_user('group:hanyu', 'https://images.example.test/stale-recreate.png', (select last_updated_at from library_cover_test_state), false, 'Rejected recreate after reset')$$, '40001', 'Library cover changed since it was loaded', 'stale update cannot recreate a deleted override');

reset role;
select is((select count(*)::integer from public.hanzihome_content_audit_log where entity_type='library_cover' and entity_id='group:hanyu'), 3, 'create update and reset each commit one audit row');
select is((select count(*)::integer from public.hanzihome_content_audit_log where entity_type='library_cover' and reason like 'Rejected%'), 0, 'rejected mutations leave no audit evidence or partial mutation');
select is((select actor_id::text from public.hanzihome_content_audit_log where entity_type='library_cover' and entity_id='group:hanyu' and operation='update'), '00000000-0000-4000-8000-000000003102', 'audit actor is the authenticated editor rather than a payload owner');
select ok((select before_data is null and after_data->>'cover_url'='https://images.example.test/a.png' from public.hanzihome_content_audit_log where entity_type='library_cover' and entity_id='group:hanyu' and operation='create'), 'creation audit records observed absence and the exact created override');
select ok((select before_data->>'cover_url'='https://images.example.test/b.png' and after_data is null from public.hanzihome_content_audit_log where entity_type='library_cover' and entity_id='group:hanyu' and operation='delete'), 'reset audit records the removed override and implicit default');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000003103","role":"authenticated"}', true);
select is((select cover_url from public.hanzihome_library_covers where collection_id='static:nhip-cau'), 'https://images.example.test/sibling.png', 'ordinary authenticated learners read the shared editor-owned override');

select * from finish();
rollback;
