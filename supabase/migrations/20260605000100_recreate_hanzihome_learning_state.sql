begin;

create table if not exists public.user_learning_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  progress jsonb not null default '{}'::jsonb,
  bookmarks jsonb not null default '{}'::jsonb,
  review_history jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone not null default now()
);

alter table public.user_learning_state enable row level security;

drop policy if exists "Users can manage own learning state" on public.user_learning_state;

create policy "Users can manage own learning state"
on public.user_learning_state
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

commit;
