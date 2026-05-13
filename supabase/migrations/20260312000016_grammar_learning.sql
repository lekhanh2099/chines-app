create table if not exists public.grammar_courses (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  course_key text not null,
  title text not null,
  source_type text not null default 'custom',
  source_file text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint grammar_courses_owner_key_unique unique (owner_id, course_key)
);

create table if not exists public.grammar_lessons (
  id uuid default gen_random_uuid() primary key,
  course_id uuid not null references public.grammar_courses(id) on delete cascade,
  lesson_key text not null,
  lesson_number int,
  title text not null,
  lesson_order int not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint grammar_lessons_course_key_unique unique (course_id, lesson_key)
);

create table if not exists public.grammar_points (
  id uuid default gen_random_uuid() primary key,
  course_id uuid not null references public.grammar_courses(id) on delete cascade,
  lesson_id uuid references public.grammar_lessons(id) on delete set null,
  title text not null,
  hanzi text,
  pinyin text,
  vietnamese_title text,
  level text,
  category text,
  tags text[] default array[]::text[],
  row_number int not null default 1,
  content jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.grammar_exercises (
  id uuid default gen_random_uuid() primary key,
  course_id uuid not null references public.grammar_courses(id) on delete cascade,
  lesson_id uuid references public.grammar_lessons(id) on delete cascade,
  point_id uuid references public.grammar_points(id) on delete cascade,
  exercise_type text not null check (exercise_type in ('fill_blank', 'multiple_choice', 'reorder_sentence', 'translate_zh', 'identify_error')),
  prompt text not null,
  content jsonb default '{}'::jsonb,
  answer jsonb default '{}'::jsonb,
  explanation text,
  exercise_order int not null default 1,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.user_grammar_point_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  point_id uuid not null references public.grammar_points(id) on delete cascade,
  proficiency_level int not null default 0 check (proficiency_level between 0 and 5),
  last_studied_at timestamp with time zone,
  next_review_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  primary key (user_id, point_id)
);

create table if not exists public.user_grammar_exercise_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.grammar_exercises(id) on delete cascade,
  point_id uuid references public.grammar_points(id) on delete set null,
  submitted_answer jsonb default '{}'::jsonb,
  is_correct boolean,
  attempted_at timestamp with time zone default now()
);

create index if not exists idx_grammar_courses_owner_updated
  on public.grammar_courses (owner_id, updated_at desc);

create index if not exists idx_grammar_lessons_course_order
  on public.grammar_lessons (course_id, lesson_order);

create index if not exists idx_grammar_points_course_lesson_row
  on public.grammar_points (course_id, lesson_id, row_number);

create index if not exists idx_grammar_points_search
  on public.grammar_points (title, hanzi, pinyin);

create index if not exists idx_grammar_exercises_point_order
  on public.grammar_exercises (point_id, exercise_order);

create index if not exists idx_user_grammar_point_progress_user
  on public.user_grammar_point_progress (user_id, updated_at desc);

alter table public.grammar_courses enable row level security;
alter table public.grammar_lessons enable row level security;
alter table public.grammar_points enable row level security;
alter table public.grammar_exercises enable row level security;
alter table public.user_grammar_point_progress enable row level security;
alter table public.user_grammar_exercise_attempts enable row level security;

drop policy if exists "Users can read own grammar courses" on public.grammar_courses;
create policy "Users can read own grammar courses"
on public.grammar_courses for select
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "Users can manage own grammar courses" on public.grammar_courses;
create policy "Users can manage own grammar courses"
on public.grammar_courses for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Users can read own grammar lessons" on public.grammar_lessons;
create policy "Users can read own grammar lessons"
on public.grammar_lessons for select
to authenticated
using (
  exists (
    select 1 from public.grammar_courses
    where grammar_courses.id = grammar_lessons.course_id
      and grammar_courses.owner_id = auth.uid()
  )
);

drop policy if exists "Users can manage own grammar lessons" on public.grammar_lessons;
create policy "Users can manage own grammar lessons"
on public.grammar_lessons for all
to authenticated
using (
  exists (
    select 1 from public.grammar_courses
    where grammar_courses.id = grammar_lessons.course_id
      and grammar_courses.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.grammar_courses
    where grammar_courses.id = grammar_lessons.course_id
      and grammar_courses.owner_id = auth.uid()
  )
);

drop policy if exists "Users can read own grammar points" on public.grammar_points;
create policy "Users can read own grammar points"
on public.grammar_points for select
to authenticated
using (
  exists (
    select 1 from public.grammar_courses
    where grammar_courses.id = grammar_points.course_id
      and grammar_courses.owner_id = auth.uid()
  )
);

drop policy if exists "Users can manage own grammar points" on public.grammar_points;
create policy "Users can manage own grammar points"
on public.grammar_points for all
to authenticated
using (
  exists (
    select 1 from public.grammar_courses
    where grammar_courses.id = grammar_points.course_id
      and grammar_courses.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.grammar_courses
    where grammar_courses.id = grammar_points.course_id
      and grammar_courses.owner_id = auth.uid()
  )
);

drop policy if exists "Users can read own grammar exercises" on public.grammar_exercises;
create policy "Users can read own grammar exercises"
on public.grammar_exercises for select
to authenticated
using (
  exists (
    select 1 from public.grammar_courses
    where grammar_courses.id = grammar_exercises.course_id
      and grammar_courses.owner_id = auth.uid()
  )
);

drop policy if exists "Users can manage own grammar exercises" on public.grammar_exercises;
create policy "Users can manage own grammar exercises"
on public.grammar_exercises for all
to authenticated
using (
  exists (
    select 1 from public.grammar_courses
    where grammar_courses.id = grammar_exercises.course_id
      and grammar_courses.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.grammar_courses
    where grammar_courses.id = grammar_exercises.course_id
      and grammar_courses.owner_id = auth.uid()
  )
);

drop policy if exists "Users can manage own grammar point progress" on public.user_grammar_point_progress;
create policy "Users can manage own grammar point progress"
on public.user_grammar_point_progress for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own grammar exercise attempts" on public.user_grammar_exercise_attempts;
create policy "Users can manage own grammar exercise attempts"
on public.user_grammar_exercise_attempts for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
