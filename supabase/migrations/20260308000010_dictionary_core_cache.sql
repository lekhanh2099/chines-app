create table if not exists public.dictionary_core (
  id uuid default gen_random_uuid() primary key,
  headword text not null,
  lookup_key text not null,
  pinyin text,
  sino_vietnamese text,
  data jsonb not null default '{}'::jsonb,
  lookup_count int not null default 1,
  created_at timestamp with time zone default now() not null,
  constraint dictionary_core_lookup_key_key unique (lookup_key)
);

create index if not exists idx_dictionary_headword
  on public.dictionary_core (headword);

create index if not exists idx_dictionary_lookup_key
  on public.dictionary_core (lookup_key);

alter table public.dictionary_core enable row level security;

drop policy if exists "Authenticated users can read dictionary core" on public.dictionary_core;
create policy "Authenticated users can read dictionary core"
on public.dictionary_core
for select
using (auth.uid() is not null);

drop policy if exists "Authenticated users can insert dictionary core" on public.dictionary_core;
create policy "Authenticated users can insert dictionary core"
on public.dictionary_core
for insert
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update dictionary core" on public.dictionary_core;
create policy "Authenticated users can update dictionary core"
on public.dictionary_core
for update
using (auth.uid() is not null)
with check (auth.uid() is not null);

create table if not exists public.user_vocabularies (
  user_id uuid not null references auth.users(id) on delete cascade,
  dictionary_id uuid not null references public.dictionary_core(id) on delete cascade,
  created_at timestamp with time zone default now() not null,
  primary key (user_id, dictionary_id)
);

create index if not exists idx_user_vocabularies_user_created
  on public.user_vocabularies (user_id, created_at desc);

alter table public.user_vocabularies enable row level security;

drop policy if exists "Users can view own user vocabularies" on public.user_vocabularies;
create policy "Users can view own user vocabularies"
on public.user_vocabularies
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own user vocabularies" on public.user_vocabularies;
create policy "Users can insert own user vocabularies"
on public.user_vocabularies
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own user vocabularies" on public.user_vocabularies;
create policy "Users can delete own user vocabularies"
on public.user_vocabularies
for delete
using (auth.uid() = user_id);

alter table public.user_vocab_progress
  add column if not exists dictionary_id uuid references public.dictionary_core(id) on delete set null;

create index if not exists idx_user_vocab_progress_dictionary_id
  on public.user_vocab_progress (dictionary_id);

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

insert into public.dictionary_core (
  headword,
  lookup_key,
  pinyin,
  sino_vietnamese,
  data,
  lookup_count,
  created_at
)
select
  v.hanzi,
  trim(v.hanzi),
  nullif(v.pinyin, ''),
  nullif(v.sino_vietnamese, ''),
  jsonb_strip_nulls(
    jsonb_build_object(
      'definitions',
      coalesce(
        case
          when jsonb_typeof(coalesce(v.analysis, v.ai_analysis, '{}'::jsonb) -> 'definitions') = 'array'
            then coalesce(v.analysis, v.ai_analysis, '{}'::jsonb) -> 'definitions'
          else null
        end,
        case
          when coalesce(v.meaning, '') <> ''
            then jsonb_build_array(
              jsonb_build_object(
                'part_of_speech', '',
                'meaning', v.meaning,
                'example', ''
              )
            )
          else '[]'::jsonb
        end
      ),
      'ai_analysis', coalesce(v.analysis, v.ai_analysis, '{}'::jsonb)
    )
  ),
  1,
  v.created_at
from public.vocabularies as v
where coalesce(v.hanzi, '') <> ''
on conflict (lookup_key) do update
set
  pinyin = coalesce(excluded.pinyin, public.dictionary_core.pinyin),
  sino_vietnamese = coalesce(excluded.sino_vietnamese, public.dictionary_core.sino_vietnamese),
  data = case
    when public.dictionary_core.data = '{}'::jsonb then excluded.data
    else public.dictionary_core.data
  end;

update public.user_vocab_progress as progress
set dictionary_id = core.id
from public.vocabularies as vocab
join public.dictionary_core as core
  on core.lookup_key = trim(vocab.hanzi)
where progress.vocab_id = vocab.id
  and progress.dictionary_id is null;

insert into public.user_vocabularies (
  user_id,
  dictionary_id,
  created_at
)
select distinct
  progress.user_id,
  progress.dictionary_id,
  now()
from public.user_vocab_progress as progress
where progress.dictionary_id is not null
on conflict (user_id, dictionary_id) do nothing;