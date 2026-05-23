create table if not exists public.lesson_note_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  target_type text not null,
  target_key text not null,
  relation_type text not null default 'main',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint lesson_note_links_target_type_check
    check (target_type in ('hanzihome_lesson')),

  constraint lesson_note_links_relation_type_check
    check (relation_type in ('main', 'vocab', 'grammar', 'annotation'))
);

create index if not exists lesson_note_links_note_id_idx
on public.lesson_note_links(note_id);

create index if not exists lesson_note_links_target_idx
on public.lesson_note_links(user_id, target_type, target_key);

create unique index if not exists lesson_note_links_main_unique_idx
on public.lesson_note_links(user_id, target_type, target_key, relation_type)
where relation_type = 'main';

alter table public.lesson_note_links enable row level security;

drop policy if exists "Users can read own lesson note links"
on public.lesson_note_links;

create policy "Users can read own lesson note links"
on public.lesson_note_links
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own lesson note links"
on public.lesson_note_links;

create policy "Users can insert own lesson note links"
on public.lesson_note_links
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own lesson note links"
on public.lesson_note_links;

create policy "Users can update own lesson note links"
on public.lesson_note_links
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own lesson note links"
on public.lesson_note_links;

create policy "Users can delete own lesson note links"
on public.lesson_note_links
for delete
using (auth.uid() = user_id);
