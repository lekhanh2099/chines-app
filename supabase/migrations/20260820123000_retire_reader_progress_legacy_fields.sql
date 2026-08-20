begin;

-- The active Reader route now persists only Reader-owned state: completion,
-- exercise answers, and optimistic revision. Keep the old RPC signature as a
-- temporary deployed-client adapter, but make its legacy display/summary
-- arguments inert before removing the corresponding columns.
drop function if exists public.hanzihome_upsert_reader_progress(
  text,
  boolean,
  boolean,
  boolean,
  text,
  jsonb,
  integer
);

alter table public.hanzihome_reader_progress
  drop column if exists show_pinyin,
  drop column if exists show_meaning,
  drop column if exists summary_text;

create function public.hanzihome_upsert_reader_progress(
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

  -- Deprecated parameters are intentionally ignored. They remain only so an
  -- already-deployed pre-cutover client cannot rewrite global reading prefs.
  perform p_show_pinyin, p_show_meaning, p_summary_text;

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
      completed,
      answers,
      revision
    ) values (
      auth.uid(),
      p_document_id,
      p_completed,
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
  set completed = p_completed,
      answers = p_answers,
      revision = current_row.revision + 1
  where user_id = auth.uid()
    and document_id = p_document_id
  returning * into next_row;

  return next_row;
end;
$$;

comment on function public.hanzihome_upsert_reader_progress(
  text,
  boolean,
  boolean,
  boolean,
  text,
  jsonb,
  integer
) is
  'Deprecated compatibility adapter for pre-cutover Reader clients. Display and summary parameters are ignored; active Reader writes use only completed, answers, and revision.';

comment on table public.hanzihome_reader_progress is
  'User-owned Reader progress: explicit completion plus exercise answers and optimistic revision. Reading display preferences belong to user_learning_state.settings.';

commit;
