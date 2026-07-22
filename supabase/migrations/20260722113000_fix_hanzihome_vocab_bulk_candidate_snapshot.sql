begin;

create or replace function public.hanzihome_mutate_vocab_child_bulk(
  p_entity_type text,
  p_scope_type text,
  p_scope_id text,
  p_operation text,
  p_expected_count bigint,
  p_expected_fingerprint text,
  p_reason text,
  p_section_keys text[] default null,
  p_ids text[] default null,
  p_query text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_deleted boolean := p_operation in ('restore', 'purge');
  v_target_ids text[] := array[]::text[];
  v_actual_count bigint;
  v_actual_fingerprint text;
  v_has_forbidden_personal boolean;
  v_changed bigint;
begin
  if v_actor is null or not exists (
    select 1 from public.hanzihome_content_editors where user_id = v_actor
  ) then
    raise exception using errcode = '42501', message = 'HanziHome content editor access required';
  end if;
  if p_operation not in ('soft_delete', 'restore', 'purge') then
    raise exception using errcode = '22023', message = 'Unsupported vocabulary bulk operation';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception using errcode = '22023', message = 'A reason is required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hanzihome-vocab-bulk:' || p_entity_type || ':' || p_scope_type || ':' || p_scope_id, 0));

  select
    coalesce(array_agg(candidate.id order by candidate.id), array[]::text[]),
    count(*),
    md5(coalesce(string_agg(candidate.id || ':' || candidate.updated_at::text || ':' || coalesce(candidate.deleted_at::text, ''), '|' order by candidate.id), '')),
    coalesce(bool_or(
      candidate.owner_id is not null
      and not (p_scope_type = 'lesson' and p_ids is not null and candidate.owner_id = v_actor)
    ), false)
  into v_target_ids, v_actual_count, v_actual_fingerprint, v_has_forbidden_personal
  from public.hanzihome_vocab_child_candidates(
    p_entity_type, p_scope_type, p_scope_id, v_deleted, p_section_keys, p_ids, p_query
  ) candidate;

  if v_actual_count <> p_expected_count or v_actual_fingerprint is distinct from p_expected_fingerprint then
    raise exception using errcode = '40001', message = 'Vocabulary bulk selection changed after preview';
  end if;
  if v_has_forbidden_personal then
    raise exception using errcode = '42501', message = 'Personal vocabulary rows require explicit IDs in the current lesson';
  end if;

  if p_entity_type = 'vocab_detail_section' then
    if p_operation = 'soft_delete' then
      update public.hanzihome_vocab_detail_sections
      set deleted_at = now(), deleted_by = v_actor, updated_at = now()
      where id = any(v_target_ids);
    elsif p_operation = 'restore' then
      update public.hanzihome_vocab_detail_sections
      set deleted_at = null, deleted_by = null, updated_at = now()
      where id = any(v_target_ids) and deleted_at is not null;
    else
      delete from public.hanzihome_vocab_detail_sections
      where id = any(v_target_ids) and deleted_at is not null;
    end if;
  else
    if p_operation = 'soft_delete' then
      update public.hanzihome_vocab_examples
      set deleted_at = now(), deleted_by = v_actor, updated_at = now()
      where id = any(v_target_ids);
    elsif p_operation = 'restore' then
      update public.hanzihome_vocab_examples
      set deleted_at = null, deleted_by = null, updated_at = now()
      where id = any(v_target_ids) and deleted_at is not null;
    else
      delete from public.hanzihome_vocab_examples
      where id = any(v_target_ids) and deleted_at is not null;
    end if;
  end if;

  get diagnostics v_changed = row_count;
  if v_changed <> p_expected_count then
    raise exception using errcode = '40001', message = 'Vocabulary bulk mutation count changed';
  end if;

  insert into public.hanzihome_content_audit_log (
    actor_id, operation, entity_type, entity_id, parent_entity_type, parent_entity_id, before_data, after_data, reason
  ) values (
    v_actor,
    case when p_operation = 'restore' then 'restore' else 'delete' end,
    p_entity_type || '_bulk',
    p_scope_type || ':' || p_scope_id,
    p_scope_type,
    p_scope_id,
    jsonb_build_object('count', p_expected_count, 'fingerprint', p_expected_fingerprint, 'filter', jsonb_build_object('sectionKeys', p_section_keys, 'ids', p_ids, 'query', p_query)),
    jsonb_build_object('operation', p_operation, 'count', v_changed),
    trim(p_reason)
  );

  return jsonb_build_object('operation', p_operation, 'changedCount', v_changed);
end;
$$;

revoke all on function public.hanzihome_mutate_vocab_child_bulk(text,text,text,text,bigint,text,text,text[],text[],text) from public, anon;
grant execute on function public.hanzihome_mutate_vocab_child_bulk(text,text,text,text,bigint,text,text,text[],text[],text) to authenticated;

commit;
