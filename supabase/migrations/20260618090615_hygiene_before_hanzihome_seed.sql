-- Final pre-seed schema hygiene.
-- Non-destructive: add missing RLS policies and documentation only.

alter table public.vocabularies enable row level security;
alter table public.user_vocab_progress enable row level security;

-- Legacy dictionary/vocabulary flow is still referenced by the app code.
-- Keep these tables, but make their RLS behavior explicit.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vocabularies'
      and policyname = 'Authenticated users can read vocabularies'
  ) then
    create policy "Authenticated users can read vocabularies"
      on public.vocabularies
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vocabularies'
      and policyname = 'Authenticated users can insert vocabularies'
  ) then
    create policy "Authenticated users can insert vocabularies"
      on public.vocabularies
      for insert
      to authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vocabularies'
      and policyname = 'Authenticated users can update vocabularies'
  ) then
    create policy "Authenticated users can update vocabularies"
      on public.vocabularies
      for update
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_vocab_progress'
      and policyname = 'Users can read own vocab progress'
  ) then
    create policy "Users can read own vocab progress"
      on public.user_vocab_progress
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_vocab_progress'
      and policyname = 'Users can insert own vocab progress'
  ) then
    create policy "Users can insert own vocab progress"
      on public.user_vocab_progress
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_vocab_progress'
      and policyname = 'Users can update own vocab progress'
  ) then
    create policy "Users can update own vocab progress"
      on public.user_vocab_progress
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_vocab_progress'
      and policyname = 'Users can delete own vocab progress'
  ) then
    create policy "Users can delete own vocab progress"
      on public.user_vocab_progress
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists vocabularies_hanzi_idx
  on public.vocabularies (hanzi);

create index if not exists user_vocab_progress_user_review_idx
  on public.user_vocab_progress (user_id, next_review_at);

comment on table public.vocabularies is 'Legacy vocabulary cache kept for dictionary/SRS flows still referenced by the app. Empty before HanziHome JSON seed.';
comment on table public.user_vocab_progress is 'User-specific SRS/progress rows for saved vocabulary. Kept because the app still references this flow.';
comment on table public.dictionary_core is 'Dictionary lookup cache used by vocabulary lookup and saved vocabulary flows. Not part of HanziHome lesson seed.';
comment on table public.user_vocabularies is 'User saved vocabulary join table backed by dictionary_core. Not part of HanziHome lesson seed.';

comment on schema public is 'Application schema. Legacy lesson tables were removed; HanziHome JSON seed uses the hanzihome_* content tables.';
