begin;

-- Remove the abandoned database-content import path. The reviewed package is
-- checked into the app and is never written through a Supabase seed RPC.
drop function if exists public.hanzihome_import_studio_seed_package(jsonb);
drop table if exists public.hanzihome_studio_import_runs;

-- Hanzi Studio content is served from the checked-in static JSON package.
-- User-owned state must therefore keep stable content IDs without requiring
-- a matching row in the optional normalized content contract tables.
alter table if exists public.hanzihome_reader_progress
  drop constraint if exists hanzihome_reader_progress_document_id_fkey;

alter table if exists public.hanzihome_reader_annotations
  drop constraint if exists hanzihome_reader_annotations_document_id_fkey,
  drop constraint if exists hanzihome_reader_annotations_paragraph_id_fkey,
  drop constraint if exists hanzihome_reader_annotations_asset_id_fkey;

alter table if exists public.hanzihome_reader_pronunciation_overrides
  drop constraint if exists hanzihome_reader_pronunciation_overrides_document_id_fkey,
  drop constraint if exists hanzihome_reader_pronunciation_overrides_paragraph_id_fkey;

alter table if exists public.hanzihome_pdf_annotations
  drop constraint if exists hanzihome_pdf_annotations_asset_id_fkey;

drop trigger if exists hanzihome_reader_annotations_parent_check
  on public.hanzihome_reader_annotations;

drop trigger if exists hanzihome_reader_pronunciation_override_parent_check
  on public.hanzihome_reader_pronunciation_overrides;

create or replace function public.hanzihome_upsert_pdf_annotation(
  p_asset_id text,
  p_page_number integer,
  p_payload jsonb,
  p_expected_revision integer
)
returns public.hanzihome_pdf_annotations
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_row public.hanzihome_pdf_annotations;
  next_row public.hanzihome_pdf_annotations;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_asset_id is null or length(btrim(p_asset_id)) = 0 then
    raise exception using errcode = '22023', message = 'PDF asset is required';
  end if;
  if p_page_number is null or p_page_number <= 0 then
    raise exception using errcode = '22023', message = 'PDF page must be positive';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception using errcode = '22023', message = 'Expected revision cannot be negative';
  end if;
  if p_payload is null
    or jsonb_typeof(p_payload) <> 'object'
    or jsonb_typeof(p_payload->'strokes') <> 'array' then
    raise exception using errcode = '22023', message = 'PDF annotation payload is invalid';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    p_asset_id || ':' || p_page_number::text || ':' || auth.uid()::text,
    0
  ));

  select *
  into current_row
  from public.hanzihome_pdf_annotations
  where user_id = auth.uid()
    and asset_id = p_asset_id
    and page_number = p_page_number
  for update;

  if not found then
    if p_expected_revision <> 0 then
      raise exception using errcode = '40001', message = 'PDF annotation changed before it was created';
    end if;
    insert into public.hanzihome_pdf_annotations (
      user_id, asset_id, page_number, payload, revision
    )
    values (auth.uid(), p_asset_id, p_page_number, p_payload, 0)
    returning * into next_row;
    return next_row;
  end if;

  if current_row.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'PDF annotation revision conflict';
  end if;

  update public.hanzihome_pdf_annotations
  set payload = p_payload,
      revision = current_row.revision + 1
  where id = current_row.id
  returning * into next_row;
  return next_row;
end;
$$;

comment on table public.hanzihome_reader_progress is
  'HanziHome-owned progress keyed by static Reader document ID; no Studio progress is imported.';

comment on table public.hanzihome_reader_annotations is
  'HanziHome-owned Reader annotations keyed by static document, paragraph, or asset IDs; no Studio annotations are imported.';

comment on table public.hanzihome_reader_pronunciation_overrides is
  'HanziHome-owned contextual pronunciation overrides keyed by static Reader IDs; no Studio pronunciation state is imported.';

comment on table public.hanzihome_pdf_annotations is
  'HanziHome-owned PDF annotations keyed by static asset ID; no Studio PDF annotation state is imported.';

commit;
