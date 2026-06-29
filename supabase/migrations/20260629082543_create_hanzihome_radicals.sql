begin;

create table if not exists public.hanzihome_radicals (
  id text primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  source text not null default 'seed' check (source in ('seed', 'custom')),
  radical_index integer not null,
  radical text not null,
  name_vi text,
  strokes integer,
  core_meaning jsonb not null default '{}'::jsonb,
  variants jsonb not null default '[]'::jsonb,
  related_components jsonb not null default '[]'::jsonb,
  recognition text,
  distinguish text[] not null default '{}',
  groups jsonb not null default '[]'::jsonb,
  imported_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hanzihome_radicals_owner_source_check
    check ((source = 'seed' and owner_id is null) or (source = 'custom' and owner_id is not null)),
  constraint hanzihome_radicals_strokes_check
    check (strokes is null or strokes > 0),
  constraint hanzihome_radicals_core_meaning_object_check
    check (jsonb_typeof(core_meaning) = 'object'),
  constraint hanzihome_radicals_variants_array_check
    check (jsonb_typeof(variants) = 'array'),
  constraint hanzihome_radicals_related_components_array_check
    check (jsonb_typeof(related_components) = 'array'),
  constraint hanzihome_radicals_groups_array_check
    check (jsonb_typeof(groups) = 'array')
);

create unique index if not exists hanzihome_radicals_active_index_idx
on public.hanzihome_radicals (radical_index)
where deleted_at is null;

create index if not exists hanzihome_radicals_seed_radical_idx
on public.hanzihome_radicals (radical)
where source = 'seed' and deleted_at is null;

create index if not exists hanzihome_radicals_active_idx
on public.hanzihome_radicals (deleted_at);

drop trigger if exists set_hanzihome_radicals_updated_at
on public.hanzihome_radicals;

create trigger set_hanzihome_radicals_updated_at
before update on public.hanzihome_radicals
for each row
execute function public.set_hanzihome_updated_at();

alter table public.hanzihome_radicals enable row level security;

drop policy if exists "HanziHome radical active reads"
on public.hanzihome_radicals;

create policy "HanziHome radical active reads"
on public.hanzihome_radicals
for select
to anon, authenticated
using (
  deleted_at is null
  and (source = 'seed' or (source = 'custom' and (select auth.uid()) = owner_id))
);

revoke insert, update, delete on table public.hanzihome_radicals from anon, authenticated;
grant select on table public.hanzihome_radicals to anon, authenticated;

comment on table public.hanzihome_radicals is
  'Standalone HanziHome radical catalog. Seed rows are imported from data/hanzihome-db/radicals.json and read through the catalog endpoint.';

commit;
