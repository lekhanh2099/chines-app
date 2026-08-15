begin;

create table if not exists public.hanzihome_reader_pronunciation_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id text not null references public.hanzihome_reading_documents(id) on delete cascade,
  paragraph_id text not null references public.hanzihome_reading_paragraphs(id) on delete cascade,
  text text not null check (length(btrim(text)) > 0),
  readings text[] not null check (cardinality(readings) > 0),
  scope text not null check (scope in ('character-global', 'phrase', 'sentence-instance')),
  sentence_text text null,
  start_offset integer null check (start_offset is null or start_offset >= 0),
  end_offset integer null check (end_offset is null or end_offset > start_offset),
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hanzihome_reader_pronunciation_override_parent_check
    check (sentence_text is not null or (start_offset is null and end_offset is null)),
  constraint hanzihome_reader_pronunciation_override_document_check
    check (paragraph_id is not null)
);

create index if not exists hanzihome_reader_pronunciation_overrides_lookup_idx
  on public.hanzihome_reader_pronunciation_overrides
  (user_id, document_id, paragraph_id, updated_at desc);

create unique index if not exists hanzihome_reader_pronunciation_overrides_instance_idx
  on public.hanzihome_reader_pronunciation_overrides
  (user_id, document_id, paragraph_id, text, scope, coalesce(start_offset, -1), coalesce(end_offset, -1));

create or replace function public.hanzihome_reader_pronunciation_override_parent_check()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.hanzihome_reading_paragraphs paragraph
    where paragraph.id = new.paragraph_id
      and paragraph.document_id = new.document_id
  ) then
    raise exception 'Reader pronunciation override paragraph does not belong to the document';
  end if;
  if new.scope = 'sentence-instance'
    and (new.sentence_text is null or new.start_offset is null or new.end_offset is null) then
    raise exception 'Sentence-instance pronunciation override requires sentence coordinates';
  end if;
  return new;
end;
$$;

drop trigger if exists hanzihome_reader_pronunciation_override_parent_check
  on public.hanzihome_reader_pronunciation_overrides;
create trigger hanzihome_reader_pronunciation_override_parent_check
before insert or update on public.hanzihome_reader_pronunciation_overrides
for each row execute function public.hanzihome_reader_pronunciation_override_parent_check();

drop trigger if exists hanzihome_reader_pronunciation_overrides_updated_at
  on public.hanzihome_reader_pronunciation_overrides;
create trigger hanzihome_reader_pronunciation_overrides_updated_at
before update on public.hanzihome_reader_pronunciation_overrides
for each row execute function public.hanzihome_studio_touch_updated_at();

alter table public.hanzihome_reader_pronunciation_overrides enable row level security;

create policy "Users can manage own Reader pronunciation overrides"
on public.hanzihome_reader_pronunciation_overrides for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

revoke all on table public.hanzihome_reader_pronunciation_overrides from public, anon;
grant select, insert, update, delete on table public.hanzihome_reader_pronunciation_overrides to authenticated;

create or replace function public.hanzihome_upsert_reader_pronunciation_override(
  p_override_id uuid,
  p_document_id text,
  p_paragraph_id text,
  p_text text,
  p_readings text[],
  p_scope text,
  p_sentence_text text,
  p_start_offset integer,
  p_end_offset integer,
  p_expected_revision integer
)
returns public.hanzihome_reader_pronunciation_overrides
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_row public.hanzihome_reader_pronunciation_overrides;
  next_row public.hanzihome_reader_pronunciation_overrides;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_override_id is null or p_document_id is null or p_paragraph_id is null
    or p_text is null or length(btrim(p_text)) = 0
    or p_readings is null or cardinality(p_readings) = 0
    or p_scope not in ('character-global', 'phrase', 'sentence-instance') then
    raise exception using errcode = '22023', message = 'Reader pronunciation override is invalid';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception using errcode = '22023', message = 'Expected revision cannot be negative';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_override_id::text, 0));
  select * into current_row
  from public.hanzihome_reader_pronunciation_overrides
  where id = p_override_id and user_id = auth.uid()
  for update;

  if not found then
    if p_expected_revision <> 0 then
      raise exception using errcode = '40001', message = 'Reader pronunciation override changed before it was created';
    end if;
    insert into public.hanzihome_reader_pronunciation_overrides (
      id, user_id, document_id, paragraph_id, text, readings, scope,
      sentence_text, start_offset, end_offset, revision
    ) values (
      p_override_id, auth.uid(), p_document_id, p_paragraph_id, p_text, p_readings, p_scope,
      nullif(p_sentence_text, ''),
      case when p_start_offset < 0 then null else p_start_offset end,
      case when p_end_offset < 0 then null else p_end_offset end,
      0
    ) returning * into next_row;
    return next_row;
  end if;

  if current_row.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Reader pronunciation override changed since it was loaded';
  end if;

  update public.hanzihome_reader_pronunciation_overrides
  set document_id = p_document_id,
      paragraph_id = p_paragraph_id,
      text = p_text,
      readings = p_readings,
      scope = p_scope,
      sentence_text = nullif(p_sentence_text, ''),
      start_offset = case when p_start_offset < 0 then null else p_start_offset end,
      end_offset = case when p_end_offset < 0 then null else p_end_offset end,
      revision = current_row.revision + 1
  where id = p_override_id and user_id = auth.uid()
  returning * into next_row;
  return next_row;
end;
$$;

create or replace function public.hanzihome_delete_reader_pronunciation_override(
  p_override_id uuid,
  p_expected_revision integer
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_row public.hanzihome_reader_pronunciation_overrides;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  select * into current_row
  from public.hanzihome_reader_pronunciation_overrides
  where id = p_override_id and user_id = auth.uid()
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Reader pronunciation override not found';
  end if;
  if current_row.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Reader pronunciation override changed since it was loaded';
  end if;
  delete from public.hanzihome_reader_pronunciation_overrides
  where id = p_override_id and user_id = auth.uid();
  return true;
end;
$$;

revoke all on function public.hanzihome_upsert_reader_pronunciation_override(
  uuid, text, text, text, text[], text, text, integer, integer, integer
) from public, anon;
grant execute on function public.hanzihome_upsert_reader_pronunciation_override(
  uuid, text, text, text, text[], text, text, integer, integer, integer
) to authenticated;

revoke all on function public.hanzihome_delete_reader_pronunciation_override(uuid, integer)
from public, anon;
grant execute on function public.hanzihome_delete_reader_pronunciation_override(uuid, integer)
to authenticated;

comment on table public.hanzihome_reader_pronunciation_overrides is
  'New HanziHome Reader pronunciation overrides only; no Studio localStorage or user state is imported.';

commit;
