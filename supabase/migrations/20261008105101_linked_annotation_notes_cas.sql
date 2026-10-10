begin;
set local lock_timeout = '5s';

create function public.hanzihome_update_lesson_text_annotation_note_cas_as_server(
 p_user_id uuid,
 p_annotation_id uuid,
 p_note_text text,
 p_expected_revision integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
 target_annotation public.lesson_text_annotations;
 target_note public.notes;
 normalized_note text := nullif(btrim(p_note_text), '');
 note_content jsonb;
 saved boolean := false;
begin
 if auth.role() is distinct from 'service_role' or p_user_id is null then
  raise exception 'ANNOTATION_OWNER_REQUIRED' using errcode = '42501';
 end if;
 if normalized_note is null or p_expected_revision < 0 then
  raise exception 'INVALID_ANNOTATION_NOTE_PATCH' using errcode = '22023';
 end if;
 select * into target_annotation from public.lesson_text_annotations
 where id = p_annotation_id and user_id = p_user_id for update;
 if not found then raise exception 'ANNOTATION_NOT_FOUND' using errcode = '42501'; end if;

 if target_annotation.note_id is not null then
  select * into target_note from public.notes
  where id = target_annotation.note_id and user_id = p_user_id for update;
  if not found then raise exception 'ANNOTATION_NOTE_NOT_FOUND' using errcode = '42501'; end if;
 end if;

 -- Null is the observed absence base, never a wildcard for an existing note.
 if (target_annotation.note_id is null and p_expected_revision is null)
  or (target_annotation.note_id is not null and target_note.revision = p_expected_revision) then
  note_content := jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
   jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
    jsonb_build_object('type', 'text', 'text', normalized_note)
   ))
  ));
  if target_annotation.note_id is null then
   insert into public.notes (user_id, title, tags, category, content)
   values (p_user_id, left('Ghi chú: ' || target_annotation.selected_text, 120), array['annotation'], 'general', note_content)
   returning * into target_note;
   insert into public.lesson_note_links (user_id, note_id, target_type, target_key, relation_type)
   values (p_user_id, target_note.id, 'hanzihome_lesson', target_annotation.lesson_id, 'annotation');
   update public.lesson_text_annotations set note_id = target_note.id, updated_at = now()
   where id = target_annotation.id returning * into target_annotation;
  else
   update public.notes set content = note_content
   where id = target_note.id and user_id = p_user_id returning * into target_note;
  end if;
  saved := true;
 end if;

 -- Both row locks remain held: acknowledgement/conflict is the exact snapshot here.
 return jsonb_build_object('saved', saved, 'annotation',
  to_jsonb(target_annotation) || jsonb_build_object('notes',
   case when target_annotation.note_id is null then null else to_jsonb(target_note) end
  )
 );
end;
$$;
revoke all on function public.hanzihome_update_lesson_text_annotation_note_cas_as_server(uuid,uuid,text,integer) from public, anon, authenticated;
grant execute on function public.hanzihome_update_lesson_text_annotation_note_cas_as_server(uuid,uuid,text,integer) to service_role;

-- Expand phase retains legacy RPC grants until all app writers use the new CAS.
comment on function public.hanzihome_update_lesson_text_annotation_note_cas_as_server(uuid,uuid,text,integer) is
'Server owner-fenced linked note CAS. Null base requires observed absence; conflict and acknowledgement return the full locked snapshot.';

commit;
