begin;

create or replace function public.hanzihome_update_radical_as_user(
  p_entity_id text,
  p_expected_updated_at timestamptz,
  p_changes jsonb default '{}'::jsonb,
  p_reason text default 'Cập nhật bộ thủ HanziHome'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_allowed_columns text[] := array[
    'radical',
    'name_vi',
    'strokes',
    'core_meaning',
    'variants',
    'related_components',
    'recognition',
    'distinguish',
    'groups'
  ];
  v_change_key text;
  v_set_clause text;
  v_before jsonb;
  v_after jsonb;
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
    raise exception using errcode = '22023', message = 'expectedUpdatedAt is required';
  end if;

  if p_changes is null or p_changes = '{}'::jsonb then
    raise exception using errcode = '22023', message = 'Update requires at least one changed field';
  end if;

  for v_change_key in select jsonb_object_keys(p_changes)
  loop
    if not (v_change_key = any(v_allowed_columns)) then
      raise exception using errcode = '22023', message = format('Field %s is not editable for radical', v_change_key);
    end if;
  end loop;

  select to_jsonb(radical_row), radical_row.updated_at
  into v_before, v_current_updated_at
  from public.hanzihome_radicals radical_row
  where radical_row.id = p_entity_id
  for update;

  if v_before is null then
    raise exception using errcode = 'P0002', message = 'HanziHome radical not found';
  end if;

  if v_before ->> 'deleted_at' is not null then
    raise exception using errcode = '22023', message = 'Deleted content must be restored before it can be changed';
  end if;

  if v_current_updated_at <> p_expected_updated_at then
    raise exception using errcode = '40001', message = 'HanziHome radical changed since it was loaded';
  end if;

  select string_agg(
    format('%1$I = patch.%1$I', attribute.attname),
    ', '
  )
  into v_set_clause
  from pg_attribute attribute
  where attribute.attrelid = 'public.hanzihome_radicals'::regclass
    and attribute.attnum > 0
    and not attribute.attisdropped
    and attribute.attname in (select jsonb_object_keys(p_changes));

  if v_set_clause is null then
    raise exception using errcode = '22023', message = 'No editable changes were provided';
  end if;

  execute format(
    'update public.hanzihome_radicals target set %s from jsonb_populate_record(null::public.hanzihome_radicals, $1) patch where target.id = $2 returning to_jsonb(target.*)',
    v_set_clause
  )
  using p_changes, p_entity_id
  into v_after;

  insert into public.hanzihome_content_audit_log (
    actor_id,
    operation,
    entity_type,
    entity_id,
    before_data,
    after_data,
    reason
  ) values (
    v_actor_id,
    'update',
    'radical',
    p_entity_id,
    v_before,
    v_after,
    trim(p_reason)
  );

  return jsonb_build_object('item', v_after);
end;
$$;

revoke all on function public.hanzihome_update_radical_as_user(
  text, timestamptz, jsonb, text
) from public, anon, authenticated;

grant execute on function public.hanzihome_update_radical_as_user(
  text, timestamptz, jsonb, text
) to authenticated;

comment on function public.hanzihome_update_radical_as_user(
  text, timestamptz, jsonb, text
) is
  'Session-authenticated single-row update path for HanziHome radical seed rows. Requires editor/admin role, optimistic concurrency, and writes audit in the same transaction.';

commit;
