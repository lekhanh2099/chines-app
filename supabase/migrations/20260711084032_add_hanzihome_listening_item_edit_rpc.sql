create or replace function public.hanzihome_update_listening_item_as_user(
  p_entity_id text,
  p_expected_updated_at timestamptz,
  p_changes jsonb,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_before jsonb;
  v_after jsonb;
  v_invalid_keys text[];
begin
  if v_actor_id is null then
    raise exception using errcode = '28000', message = 'Authenticated actor is required';
  end if;

  if not (select public.can_edit_hanzihome_content()) then
    raise exception using errcode = '42501', message = 'HanziHome editor role is required';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception using errcode = '22023', message = 'Mutation reason is required';
  end if;

  if p_expected_updated_at is null then
    raise exception using errcode = '22023', message = 'expectedUpdatedAt is required';
  end if;

  if jsonb_typeof(coalesce(p_changes, '{}'::jsonb)) <> 'object'
     or p_changes = '{}'::jsonb then
    raise exception using errcode = '22023', message = 'Listening item changes must be a non-empty object';
  end if;

  select array_agg(change_key)
  into v_invalid_keys
  from jsonb_object_keys(p_changes) as change_key
  where not (change_key = any(array[
    'prompt_zh',
    'transcript',
    'options',
    'answer',
    'explanation_vi',
    'metadata'
  ]));

  if coalesce(array_length(v_invalid_keys, 1), 0) > 0 then
    raise exception using
      errcode = '22023',
      message = format('Unsupported listening item fields: %s', array_to_string(v_invalid_keys, ', '));
  end if;

  select to_jsonb(item)
  into v_before
  from public.hanzihome_listening_items item
  where item.id = p_entity_id
    and item.deleted_at is null
  for update;

  if v_before is null then
    raise exception using errcode = 'P0002', message = 'Listening item not found';
  end if;

  if (v_before ->> 'updated_at')::timestamptz is distinct from p_expected_updated_at then
    raise exception using errcode = '40001', message = 'Listening item changed since it was loaded';
  end if;

  update public.hanzihome_listening_items item
  set
    prompt_zh = case
      when p_changes ? 'prompt_zh' then p_changes ->> 'prompt_zh'
      else item.prompt_zh
    end,
    transcript = case
      when p_changes ? 'transcript' then p_changes -> 'transcript'
      else item.transcript
    end,
    options = case
      when p_changes ? 'options' then p_changes -> 'options'
      else item.options
    end,
    answer = case
      when p_changes ? 'answer' then p_changes -> 'answer'
      else item.answer
    end,
    explanation_vi = case
      when p_changes ? 'explanation_vi' then p_changes ->> 'explanation_vi'
      else item.explanation_vi
    end,
    metadata = case
      when p_changes ? 'metadata' then p_changes -> 'metadata'
      else item.metadata
    end
  where item.id = p_entity_id
  returning to_jsonb(item) into v_after;

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
  )
  values (
    v_actor_id,
    'update',
    'listening_item',
    p_entity_id,
    'lesson',
    v_before ->> 'lesson_id',
    v_before,
    v_after,
    p_reason
  );

  return jsonb_build_object('item', v_after);
end;
$$;

revoke all on function public.hanzihome_update_listening_item_as_user(
  text,
  timestamptz,
  jsonb,
  text
) from public, anon, authenticated;

grant execute on function public.hanzihome_update_listening_item_as_user(
  text,
  timestamptz,
  jsonb,
  text
) to authenticated;

comment on function public.hanzihome_update_listening_item_as_user(
  text,
  timestamptz,
  jsonb,
  text
) is
  'Atomically updates one listening item for an editor/admin session and records a HanziHome content audit row.';
