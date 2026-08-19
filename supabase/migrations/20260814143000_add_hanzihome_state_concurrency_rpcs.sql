begin;

create or replace function public.hanzihome_upsert_reader_progress(
  p_document_id text,
  p_show_pinyin boolean,
  p_show_meaning boolean,
  p_completed boolean,
  p_summary_text text,
  p_answers jsonb,
  p_expected_revision integer
)
returns public.hanzihome_reader_progress
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_row public.hanzihome_reader_progress;
  next_row public.hanzihome_reader_progress;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_document_id is null or length(btrim(p_document_id)) = 0 then
    raise exception using errcode = '22023', message = 'Reader document is required';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception using errcode = '22023', message = 'Expected revision cannot be negative';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception using errcode = '22023', message = 'Reader answers must be an object';
  end if;

  select *
  into current_row
  from public.hanzihome_reader_progress
  where user_id = auth.uid()
    and document_id = p_document_id
  for update;

  if not found then
    if p_expected_revision <> 0 then
      raise exception using errcode = '40001', message = 'Reader progress changed before it was created';
    end if;

    insert into public.hanzihome_reader_progress (
      user_id,
      document_id,
      show_pinyin,
      show_meaning,
      completed,
      summary_text,
      answers,
      revision
    ) values (
      auth.uid(),
      p_document_id,
      p_show_pinyin,
      p_show_meaning,
      p_completed,
      coalesce(p_summary_text, ''),
      p_answers,
      0
    )
    returning * into next_row;
    return next_row;
  end if;

  if current_row.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Reader progress changed since it was loaded';
  end if;

  update public.hanzihome_reader_progress
  set show_pinyin = p_show_pinyin,
      show_meaning = p_show_meaning,
      completed = p_completed,
      summary_text = coalesce(p_summary_text, ''),
      answers = p_answers,
      revision = current_row.revision + 1
  where user_id = auth.uid()
    and document_id = p_document_id
  returning * into next_row;

  return next_row;
end;
$$;

create or replace function public.hanzihome_upsert_personal_learning_state(
  p_node_id text,
  p_state jsonb,
  p_expected_revision integer
)
returns public.hanzihome_personal_learning_state
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_row public.hanzihome_personal_learning_state;
  next_row public.hanzihome_personal_learning_state;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_node_id is null or length(btrim(p_node_id)) = 0 then
    raise exception using errcode = '22023', message = 'Personal learning node is required';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception using errcode = '22023', message = 'Expected revision cannot be negative';
  end if;
  if p_state is null or jsonb_typeof(p_state) <> 'object' then
    raise exception using errcode = '22023', message = 'Personal learning state must be an object';
  end if;

  select *
  into current_row
  from public.hanzihome_personal_learning_state
  where user_id = auth.uid()
    and node_id = p_node_id
  for update;

  if not found then
    if p_expected_revision <> 0 then
      raise exception using errcode = '40001', message = 'Personal learning state changed before it was created';
    end if;

    insert into public.hanzihome_personal_learning_state (user_id, node_id, state, revision)
    values (auth.uid(), p_node_id, p_state, 0)
    returning * into next_row;
    return next_row;
  end if;

  if current_row.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Personal learning state changed since it was loaded';
  end if;

  update public.hanzihome_personal_learning_state
  set state = p_state,
      revision = current_row.revision + 1
  where user_id = auth.uid()
    and node_id = p_node_id
  returning * into next_row;

  return next_row;
end;
$$;

create or replace function public.hanzihome_upsert_daily_reading_state(
  p_published_date date,
  p_state jsonb,
  p_expected_revision integer
)
returns public.hanzihome_daily_reading_state
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_row public.hanzihome_daily_reading_state;
  next_row public.hanzihome_daily_reading_state;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_published_date is null then
    raise exception using errcode = '22023', message = 'Published date is required';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception using errcode = '22023', message = 'Expected revision cannot be negative';
  end if;
  if p_state is null or jsonb_typeof(p_state) <> 'object' then
    raise exception using errcode = '22023', message = 'Daily reading state must be an object';
  end if;

  select *
  into current_row
  from public.hanzihome_daily_reading_state
  where user_id = auth.uid()
    and published_date = p_published_date
  for update;

  if not found then
    if p_expected_revision <> 0 then
      raise exception using errcode = '40001', message = 'Daily reading state changed before it was created';
    end if;

    insert into public.hanzihome_daily_reading_state (user_id, published_date, state, revision)
    values (auth.uid(), p_published_date, p_state, 0)
    returning * into next_row;
    return next_row;
  end if;

  if current_row.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Daily reading state changed since it was loaded';
  end if;

  update public.hanzihome_daily_reading_state
  set state = p_state,
      revision = current_row.revision + 1
  where user_id = auth.uid()
    and published_date = p_published_date
  returning * into next_row;

  return next_row;
end;
$$;

revoke all on function public.hanzihome_upsert_reader_progress(text, boolean, boolean, boolean, text, jsonb, integer) from public, anon;
revoke all on function public.hanzihome_upsert_personal_learning_state(text, jsonb, integer) from public, anon;
revoke all on function public.hanzihome_upsert_daily_reading_state(date, jsonb, integer) from public, anon;

grant execute on function public.hanzihome_upsert_reader_progress(text, boolean, boolean, boolean, text, jsonb, integer) to authenticated;
grant execute on function public.hanzihome_upsert_personal_learning_state(text, jsonb, integer) to authenticated;
grant execute on function public.hanzihome_upsert_daily_reading_state(date, jsonb, integer) to authenticated;

commit;
