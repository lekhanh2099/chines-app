begin;

create table if not exists public.hanzihome_lesson_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  lesson_key text not null,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),

  title_zh text not null,
  title_vi text,
  lesson_number integer,

  content jsonb not null default '{}'::jsonb,

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  unique(user_id, lesson_key)
);

alter table public.hanzihome_lesson_drafts enable row level security;

drop policy if exists "Users can manage own HanziHome lesson drafts"
on public.hanzihome_lesson_drafts;

create policy "Users can manage own HanziHome lesson drafts"
on public.hanzihome_lesson_drafts
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists hanzihome_lesson_drafts_user_id_idx
on public.hanzihome_lesson_drafts(user_id);

create index if not exists hanzihome_lesson_drafts_status_idx
on public.hanzihome_lesson_drafts(status);

create index if not exists hanzihome_lesson_drafts_lesson_number_idx
on public.hanzihome_lesson_drafts(lesson_number);

commit;
