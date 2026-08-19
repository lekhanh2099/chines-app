create table if not exists public.hanzihome_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  title text not null,
  subtitle text,
  type text not null default 'custom',
  course_order integer not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint hanzihome_courses_type_check
    check (type in ('hanyu', 'hsk', 'listening', 'custom'))
);

create table if not exists public.hanzihome_course_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.hanzihome_courses(id) on delete cascade,
  title text not null,
  short_title text,
  book_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hanzihome_courses_user_id_idx
on public.hanzihome_courses(user_id);

create index if not exists hanzihome_course_books_user_id_idx
on public.hanzihome_course_books(user_id);

create index if not exists hanzihome_course_books_course_id_idx
on public.hanzihome_course_books(course_id);

alter table public.hanzihome_courses enable row level security;
alter table public.hanzihome_course_books enable row level security;

drop policy if exists "Users can read own hanzihome courses"
on public.hanzihome_courses;

create policy "Users can read own hanzihome courses"
on public.hanzihome_courses
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own hanzihome courses"
on public.hanzihome_courses;

create policy "Users can insert own hanzihome courses"
on public.hanzihome_courses
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own hanzihome courses"
on public.hanzihome_courses;

create policy "Users can update own hanzihome courses"
on public.hanzihome_courses
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own hanzihome courses"
on public.hanzihome_courses;

create policy "Users can delete own hanzihome courses"
on public.hanzihome_courses
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read own hanzihome course books"
on public.hanzihome_course_books;

create policy "Users can read own hanzihome course books"
on public.hanzihome_course_books
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own hanzihome course books"
on public.hanzihome_course_books;

create policy "Users can insert own hanzihome course books"
on public.hanzihome_course_books
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own hanzihome course books"
on public.hanzihome_course_books;

create policy "Users can update own hanzihome course books"
on public.hanzihome_course_books
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own hanzihome course books"
on public.hanzihome_course_books;

create policy "Users can delete own hanzihome course books"
on public.hanzihome_course_books
for delete
using (auth.uid() = user_id);
