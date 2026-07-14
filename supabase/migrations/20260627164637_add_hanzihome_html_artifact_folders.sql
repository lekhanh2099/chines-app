begin;

create table if not exists public.hanzihome_html_artifact_folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  color text not null default 'blue'
    check (color in ('blue', 'purple', 'green', 'orange', 'rose', 'slate')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hanzihome_html_artifacts
add column if not exists folder_id uuid references public.hanzihome_html_artifact_folders(id) on delete set null;

create index if not exists hanzihome_html_artifact_folders_owner_position_idx
on public.hanzihome_html_artifact_folders(owner_id, position, updated_at desc);

create index if not exists hanzihome_html_artifacts_owner_folder_updated_idx
on public.hanzihome_html_artifacts(owner_id, folder_id, updated_at desc);

create or replace function public.set_hanzihome_html_artifact_folders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_hanzihome_html_artifact_folders_updated_at
on public.hanzihome_html_artifact_folders;

create trigger set_hanzihome_html_artifact_folders_updated_at
before update on public.hanzihome_html_artifact_folders
for each row
execute function public.set_hanzihome_html_artifact_folders_updated_at();

alter table public.hanzihome_html_artifact_folders enable row level security;

drop policy if exists "Users can read own HanziHome HTML artifact folders"
on public.hanzihome_html_artifact_folders;

create policy "Users can read own HanziHome HTML artifact folders"
on public.hanzihome_html_artifact_folders
for select
to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "Users can insert own HanziHome HTML artifact folders"
on public.hanzihome_html_artifact_folders;

create policy "Users can insert own HanziHome HTML artifact folders"
on public.hanzihome_html_artifact_folders
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can update own HanziHome HTML artifact folders"
on public.hanzihome_html_artifact_folders;

create policy "Users can update own HanziHome HTML artifact folders"
on public.hanzihome_html_artifact_folders
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can delete own HanziHome HTML artifact folders"
on public.hanzihome_html_artifact_folders;

create policy "Users can delete own HanziHome HTML artifact folders"
on public.hanzihome_html_artifact_folders
for delete
to authenticated
using ((select auth.uid()) = owner_id);

grant select, insert, update, delete on public.hanzihome_html_artifact_folders to authenticated;

commit;
