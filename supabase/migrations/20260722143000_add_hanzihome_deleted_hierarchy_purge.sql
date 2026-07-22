begin;

create or replace function public.hanzihome_purge_deleted_content_as_user(
  p_entity_type text,
  p_entity_id text,
  p_expected_updated_at timestamptz,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_table_name text;
  v_parent_entity_type text;
  v_parent_entity_id text;
  v_before jsonb;
  v_deleted jsonb;
  v_current_updated_at timestamptz;
begin
  if v_actor_id is null then
    raise exception using errcode = '28000', message = 'Authenticated actor is required';
  end if;

  if not (select public.can_edit_hanzihome_content()) then
    raise exception using errcode = '42501', message = 'HanziHome editor role is required';
  end if;

  if p_entity_id is null or length(trim(p_entity_id)) = 0 then
    raise exception using errcode = '22023', message = 'Entity id is required';
  end if;

  if p_expected_updated_at is null then
    raise exception using errcode = '22023', message = 'Expected updated_at is required';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception using errcode = '22023', message = 'Purge reason is required';
  end if;

  case p_entity_type
    when 'course' then
      v_table_name := 'hanzihome_courses';
    when 'book' then
      v_table_name := 'hanzihome_course_books';
      v_parent_entity_type := 'course';
    when 'lesson' then
      v_table_name := 'hanzihome_lessons';
      v_parent_entity_type := 'book';
    else
      raise exception using errcode = '22023', message = 'Only deleted courses, books, and lessons can be purged';
  end case;

  execute format(
    'select to_jsonb(target), target.updated_at from public.%I target where target.id::text = $1 for update',
    v_table_name
  )
  using p_entity_id
  into v_before, v_current_updated_at;

  if v_before is null then
    raise exception using errcode = 'P0002', message = 'HanziHome entity not found';
  end if;

  if v_before ->> 'deleted_at' is null then
    raise exception using errcode = '22023', message = 'Only soft-deleted content can be purged';
  end if;

  if v_current_updated_at <> p_expected_updated_at then
    raise exception using errcode = '40001', message = 'HanziHome entity changed since it was loaded';
  end if;

  v_parent_entity_id := case p_entity_type
    when 'book' then v_before ->> 'course_id'
    when 'lesson' then v_before ->> 'book_id'
    else null
  end;

  execute format(
    'delete from public.%I where id::text = $1 and deleted_at is not null returning to_jsonb(%I.*)',
    v_table_name,
    v_table_name
  )
  using p_entity_id
  into v_deleted;

  if v_deleted is null then
    raise exception using errcode = '40001', message = 'HanziHome entity changed before it could be purged';
  end if;

  insert into public.hanzihome_content_audit_log (
    actor_id,
    operation,
    entity_type,
    entity_id,
    parent_entity_type,
    parent_entity_id,
    before_data,
    after_data,
    reason
  ) values (
    v_actor_id,
    'delete',
    p_entity_type,
    p_entity_id,
    v_parent_entity_type,
    v_parent_entity_id,
    v_before,
    null,
    'Xóa vĩnh viễn: ' || trim(p_reason)
  );

  return jsonb_build_object(
    'purged', jsonb_build_object(
      'entityType', p_entity_type,
      'entityId', p_entity_id
    )
  );
end;
$$;

revoke all on function public.hanzihome_purge_deleted_content_as_user(
  text, text, timestamptz, text
)
from public, anon, authenticated;

grant execute on function public.hanzihome_purge_deleted_content_as_user(
  text, text, timestamptz, text
)
to authenticated;

comment on function public.hanzihome_purge_deleted_content_as_user(
  text, text, timestamptz, text
) is
  'Permanently deletes one soft-deleted HanziHome course, book, or lesson. Parent foreign keys cascade its canonical subtree. Requires editor/admin role and optimistic concurrency.';

commit;
