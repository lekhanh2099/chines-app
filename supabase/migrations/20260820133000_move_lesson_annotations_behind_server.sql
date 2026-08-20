begin;

-- Browser clients reach lesson annotations through the authenticated BFF.
-- These service-role RPCs preserve the existing note + link + annotation
-- transaction while receiving the owner only from a server-validated route.
create or replace function public.hanzihome_create_lesson_text_annotation_as_server(
  p_user_id uuid,
  p_lesson_id text,
  p_node_type text,
  p_node_id text,
  p_start_offset integer,
  p_end_offset integer,
  p_selected_text text,
  p_prefix_text text default '',
  p_suffix_text text default '',
  p_note_text text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_annotation_id uuid;
  created_note_id uuid;
  normalized_note text := nullif(btrim(p_note_text), '');
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role is required';
  end if;

  if p_user_id is null then
    raise exception 'User is required';
  end if;

  if normalized_note is not null then
    insert into public.notes (user_id, title, tags, category, content)
    values (
      p_user_id,
      left('Ghi chú: ' || btrim(p_selected_text), 120),
      array['annotation'],
      'general',
      jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(
          jsonb_build_object(
            'type', 'paragraph',
            'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', normalized_note))
          )
        )
      )
    )
    returning id into created_note_id;

    insert into public.lesson_note_links (
      user_id,
      note_id,
      target_type,
      target_key,
      relation_type
    )
    values (
      p_user_id,
      created_note_id,
      'hanzihome_lesson',
      p_lesson_id,
      'annotation'
    );
  end if;

  insert into public.lesson_text_annotations (
    user_id,
    lesson_id,
    node_type,
    node_id,
    start_offset,
    end_offset,
    selected_text,
    prefix_text,
    suffix_text,
    note_id
  )
  values (
    p_user_id,
    p_lesson_id,
    p_node_type,
    p_node_id,
    p_start_offset,
    p_end_offset,
    btrim(p_selected_text),
    coalesce(p_prefix_text, ''),
    coalesce(p_suffix_text, ''),
    created_note_id
  )
  returning id into created_annotation_id;

  return created_annotation_id;
end;
$$;

create or replace function public.hanzihome_update_lesson_text_annotation_note_as_server(
  p_user_id uuid,
  p_annotation_id uuid,
  p_note_text text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_annotation public.lesson_text_annotations%rowtype;
  target_note_id uuid;
  normalized_note text := nullif(btrim(p_note_text), '');
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role is required';
  end if;

  if p_user_id is null then
    raise exception 'User is required';
  end if;

  if normalized_note is null then
    raise exception 'Note text is required';
  end if;

  select * into target_annotation
  from public.lesson_text_annotations
  where id = p_annotation_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'Annotation not found';
  end if;

  if target_annotation.note_id is null then
    insert into public.notes (user_id, title, tags, category, content)
    values (
      p_user_id,
      left('Ghi chú: ' || target_annotation.selected_text, 120),
      array['annotation'],
      'general',
      jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(
          jsonb_build_object(
            'type', 'paragraph',
            'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', normalized_note))
          )
        )
      )
    )
    returning id into target_note_id;

    insert into public.lesson_note_links (
      user_id,
      note_id,
      target_type,
      target_key,
      relation_type
    )
    values (
      p_user_id,
      target_note_id,
      'hanzihome_lesson',
      target_annotation.lesson_id,
      'annotation'
    );

    update public.lesson_text_annotations
    set note_id = target_note_id, updated_at = now()
    where id = target_annotation.id;
  else
    target_note_id := target_annotation.note_id;
    update public.notes
    set
      content = jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(
          jsonb_build_object(
            'type', 'paragraph',
            'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', normalized_note))
          )
        )
      ),
      updated_at = now()
    where id = target_note_id and user_id = p_user_id;
  end if;

  return target_note_id;
end;
$$;

create or replace function public.hanzihome_delete_lesson_text_annotation_as_server(
  p_user_id uuid,
  p_annotation_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_note_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role is required';
  end if;

  if p_user_id is null then
    raise exception 'User is required';
  end if;

  select note_id into target_note_id
  from public.lesson_text_annotations
  where id = p_annotation_id and user_id = p_user_id
  for update;

  if not found then
    return false;
  end if;

  if target_note_id is not null then
    delete from public.notes where id = target_note_id and user_id = p_user_id;
  else
    delete from public.lesson_text_annotations
    where id = p_annotation_id and user_id = p_user_id;
  end if;

  return true;
end;
$$;

revoke all on function public.hanzihome_create_lesson_text_annotation_as_server(uuid, text, text, text, integer, integer, text, text, text, text)
from public, anon, authenticated;
revoke all on function public.hanzihome_update_lesson_text_annotation_note_as_server(uuid, uuid, text)
from public, anon, authenticated;
revoke all on function public.hanzihome_delete_lesson_text_annotation_as_server(uuid, uuid)
from public, anon, authenticated;

grant execute on function public.hanzihome_create_lesson_text_annotation_as_server(uuid, text, text, text, integer, integer, text, text, text, text)
to service_role;
grant execute on function public.hanzihome_update_lesson_text_annotation_note_as_server(uuid, uuid, text)
to service_role;
grant execute on function public.hanzihome_delete_lesson_text_annotation_as_server(uuid, uuid)
to service_role;

revoke select, insert, update, delete on table public.lesson_text_annotations from authenticated;
revoke execute on function public.create_lesson_text_annotation(text, text, text, integer, integer, text, text, text, text)
from authenticated;
revoke execute on function public.update_lesson_text_annotation_note(uuid, text)
from authenticated;
revoke execute on function public.delete_lesson_text_annotation(uuid)
from authenticated;

comment on table public.lesson_text_annotations is
  'User-owned highlights anchored to stable HanziHome lesson text nodes; accessed through the authenticated HanziHome BFF.';

commit;
