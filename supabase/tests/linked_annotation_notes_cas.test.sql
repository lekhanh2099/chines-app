begin;
select plan(17);

insert into auth.users (id, email) values
 ('00000000-0000-4000-8000-000000002001', 'annotation-cas-owner@example.test'),
 ('00000000-0000-4000-8000-000000002002', 'annotation-cas-other@example.test');
insert into public.hanzihome_courses (id, slug, title, source, user_id)
 values ('annotation-cas-course', 'annotation-cas-course', 'CAS fixture', 'custom', '00000000-0000-4000-8000-000000002001');
insert into public.hanzihome_course_books (id, course_id, title, source, user_id)
 values ('annotation-cas-book', 'annotation-cas-course', 'CAS fixture', 'custom', '00000000-0000-4000-8000-000000002001');
insert into public.hanzihome_lessons (id, course_id, book_id, lesson_number, lesson_order, title_zh, source, owner_id)
 values ('annotation-cas-lesson', 'annotation-cas-course', 'annotation-cas-book', 1, 1, 'CAS fixture', 'custom', '00000000-0000-4000-8000-000000002001');
insert into public.notes (id, user_id, title, content, reading_content) values
 ('00000000-0000-4000-8000-000000002011', '00000000-0000-4000-8000-000000002001', 'Original', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Original"}]}]}', '{"text":"Sibling reading pane"}');
insert into public.lesson_text_annotations (id, user_id, lesson_id, node_type, node_id, start_offset, end_offset, selected_text, note_id) values
 ('00000000-0000-4000-8000-000000002021', '00000000-0000-4000-8000-000000002001', 'annotation-cas-lesson', 'paragraph', 'linked', 0, 2, '你好', '00000000-0000-4000-8000-000000002011'),
 ('00000000-0000-4000-8000-000000002022', '00000000-0000-4000-8000-000000002001', 'annotation-cas-lesson', 'paragraph', 'unlinked', 0, 2, '你好', null);

select ok(not has_function_privilege('authenticated', 'public.hanzihome_update_lesson_text_annotation_note_cas_as_server(uuid,uuid,text,integer)', 'EXECUTE'), 'client cannot invoke service CAS directly');
select ok(not has_function_privilege('anon', 'public.hanzihome_update_lesson_text_annotation_note_cas_as_server(uuid,uuid,text,integer)', 'EXECUTE'), 'guest cannot invoke service CAS');
select ok(not has_function_privilege('service_role', 'public.hanzihome_update_lesson_text_annotation_note_as_server(uuid,uuid,text)', 'EXECUTE'), 'legacy server writer is blocked');
select ok(not has_function_privilege('service_role', 'public.update_lesson_text_annotation_note(uuid,text)', 'EXECUTE'), 'legacy user writer is blocked');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000002001","role":"authenticated"}', true);
select is((public.update_note_with_revision('00000000-0000-4000-8000-000000002011', '00000000-0000-4000-8000-000000002001', 0, '{"content":{"root":{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","text":"Editor A"}]},{"type":"paragraph","children":[{"type":"text","text":"Full second paragraph"}]}]}}}')->>'revision')::integer, 1, 'Notes writer advances the shared base');
reset role;
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select is(public.hanzihome_update_lesson_text_annotation_note_cas_as_server('00000000-0000-4000-8000-000000002001', '00000000-0000-4000-8000-000000002021', 'Stale Reader', 0)->>'saved', 'false', 'stale Reader cannot overwrite Notes');
select is(public.hanzihome_update_lesson_text_annotation_note_cas_as_server('00000000-0000-4000-8000-000000002001', '00000000-0000-4000-8000-000000002021', 'Stale Reader', 0)#>>'{annotation,notes,content,root,children,1,children,0,text}', 'Full second paragraph', 'conflict returns full Lexical content');
select is(public.hanzihome_update_lesson_text_annotation_note_cas_as_server('00000000-0000-4000-8000-000000002001', '00000000-0000-4000-8000-000000002021', 'No base', null)->>'saved', 'false', 'absence base cannot overwrite an existing note');
select is(public.hanzihome_update_lesson_text_annotation_note_cas_as_server('00000000-0000-4000-8000-000000002001', '00000000-0000-4000-8000-000000002021', 'Reader A', 1)#>>'{annotation,notes,revision}', '2', 'Reader receives exact committed revision');
select is((select reading_content->>'text' from public.notes where id='00000000-0000-4000-8000-000000002011'), 'Sibling reading pane', 'Reader preserves the sibling reading pane');
select is(public.hanzihome_update_lesson_text_annotation_note_cas_as_server('00000000-0000-4000-8000-000000002001', '00000000-0000-4000-8000-000000002021', 'Reader B', 1)->>'saved', 'false', 'second Reader at same base cannot overwrite');
select throws_ok($$select public.hanzihome_update_lesson_text_annotation_note_cas_as_server('00000000-0000-4000-8000-000000002002', '00000000-0000-4000-8000-000000002021', 'Other owner', 2)$$, '42501', 'ANNOTATION_NOT_FOUND', 'server expected owner fences the annotation');
select is(public.hanzihome_update_lesson_text_annotation_note_cas_as_server('00000000-0000-4000-8000-000000002001', '00000000-0000-4000-8000-000000002022', 'First create', null)->>'saved', 'true', 'observed absence creates the linked note');
select is(public.hanzihome_update_lesson_text_annotation_note_cas_as_server('00000000-0000-4000-8000-000000002001', '00000000-0000-4000-8000-000000002022', 'Stale create', null)->>'saved', 'false', 'second observed-absence creator cannot replace the first');
select is((select count(*)::integer from public.lesson_note_links where target_key='annotation-cas-lesson'), 1, 'creation race keeps one linked note relation');
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000002001","role":"authenticated"}', true);
select throws_ok($$select public.update_note_with_revision('00000000-0000-4000-8000-000000002011', '00000000-0000-4000-8000-000000002001', 1, '{"title":"Stale Notes"}')$$, '40001', 'NOTE_REVISION_CONFLICT', 'stale Notes cannot overwrite Reader');
select is((select content#>>'{content,0,content,0,text}' from public.notes where id='00000000-0000-4000-8000-000000002011'), 'Reader A', 'rejected cross-writer edits preserve Reader content');
select * from finish();
rollback;
