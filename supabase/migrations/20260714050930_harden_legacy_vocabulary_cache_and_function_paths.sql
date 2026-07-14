begin;

-- `vocabularies` is a shared legacy dictionary cache, so row ownership cannot
-- express its write contract. Add the narrow authenticated RPC first; direct
-- table writes are revoked only after the RPC client is deployed.
create or replace function public.upsert_legacy_vocabulary_cache(
  p_hanzi text,
  p_pinyin text default null,
  p_sino_vietnamese text default null,
  p_meaning text default null,
  p_analysis jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_hanzi text := btrim(p_hanzi);
  vocabulary_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if normalized_hanzi = '' or char_length(normalized_hanzi) > 32 then
    raise exception 'Invalid Hanzi cache key' using errcode = '22023';
  end if;

  if char_length(coalesce(p_pinyin, '')) > 512
    or char_length(coalesce(p_sino_vietnamese, '')) > 512
    or char_length(coalesce(p_meaning, '')) > 4000
    or jsonb_typeof(coalesce(p_analysis, '{}'::jsonb)) <> 'object'
    or pg_column_size(coalesce(p_analysis, '{}'::jsonb)) > 1048576
  then
    raise exception 'Invalid vocabulary cache payload' using errcode = '22023';
  end if;

  insert into public.vocabularies (
    hanzi,
    pinyin,
    sino_vietnamese,
    meaning,
    analysis,
    ai_analysis
  )
  values (
    normalized_hanzi,
    nullif(btrim(p_pinyin), ''),
    nullif(btrim(p_sino_vietnamese), ''),
    nullif(btrim(p_meaning), ''),
    coalesce(p_analysis, '{}'::jsonb),
    coalesce(p_analysis, '{}'::jsonb)
  )
  on conflict (hanzi) do update set
    pinyin = excluded.pinyin,
    sino_vietnamese = excluded.sino_vietnamese,
    meaning = excluded.meaning,
    analysis = excluded.analysis,
    ai_analysis = excluded.ai_analysis
  returning id into vocabulary_id;

  return vocabulary_id;
end;
$$;

revoke all on function public.upsert_legacy_vocabulary_cache(text, text, text, text, jsonb)
  from public, anon;
grant execute on function public.upsert_legacy_vocabulary_cache(text, text, text, text, jsonb)
  to authenticated, service_role;

-- Qualify the only user-defined function call before locking the trigger
-- function's search path.
create or replace function public.set_note_short_id()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  new_short_id text;
  collision boolean;
begin
  if new.short_id is null then
    collision := true;
    while collision loop
      new_short_id := public.generate_note_short_id();
      collision := exists(
        select 1
        from public.notes
        where short_id = new_short_id
      );
    end loop;
    new.short_id := new_short_id;
  end if;
  return new;
end;
$$;

alter function public.handle_new_user() set search_path = '';
alter function public.generate_note_short_id() set search_path = '';
alter function public.set_hanzihome_updated_at() set search_path = '';
alter function public.set_hanzihome_memory_tips_updated_at() set search_path = '';
alter function public.set_hanzihome_html_artifacts_updated_at() set search_path = '';
alter function public.set_hanzihome_html_artifact_folders_updated_at() set search_path = '';
alter function public.set_hanzihome_html_artifact_runtime_states_updated_at() set search_path = '';

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.generate_note_short_id() from public, anon, authenticated;
revoke all on function public.set_note_short_id() from public, anon, authenticated;
revoke all on function public.set_hanzihome_updated_at() from public, anon, authenticated;
revoke all on function public.set_hanzihome_memory_tips_updated_at() from public, anon, authenticated;
revoke all on function public.set_hanzihome_html_artifacts_updated_at() from public, anon, authenticated;
revoke all on function public.set_hanzihome_html_artifact_folders_updated_at()
  from public, anon, authenticated;
revoke all on function public.set_hanzihome_html_artifact_runtime_states_updated_at()
  from public, anon, authenticated;

commit;
