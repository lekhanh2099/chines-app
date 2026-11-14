begin;
select plan(18);

insert into auth.users (id, email) values
 ('00000000-0000-4000-8000-000000001001', 'notes-cas-owner@example.test'),
 ('00000000-0000-4000-8000-000000001002', 'notes-cas-other@example.test');
insert into public.note_folders (id, user_id, name) values
 ('00000000-0000-4000-8000-000000001021', '00000000-0000-4000-8000-000000001002', 'Other owner folder');
insert into public.notes (id, user_id, title, content, reading_content, tags) values
 ('00000000-0000-4000-8000-000000001011', '00000000-0000-4000-8000-000000001001', 'Original', '{"text":"original"}', '{"text":"sibling pane"}', '{}'),
 ('00000000-0000-4000-8000-000000001012', '00000000-0000-4000-8000-000000001002', 'Other', '{}', null, '{}');

select is((select revision from public.notes where id = '00000000-0000-4000-8000-000000001011'), 0, 'existing/new note starts at revision 0');
select ok(not has_table_privilege('authenticated', 'public.notes', 'UPDATE'), 'browser cannot bypass CAS with direct UPDATE');
select ok(not has_function_privilege('anon', 'public.update_note_with_revision(uuid,uuid,integer,jsonb)', 'EXECUTE'), 'guest cannot execute CAS');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000001001","role":"authenticated"}', true);
select is((public.update_note_with_revision('00000000-0000-4000-8000-000000001011', '00000000-0000-4000-8000-000000001001', 0, '{"content":{"text":"client A"}}')->>'revision')::integer, 1, 'client A receives the committed revision');
select is((select reading_content->>'text' from public.notes where id = '00000000-0000-4000-8000-000000001011'), 'sibling pane', 'content patch preserves reading pane');
select throws_ok($$select public.update_note_with_revision('00000000-0000-4000-8000-000000001011', '00000000-0000-4000-8000-000000001001', 0, '{"content":{"text":"client B"}}')$$, '40001', 'NOTE_REVISION_CONFLICT', 'client B cannot overwrite the same base revision');
select is((select content->>'text' from public.notes where id = '00000000-0000-4000-8000-000000001011'), 'client A', 'failed stale write preserves committed content');
select is((public.update_note_with_revision('00000000-0000-4000-8000-000000001011', '00000000-0000-4000-8000-000000001001', 1, '{"reading_content":null,"title":"Renamed"}')->>'revision')::integer, 2, 'reading clear and metadata share the revision');
select ok((select reading_content is null from public.notes where id = '00000000-0000-4000-8000-000000001011'), 'explicit null clears the requested pane');
select is((select content->>'text' from public.notes where id = '00000000-0000-4000-8000-000000001011'), 'client A', 'metadata does not replace content');
select throws_ok($$select public.update_note_with_revision('00000000-0000-4000-8000-000000001012', '00000000-0000-4000-8000-000000001001', 0, '{"title":"Stolen"}')$$, '42501', 'NOTE_NOT_FOUND', 'RPC rejects other owner note');
select throws_ok($$select public.update_note_with_revision('00000000-0000-4000-8000-000000001011', '00000000-0000-4000-8000-000000001002', 2, '{"title":"Wrong session"}')$$, '42501', 'NOTE_OWNER_MISMATCH', 'expected owner is verified against auth.uid');
select throws_ok($$select public.update_note_with_revision('00000000-0000-4000-8000-000000001011', '00000000-0000-4000-8000-000000001001', 2, '{"revision":100}')$$, '22023', 'INVALID_NOTE_PATCH_FIELD', 'caller cannot forge revision');
select throws_ok($$select public.update_note_with_revision('00000000-0000-4000-8000-000000001011', '00000000-0000-4000-8000-000000001001', 2, '{"content":null}')$$, '22023', 'INVALID_NOTE_PATCH_VALUE', 'invalid content does not produce an acknowledgement');
select throws_ok($$select public.update_note_with_revision('00000000-0000-4000-8000-000000001011', '00000000-0000-4000-8000-000000001001', 2, '{"folder_id":"00000000-0000-4000-8000-000000001021"}')$$, '23503', 'insert or update on table "notes" violates foreign key constraint "notes_user_folder_fk"', 'CAS cannot move a note into another owner folder');
select throws_ok($$select public.update_note_with_revision('00000000-0000-4000-8000-000000001011', '00000000-0000-4000-8000-000000001001', 2, '{}')$$, '22023', 'INVALID_NOTE_PATCH', 'empty patch is not a successful write');
select throws_ok($$update public.notes set title = 'Bypass' where id = '00000000-0000-4000-8000-000000001011'$$, '42501', 'permission denied for table notes', 'old client direct update fails without data loss');
select is((select revision from public.notes where id = '00000000-0000-4000-8000-000000001011'), 2, 'rejected writes do not advance revision');
select * from finish();
rollback;
