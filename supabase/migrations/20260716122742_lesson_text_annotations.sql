create table public.lesson_text_annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null references public.hanzihome_lessons(id) on delete cascade,
  node_type text not null,
  node_id text not null,
  start_offset integer not null check (start_offset >= 0),
  end_offset integer not null check (end_offset > start_offset),
  selected_text text not null check (length(btrim(selected_text)) > 0),
  prefix_text text not null default '',
  suffix_text text not null default '',
  tone text not null default 'focus' check (tone = 'focus'),
  note_id uuid unique references public.notes(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id, node_type, node_id, start_offset, end_offset)
);

create index lesson_text_annotations_lesson_idx
  on public.lesson_text_annotations (user_id, lesson_id, node_type, node_id);

alter table public.lesson_text_annotations enable row level security;

revoke all on table public.lesson_text_annotations from anon, authenticated;
grant select, insert, update, delete on table public.lesson_text_annotations to authenticated;

create policy "Users can view own lesson text annotations"
on public.lesson_text_annotations
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own lesson text annotations"
on public.lesson_text_annotations
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own lesson text annotations"
on public.lesson_text_annotations
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own lesson text annotations"
on public.lesson_text_annotations
for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.create_lesson_text_annotation(
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
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  created_annotation_id uuid;
  created_note_id uuid;
  normalized_note text := nullif(btrim(p_note_text), '');
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if normalized_note is not null then
    insert into public.notes (user_id, title, tags, category, content)
    values (
      current_user_id,
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
      current_user_id,
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
    current_user_id,
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

create or replace function public.update_lesson_text_annotation_note(
  p_annotation_id uuid,
  p_note_text text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_annotation public.lesson_text_annotations%rowtype;
  target_note_id uuid;
  normalized_note text := nullif(btrim(p_note_text), '');
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if normalized_note is null then
    raise exception 'Note text is required';
  end if;

  select * into target_annotation
  from public.lesson_text_annotations
  where id = p_annotation_id and user_id = current_user_id
  for update;

  if not found then
    raise exception 'Annotation not found';
  end if;

  if target_annotation.note_id is null then
    insert into public.notes (user_id, title, tags, category, content)
    values (
      current_user_id,
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
      current_user_id,
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
    where id = target_note_id and user_id = current_user_id;
  end if;

  return target_note_id;
end;
$$;

create or replace function public.delete_lesson_text_annotation(p_annotation_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_note_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select note_id into target_note_id
  from public.lesson_text_annotations
  where id = p_annotation_id and user_id = current_user_id
  for update;

  if not found then
    return false;
  end if;

  if target_note_id is not null then
    delete from public.notes where id = target_note_id and user_id = current_user_id;
  else
    delete from public.lesson_text_annotations
    where id = p_annotation_id and user_id = current_user_id;
  end if;

  return true;
end;
$$;

revoke all on function public.create_lesson_text_annotation(text, text, text, integer, integer, text, text, text, text) from public, anon;
revoke all on function public.update_lesson_text_annotation_note(uuid, text) from public, anon;
revoke all on function public.delete_lesson_text_annotation(uuid) from public, anon;

grant execute on function public.create_lesson_text_annotation(text, text, text, integer, integer, text, text, text, text) to authenticated;
grant execute on function public.update_lesson_text_annotation_note(uuid, text) to authenticated;
grant execute on function public.delete_lesson_text_annotation(uuid) to authenticated;

comment on table public.lesson_text_annotations
  is 'User-owned highlights anchored to stable HanziHome lesson text nodes.';
