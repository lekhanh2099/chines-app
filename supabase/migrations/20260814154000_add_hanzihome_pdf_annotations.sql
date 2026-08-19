begin;

create table if not exists public.hanzihome_pdf_annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id text not null references public.hanzihome_reading_assets(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  payload jsonb not null default '{"strokes": []}'::jsonb
    check (jsonb_typeof(payload) = 'object' and jsonb_typeof(payload->'strokes') = 'array'),
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, asset_id, page_number)
);

create index if not exists hanzihome_pdf_annotations_asset_idx
  on public.hanzihome_pdf_annotations (user_id, asset_id, page_number);

drop trigger if exists hanzihome_pdf_annotations_updated_at
  on public.hanzihome_pdf_annotations;
create trigger hanzihome_pdf_annotations_updated_at
before update on public.hanzihome_pdf_annotations
for each row execute function public.hanzihome_studio_touch_updated_at();

alter table public.hanzihome_pdf_annotations enable row level security;

create policy "Users can manage own HanziHome PDF annotations"
on public.hanzihome_pdf_annotations for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

revoke all on table public.hanzihome_pdf_annotations from public, anon, authenticated;
grant select, insert, update, delete on table public.hanzihome_pdf_annotations to authenticated;

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

revoke all on function public.hanzihome_upsert_pdf_annotation(text, integer, jsonb, integer)
from public, anon;
grant execute on function public.hanzihome_upsert_pdf_annotation(text, integer, jsonb, integer)
to authenticated;

comment on table public.hanzihome_pdf_annotations is
  'New HanziHome PDF page annotations only; Studio local, IndexedDB, Convex, and legacy user state are not imported.';

commit;
