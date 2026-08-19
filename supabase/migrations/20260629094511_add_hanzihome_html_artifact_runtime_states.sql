begin;

create unique index if not exists hanzihome_html_artifacts_owner_id_unique_idx
on public.hanzihome_html_artifacts(owner_id, id);

create table if not exists public.hanzihome_html_artifact_runtime_states (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  artifact_id uuid not null references public.hanzihome_html_artifacts(id) on delete cascade,
  state jsonb not null default '{}'::jsonb
    check (jsonb_typeof(state) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, artifact_id),
  constraint hanzihome_html_artifact_runtime_states_owner_artifact_fk
    foreign key (owner_id, artifact_id)
    references public.hanzihome_html_artifacts(owner_id, id)
    on delete cascade
);

create index if not exists hanzihome_html_artifact_runtime_states_owner_updated_idx
on public.hanzihome_html_artifact_runtime_states(owner_id, updated_at desc);

create or replace function public.set_hanzihome_html_artifact_runtime_states_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_hanzihome_html_artifact_runtime_states_updated_at
on public.hanzihome_html_artifact_runtime_states;

create trigger set_hanzihome_html_artifact_runtime_states_updated_at
before update on public.hanzihome_html_artifact_runtime_states
for each row
execute function public.set_hanzihome_html_artifact_runtime_states_updated_at();

alter table public.hanzihome_html_artifact_runtime_states enable row level security;

drop policy if exists "Users can read own HanziHome HTML artifact runtime state"
on public.hanzihome_html_artifact_runtime_states;

create policy "Users can read own HanziHome HTML artifact runtime state"
on public.hanzihome_html_artifact_runtime_states
for select
to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "Users can insert own HanziHome HTML artifact runtime state"
on public.hanzihome_html_artifact_runtime_states;

create policy "Users can insert own HanziHome HTML artifact runtime state"
on public.hanzihome_html_artifact_runtime_states
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can update own HanziHome HTML artifact runtime state"
on public.hanzihome_html_artifact_runtime_states;

create policy "Users can update own HanziHome HTML artifact runtime state"
on public.hanzihome_html_artifact_runtime_states
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can delete own HanziHome HTML artifact runtime state"
on public.hanzihome_html_artifact_runtime_states;

create policy "Users can delete own HanziHome HTML artifact runtime state"
on public.hanzihome_html_artifact_runtime_states
for delete
to authenticated
using ((select auth.uid()) = owner_id);

grant select, insert, update, delete on public.hanzihome_html_artifact_runtime_states to authenticated;

commit;
