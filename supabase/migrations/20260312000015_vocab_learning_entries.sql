create table if not exists public.vocab_courses (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  course_key text not null,
  title text not null,
  source_file text not null,
  source_path text,
  generated_at timestamp with time zone,
  imported_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  constraint vocab_courses_owner_key_unique unique (owner_id, course_key)
);

create table if not exists public.vocab_lessons (
  id uuid default gen_random_uuid() primary key,
  course_id uuid not null references public.vocab_courses(id) on delete cascade,
  lesson_key text not null,
  lesson_number int,
  title text not null,
  lesson_order int not null,
  item_count int default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint vocab_lessons_course_key_unique unique (course_id, lesson_key)
);

create table if not exists public.vocab_entries (
  id uuid default gen_random_uuid() primary key,
  course_id uuid not null references public.vocab_courses(id) on delete cascade,
  lesson_id uuid not null references public.vocab_lessons(id) on delete cascade,
  hanzi text not null,
  pinyin text,
  sino_vietnamese text,
  meaning text,
  word_type text,
  category text,
  row_number int not null,
  ai_analysis jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint vocab_entries_lesson_row_unique unique (lesson_id, row_number)
);

create table if not exists public.user_vocab_entry_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null references public.vocab_entries(id) on delete cascade,
  proficiency_level int not null default 0 check (proficiency_level between 0 and 5),
  next_review_at timestamp with time zone,
  is_favorited boolean default false,
  last_answered_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  primary key (user_id, entry_id)
);

create index if not exists idx_vocab_lessons_course_order
  on public.vocab_lessons (course_id, lesson_order);

create index if not exists idx_vocab_courses_owner_imported
  on public.vocab_courses (owner_id, imported_at desc);

create index if not exists idx_vocab_entries_course_lesson_row
  on public.vocab_entries (course_id, lesson_id, row_number);

create index if not exists idx_vocab_entries_hanzi
  on public.vocab_entries (hanzi);

create index if not exists idx_user_vocab_entry_progress_user
  on public.user_vocab_entry_progress (user_id, updated_at desc);

alter table public.vocab_courses enable row level security;
alter table public.vocab_lessons enable row level security;
alter table public.vocab_entries enable row level security;
alter table public.user_vocab_entry_progress enable row level security;

drop policy if exists "Authenticated users can read vocab courses" on public.vocab_courses;
create policy "Authenticated users can read vocab courses"
on public.vocab_courses for select
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "Authenticated users can manage vocab courses" on public.vocab_courses;
create policy "Authenticated users can manage vocab courses"
on public.vocab_courses for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Authenticated users can read vocab lessons" on public.vocab_lessons;
create policy "Authenticated users can read vocab lessons"
on public.vocab_lessons for select
to authenticated
using (
  exists (
    select 1 from public.vocab_courses
    where vocab_courses.id = vocab_lessons.course_id
      and vocab_courses.owner_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can manage vocab lessons" on public.vocab_lessons;
create policy "Authenticated users can manage vocab lessons"
on public.vocab_lessons for all
to authenticated
using (
  exists (
    select 1 from public.vocab_courses
    where vocab_courses.id = vocab_lessons.course_id
      and vocab_courses.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.vocab_courses
    where vocab_courses.id = vocab_lessons.course_id
      and vocab_courses.owner_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can read vocab entries" on public.vocab_entries;
create policy "Authenticated users can read vocab entries"
on public.vocab_entries for select
to authenticated
using (
  exists (
    select 1 from public.vocab_courses
    where vocab_courses.id = vocab_entries.course_id
      and vocab_courses.owner_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can manage vocab entries" on public.vocab_entries;
create policy "Authenticated users can manage vocab entries"
on public.vocab_entries for all
to authenticated
using (
  exists (
    select 1 from public.vocab_courses
    where vocab_courses.id = vocab_entries.course_id
      and vocab_courses.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.vocab_courses
    where vocab_courses.id = vocab_entries.course_id
      and vocab_courses.owner_id = auth.uid()
  )
);

drop policy if exists "Users can manage own vocab entry progress" on public.user_vocab_entry_progress;
create policy "Users can manage own vocab entry progress"
on public.user_vocab_entry_progress for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
