begin;
select plan(8);

-- Simulate the reviewed expand phase inside this rollback-only local contract test.
-- No production grant or canonical migration is changed by this test.
grant update on public.notes to authenticated;
grant execute on function public.hanzihome_update_lesson_text_annotation_note_as_server(uuid,uuid,text) to service_role;
grant execute on function public.update_lesson_text_annotation_note(uuid,text) to service_role;

insert into auth.users (id, email) values
 ('00000000-0000-4000-8000-000000003001', 'notes-rollout-owner@example.test');
insert into public.notes (id, user_id, title, content)
 values ('00000000-0000-4000-8000-000000003011', '00000000-0000-4000-8000-000000003001', 'Old app note', '{"text":"Original"}');

select ok(has_table_privilege('authenticated', 'public.notes', 'UPDATE'), 'expand phase retains the old deployed Notes writer');
select ok(has_function_privilege('service_role', 'public.hanzihome_update_lesson_text_annotation_note_as_server(uuid,uuid,text)', 'EXECUTE'), 'expand phase retains the old deployed Reader writer');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000003001","role":"authenticated"}', true);
select lives_ok($$update public.notes set content = '{"text":"Old app write"}' where id = '00000000-0000-4000-8000-000000003011'$$, 'old app writes against expanded schema');
select is((select revision from public.notes where id='00000000-0000-4000-8000-000000003011'), 1, 'old write still advances the new revision');
select throws_ok($$select public.update_note_with_revision('00000000-0000-4000-8000-000000003011', '00000000-0000-4000-8000-000000003001', 0, '{"title":"Stale new app"}')$$, '40001', 'NOTE_REVISION_CONFLICT', 'new app detects an intervening old-app write');
select is((public.update_note_with_revision('00000000-0000-4000-8000-000000003011', '00000000-0000-4000-8000-000000003001', 1, '{"title":"New app write"}')->>'revision')::integer, 2, 'new app CAS works before enforcement');
reset role;
revoke update on public.notes from authenticated;
revoke all on function public.hanzihome_update_lesson_text_annotation_note_as_server(uuid,uuid,text) from public, anon, authenticated, service_role;
revoke all on function public.update_lesson_text_annotation_note(uuid,text) from public, anon, authenticated, service_role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000003001","role":"authenticated"}', true);
select throws_ok($$update public.notes set title = 'Blocked old app' where id = '00000000-0000-4000-8000-000000003011'$$, '42501', 'permission denied for table notes', 'enforcement blocks a legacy bypass');
select is((public.update_note_with_revision('00000000-0000-4000-8000-000000003011', '00000000-0000-4000-8000-000000003001', 2, '{"content":{"text":"CAS after enforcement"}}')->>'revision')::integer, 3, 'new app continues after enforcement');
select * from finish();
rollback;
