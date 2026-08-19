begin;

create table public.hanzihome_lesson_sections (
  id uuid primary key,
  lesson_id text not null
    references public.hanzihome_lessons(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  source text not null default 'seed'
    check (source in ('seed', 'custom')),
  source_section_id text not null,
  section_key text not null,
  section_type text not null,
  title text not null default '',
  title_vi text not null default '',
  section_order integer not null check (section_order > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  source_file text,
  imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, source_section_id),
  unique (lesson_id, section_key),
  unique (lesson_id, section_order)
);

create index hanzihome_lesson_sections_lesson_order_idx
on public.hanzihome_lesson_sections (lesson_id, section_order);

create index hanzihome_lesson_sections_type_idx
on public.hanzihome_lesson_sections (section_type);

create index hanzihome_lesson_sections_source_lesson_idx
on public.hanzihome_lesson_sections (source, lesson_id);

alter table public.hanzihome_lesson_sections enable row level security;

create policy "Read seed and own custom hanzihome lesson sections"
on public.hanzihome_lesson_sections
for select
to anon, authenticated
using (
  source = 'seed'
  or owner_id = (select auth.uid())
);

create policy "Users can insert own custom hanzihome lesson sections"
on public.hanzihome_lesson_sections
for insert
to authenticated
with check (
  source = 'custom'
  and owner_id = (select auth.uid())
);

create policy "Users can update own custom hanzihome lesson sections"
on public.hanzihome_lesson_sections
for update
to authenticated
using (
  source = 'custom'
  and owner_id = (select auth.uid())
)
with check (
  source = 'custom'
  and owner_id = (select auth.uid())
);

create policy "Users can delete own custom hanzihome lesson sections"
on public.hanzihome_lesson_sections
for delete
to authenticated
using (
  source = 'custom'
  and owner_id = (select auth.uid())
);

create trigger set_hanzihome_lesson_sections_updated_at
before update on public.hanzihome_lesson_sections
for each row execute function public.set_hanzihome_updated_at();

grant select on table public.hanzihome_lesson_sections to anon, authenticated;
grant insert, update, delete on table public.hanzihome_lesson_sections to authenticated;

comment on table public.hanzihome_lesson_sections is
  'Canonical ordered lesson section payloads. Seed rows preserve the complete materialized lesson structure while normalized vocab and grammar tables provide specialized read models.';

commit;
