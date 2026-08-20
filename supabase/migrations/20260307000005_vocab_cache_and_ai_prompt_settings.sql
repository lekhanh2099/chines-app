alter table public.vocabularies
  add column if not exists sino_vietnamese text;

alter table public.vocabularies
  add column if not exists analysis jsonb default '{}'::jsonb not null;

update public.vocabularies
set analysis = coalesce(nullif(ai_analysis, '{}'::jsonb), analysis, '{}'::jsonb)
where analysis = '{}'::jsonb;

update public.vocabularies
set sino_vietnamese = coalesce(
  sino_vietnamese,
  analysis ->> 'sino_vietnamese',
  analysis ->> 'han_viet',
  ai_analysis ->> 'sino_vietnamese',
  ai_analysis ->> 'han_viet'
)
where sino_vietnamese is null;

create table if not exists public.user_ai_prompt_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  word_lookup_prompt text not null,
  sentence_lookup_prompt text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table public.user_ai_prompt_settings enable row level security;

create policy "Users can view own AI prompt settings"
on public.user_ai_prompt_settings
for select
using (auth.uid() = user_id);

create policy "Users can insert own AI prompt settings"
on public.user_ai_prompt_settings
for insert
with check (auth.uid() = user_id);

create policy "Users can update own AI prompt settings"
on public.user_ai_prompt_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
