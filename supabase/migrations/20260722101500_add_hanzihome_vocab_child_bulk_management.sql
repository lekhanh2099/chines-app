begin;

create or replace function public.hanzihome_vocab_child_candidates(
  p_entity_type text,
  p_scope_type text,
  p_scope_id text,
  p_deleted boolean default false,
  p_section_keys text[] default null,
  p_ids text[] default null,
  p_query text default null
)
returns table (
  id text,
  vocab_item_id text,
  lesson_id text,
  course_id text,
  book_id text,
  owner_id uuid,
  source text,
  word text,
  label text,
  section_key text,
  updated_at timestamptz,
  deleted_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_entity_type not in ('vocab_detail_section', 'vocab_example') then
    raise exception using errcode = '22023', message = 'Unsupported vocabulary child entity';
  end if;
  if p_scope_type not in ('lesson', 'book', 'course') then
    raise exception using errcode = '22023', message = 'Unsupported vocabulary bulk scope';
  end if;

  if p_entity_type = 'vocab_detail_section' then
    return query
    select d.id, d.vocab_item_id, d.lesson_id, v.course_id, v.book_id, d.owner_id, d.source, v.word,
      coalesce(nullif(d.title, ''), d.section_key), d.section_key, d.updated_at, d.deleted_at
    from public.hanzihome_vocab_detail_sections d
    join public.hanzihome_vocab_items v on v.id = d.vocab_item_id and v.deleted_at is null
    where (d.deleted_at is not null) = p_deleted
      and case p_scope_type
        when 'lesson' then d.lesson_id = p_scope_id
        when 'book' then v.book_id = p_scope_id
        else v.course_id = p_scope_id
      end
      and (
        p_section_keys is null
        or d.section_key = any(p_section_keys)
        or ('custom:' = any(p_section_keys) and d.section_key like 'custom:%')
      )
      and (p_ids is null or d.id = any(p_ids))
      and (coalesce(trim(p_query), '') = '' or concat_ws(' ', d.title, d.section_key, array_to_string(d.lines, ' ')) ilike '%' || trim(p_query) || '%')
      and (d.owner_id is null or (p_scope_type = 'lesson' and p_ids is not null and d.owner_id = auth.uid()));
  else
    return query
    select e.id, e.vocab_item_id, e.lesson_id, v.course_id, v.book_id, e.owner_id, e.source, v.word,
      e.zh, null::text, e.updated_at, e.deleted_at
    from public.hanzihome_vocab_examples e
    join public.hanzihome_vocab_items v on v.id = e.vocab_item_id and v.deleted_at is null
    where (e.deleted_at is not null) = p_deleted
      and case p_scope_type
        when 'lesson' then e.lesson_id = p_scope_id
        when 'book' then v.book_id = p_scope_id
        else v.course_id = p_scope_id
      end
      and (p_ids is null or e.id = any(p_ids))
      and (coalesce(trim(p_query), '') = '' or concat_ws(' ', e.zh, e.pinyin, e.vi, e.note) ilike '%' || trim(p_query) || '%')
      and (e.owner_id is null or (p_scope_type = 'lesson' and p_ids is not null and e.owner_id = auth.uid()));
  end if;
end;
$$;

revoke all on function public.hanzihome_vocab_child_candidates(text,text,text,boolean,text[],text[],text) from public, anon, authenticated;

create or replace function public.hanzihome_list_vocab_children(
  p_entity_type text,
  p_scope_type text,
  p_scope_id text,
  p_deleted boolean default false,
  p_section_keys text[] default null,
  p_query text default null,
  p_page integer default 1,
  p_page_size integer default 25
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_offset integer;
  v_result jsonb;
begin
  if v_actor is null or not exists (
    select 1 from public.hanzihome_content_editors where user_id = v_actor
  ) then
    raise exception using errcode = '42501', message = 'HanziHome content editor access required';
  end if;
  if p_page < 1 or p_page_size < 1 or p_page_size > 100 then
    raise exception using errcode = '22023', message = 'Invalid vocabulary child page';
  end if;

  v_offset := (p_page - 1) * p_page_size;
  with candidates as materialized (
    select * from public.hanzihome_vocab_child_candidates(
      p_entity_type, p_scope_type, p_scope_id, p_deleted, p_section_keys, null, p_query
    )
  ), page_rows as (
    select id, vocab_item_id as "vocabItemId", lesson_id as "lessonId", word, label,
      section_key as "sectionKey", owner_id as "ownerId", source, deleted_at as "deletedAt"
    from candidates
    order by word, label, id
    offset v_offset limit p_page_size
  )
  select pg_catalog.jsonb_build_object(
    'page', p_page,
    'pageSize', p_page_size,
    'total', (select pg_catalog.count(*) from candidates),
    'rows', coalesce((select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(page_row)) from page_rows page_row), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.hanzihome_preview_vocab_child_bulk(
  p_entity_type text,
  p_scope_type text,
  p_scope_id text,
  p_deleted boolean default false,
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
  v_result jsonb;
begin
  if v_actor is null or not exists (
    select 1 from public.hanzihome_content_editors where user_id = v_actor
  ) then
    raise exception using errcode = '42501', message = 'HanziHome content editor access required';
  end if;

  with candidates as (
    select * from public.hanzihome_vocab_child_candidates(
      p_entity_type, p_scope_type, p_scope_id, p_deleted, p_section_keys, p_ids, p_query
    )
  ), summary as (
    select count(*)::bigint as row_count,
      count(distinct vocab_item_id)::bigint as word_count,
      md5(coalesce(string_agg(id || ':' || updated_at::text || ':' || coalesce(deleted_at::text, ''), '|' order by id), '')) as fingerprint
    from candidates
  )
  select jsonb_build_object(
    'entityType', p_entity_type,
    'scopeType', p_scope_type,
    'scopeId', p_scope_id,
    'deleted', p_deleted,
    'rowCount', summary.row_count,
    'wordCount', summary.word_count,
    'fingerprint', summary.fingerprint,
    'ownership', coalesce((select jsonb_object_agg(key, value) from (
      select case when owner_id is null then 'shared' else 'personal' end as key, count(*) as value
      from candidates group by 1
    ) ownership_rows), '{}'::jsonb),
    'breakdown', coalesce((select jsonb_object_agg(key, value) from (
      select coalesce(section_key, 'example') as key, count(*) as value
      from candidates group by 1
    ) breakdown_rows), '{}'::jsonb),
    'sample', coalesce((select jsonb_agg(sample_row) from (
      select id, vocab_item_id as "vocabItemId", lesson_id as "lessonId", label, section_key as "sectionKey", source
      from candidates order by id limit 12
    ) sample_row), '[]'::jsonb)
  ) into v_result
  from summary;

  return v_result;
end;
$$;

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
  v_actual_count bigint;
  v_actual_fingerprint text;
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
  create temporary table target_vocab_children on commit drop as
    select * from public.hanzihome_vocab_child_candidates(
      p_entity_type, p_scope_type, p_scope_id, v_deleted, p_section_keys, p_ids, p_query
    );

  select count(*), md5(coalesce(string_agg(id || ':' || updated_at::text || ':' || coalesce(deleted_at::text, ''), '|' order by id), ''))
    into v_actual_count, v_actual_fingerprint from target_vocab_children;
  if v_actual_count <> p_expected_count or v_actual_fingerprint is distinct from p_expected_fingerprint then
    raise exception using errcode = '40001', message = 'Vocabulary bulk selection changed after preview';
  end if;
  if exists (
    select 1 from target_vocab_children
    where owner_id is not null
      and not (p_scope_type = 'lesson' and p_ids is not null and owner_id = v_actor)
  ) then
    raise exception using errcode = '42501', message = 'Personal vocabulary rows require explicit IDs in the current lesson';
  end if;

  if p_entity_type = 'vocab_detail_section' then
    if p_operation = 'soft_delete' then
      update public.hanzihome_vocab_detail_sections set deleted_at = now(), deleted_by = v_actor, updated_at = now()
      where id in (select id from target_vocab_children);
    elsif p_operation = 'restore' then
      update public.hanzihome_vocab_detail_sections set deleted_at = null, deleted_by = null, updated_at = now()
      where id in (select id from target_vocab_children) and deleted_at is not null;
    else
      delete from public.hanzihome_vocab_detail_sections
      where id in (select id from target_vocab_children) and deleted_at is not null;
    end if;
  else
    if p_operation = 'soft_delete' then
      update public.hanzihome_vocab_examples set deleted_at = now(), deleted_by = v_actor, updated_at = now()
      where id in (select id from target_vocab_children);
    elsif p_operation = 'restore' then
      update public.hanzihome_vocab_examples set deleted_at = null, deleted_by = null, updated_at = now()
      where id in (select id from target_vocab_children) and deleted_at is not null;
    else
      delete from public.hanzihome_vocab_examples
      where id in (select id from target_vocab_children) and deleted_at is not null;
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

revoke all on function public.hanzihome_preview_vocab_child_bulk(text,text,text,boolean,text[],text[],text) from public, anon;
revoke all on function public.hanzihome_mutate_vocab_child_bulk(text,text,text,text,bigint,text,text,text[],text[],text) from public, anon;
revoke all on function public.hanzihome_list_vocab_children(text,text,text,boolean,text[],text,integer,integer) from public, anon;
grant execute on function public.hanzihome_preview_vocab_child_bulk(text,text,text,boolean,text[],text[],text) to authenticated;
grant execute on function public.hanzihome_mutate_vocab_child_bulk(text,text,text,text,bigint,text,text,text[],text[],text) to authenticated;
grant execute on function public.hanzihome_list_vocab_children(text,text,text,boolean,text[],text,integer,integer) to authenticated;

commit;
