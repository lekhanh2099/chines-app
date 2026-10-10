begin;
set local lock_timeout = '5s';
revoke update on public.notes from authenticated;
revoke all on function public.hanzihome_update_lesson_text_annotation_note_as_server(uuid,uuid,text) from public, anon, authenticated, service_role;
revoke all on function public.update_lesson_text_annotation_note(uuid,text) from public, anon, authenticated, service_role;
revoke all on function public.hanzihome_upsert_pdf_annotation(text,integer,jsonb,integer) from public, anon, authenticated, service_role;
revoke insert, update, delete on public.hanzihome_pdf_annotations from authenticated;
commit;
