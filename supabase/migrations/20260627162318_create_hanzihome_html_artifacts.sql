begin;

create table if not exists public.hanzihome_html_artifacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,

  title text not null check (char_length(trim(title)) > 0),
  artifact_type text not null default 'practice_page'
    check (artifact_type in ('practice_page', 'mock_exam', 'grammar_drill', 'reference', 'other')),
  tags text[] not null default '{}',
  html text not null check (char_length(trim(html)) > 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hanzihome_html_artifacts_owner_updated_idx
on public.hanzihome_html_artifacts(owner_id, updated_at desc);

create index if not exists hanzihome_html_artifacts_owner_type_idx
on public.hanzihome_html_artifacts(owner_id, artifact_type, updated_at desc);

create or replace function public.set_hanzihome_html_artifacts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_hanzihome_html_artifacts_updated_at
on public.hanzihome_html_artifacts;

create trigger set_hanzihome_html_artifacts_updated_at
before update on public.hanzihome_html_artifacts
for each row
execute function public.set_hanzihome_html_artifacts_updated_at();

alter table public.hanzihome_html_artifacts enable row level security;

drop policy if exists "Users can read own HanziHome HTML artifacts"
on public.hanzihome_html_artifacts;

create policy "Users can read own HanziHome HTML artifacts"
on public.hanzihome_html_artifacts
for select
to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "Users can insert own HanziHome HTML artifacts"
on public.hanzihome_html_artifacts;

create policy "Users can insert own HanziHome HTML artifacts"
on public.hanzihome_html_artifacts
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can update own HanziHome HTML artifacts"
on public.hanzihome_html_artifacts;

create policy "Users can update own HanziHome HTML artifacts"
on public.hanzihome_html_artifacts
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can delete own HanziHome HTML artifacts"
on public.hanzihome_html_artifacts;

create policy "Users can delete own HanziHome HTML artifacts"
on public.hanzihome_html_artifacts
for delete
to authenticated
using ((select auth.uid()) = owner_id);

grant select, insert, update, delete on public.hanzihome_html_artifacts to authenticated;

commit;
