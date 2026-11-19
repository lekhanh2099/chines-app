begin;
select plan(14);
insert into auth.users (id, email) values
 ('00000000-0000-4000-8000-000000004001', 'note-pdf-owner@example.test'),
 ('00000000-0000-4000-8000-000000004002', 'note-pdf-other@example.test');
insert into public.notes (id, user_id, title) values
 ('00000000-0000-4000-8000-000000004101', '00000000-0000-4000-8000-000000004001', 'Owner note'),
 ('00000000-0000-4000-8000-000000004102', '00000000-0000-4000-8000-000000004002', 'Other note');

select ok(not has_table_privilege('anon', 'public.note_pdf_attachments', 'SELECT'), 'guest cannot read note PDFs');
select ok(not has_table_privilege('authenticated', 'public.note_pdf_attachments', 'UPDATE'), 'attachments are immutable for clients');
select ok(not has_function_privilege('authenticated', 'public.note_pdf_attachments_delete_ink()', 'EXECUTE'), 'ink cleanup is trigger-only');
select is((select public from storage.buckets where id = 'note-pdfs'), false, 'note PDF bucket is private');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000004001","role":"authenticated"}', true);

select lives_ok($$
 insert into public.note_pdf_attachments (id, note_id, storage_path, file_name, byte_size, page_count)
 values ('00000000-0000-4000-8000-000000004201', '00000000-0000-4000-8000-000000004101',
  '00000000-0000-4000-8000-000000004001/00000000-0000-4000-8000-000000004101/00000000-0000-4000-8000-000000004201.pdf',
  'Bài 1.pdf', 1024, 12)
$$, 'owner attaches a PDF to their note');
select throws_ok($$
 insert into public.note_pdf_attachments (id, note_id, storage_path, file_name, byte_size, page_count)
 values ('00000000-0000-4000-8000-000000004202', '00000000-0000-4000-8000-000000004101',
  '00000000-0000-4000-8000-000000004001/00000000-0000-4000-8000-000000004101/00000000-0000-4000-8000-000000004202.pdf',
  'Bài 2.pdf', 1024, 3)
$$, '23505', null, 'a note holds one PDF');
select throws_ok($$
 insert into public.note_pdf_attachments (id, note_id, storage_path, file_name, byte_size, page_count)
 values ('00000000-0000-4000-8000-000000004203', '00000000-0000-4000-8000-000000004102',
  '00000000-0000-4000-8000-000000004001/00000000-0000-4000-8000-000000004102/00000000-0000-4000-8000-000000004203.pdf',
  'x.pdf', 1024, 3)
$$, '42501', null, 'cannot attach to another owner note');
select throws_ok($$
 insert into public.note_pdf_attachments (id, note_id, storage_path, file_name, byte_size, page_count)
 values ('00000000-0000-4000-8000-000000004204', '00000000-0000-4000-8000-000000004101',
  'elsewhere/file.pdf', 'x.pdf', 1024, 3)
$$, '23514', null, 'storage path is bound to owner, note and attachment');

select is(public.hanzihome_upsert_pdf_annotation_cas('note-pdf:00000000-0000-4000-8000-000000004201', 2, '{"strokes":[]}', 0, true)->>'saved', 'true', 'note PDF ink uses the existing CAS');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000004002","role":"authenticated"}', true);
select is((select count(*)::integer from public.note_pdf_attachments), 0, 'another owner cannot see the attachment');
delete from public.note_pdf_attachments where id = '00000000-0000-4000-8000-000000004201';

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000004001","role":"authenticated"}', true);
select is((select count(*)::integer from public.note_pdf_attachments), 1, 'another owner cannot remove the attachment');
delete from public.note_pdf_attachments where id = '00000000-0000-4000-8000-000000004201';
select is((select count(*)::integer from public.hanzihome_pdf_annotations where asset_id = 'note-pdf:00000000-0000-4000-8000-000000004201'), 0, 'removing the PDF removes its ink');

select lives_ok($$
 insert into public.note_pdf_attachments (id, note_id, storage_path, file_name, byte_size, page_count)
 values ('00000000-0000-4000-8000-000000004205', '00000000-0000-4000-8000-000000004101',
  '00000000-0000-4000-8000-000000004001/00000000-0000-4000-8000-000000004101/00000000-0000-4000-8000-000000004205.pdf',
  'Bài 3.pdf', 2048, 4)
$$, 'a replacement PDF can be attached');
delete from public.notes where id = '00000000-0000-4000-8000-000000004101';
select is((select count(*)::integer from public.note_pdf_attachments), 0, 'deleting the note removes its PDF row');

select * from finish();
rollback;
