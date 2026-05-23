drop table if exists public.user_grammar_exercise_attempts cascade;
drop table if exists public.user_grammar_point_progress cascade;
drop table if exists public.grammar_exercises cascade;
drop table if exists public.grammar_points cascade;
drop table if exists public.grammar_lessons cascade;
drop table if exists public.grammar_courses cascade;

drop table if exists public.user_vocab_entry_progress cascade;
drop table if exists public.vocab_entries cascade;
drop table if exists public.vocab_lessons cascade;
drop table if exists public.vocab_courses cascade;

create table if not exists public.user_learning_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  progress jsonb not null default '{}'::jsonb,
  bookmarks jsonb not null default '{}'::jsonb,
  review_history jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone default now()
);

alter table public.user_learning_state enable row level security;

drop policy if exists "Users can manage own learning state" on public.user_learning_state;

create policy "Users can manage own learning state"
on public.user_learning_state
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
