begin;

create extension if not exists pgcrypto;

create or replace function public.set_hanzihome_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.hanzihome_courses
  alter column id type text using id::text,
  alter column id set default gen_random_uuid()::text,
  alter column user_id drop not null;

alter table public.hanzihome_courses
  add column if not exists source text not null default 'custom',
  add column if not exists imported_at timestamptz;

alter table public.hanzihome_courses
  drop constraint if exists hanzihome_courses_source_check;

alter table public.hanzihome_courses
  add constraint hanzihome_courses_source_check
  check (source in ('seed', 'custom'));

create unique index if not exists hanzihome_courses_seed_slug_unique_idx
on public.hanzihome_courses(slug)
where source = 'seed';

drop policy if exists "Anyone can read seed hanzihome courses"
on public.hanzihome_courses;

create policy "Anyone can read seed hanzihome courses"
on public.hanzihome_courses
for select
using (source = 'seed');

drop policy if exists "Users can read own hanzihome courses"
on public.hanzihome_courses;

create policy "Users can read own hanzihome courses"
on public.hanzihome_courses
for select
to authenticated
using (source = 'custom' and auth.uid() = user_id);

drop policy if exists "Users can insert own hanzihome courses"
on public.hanzihome_courses;

create policy "Users can insert own hanzihome courses"
on public.hanzihome_courses
for insert
to authenticated
with check (source = 'custom' and auth.uid() = user_id);

drop policy if exists "Users can update own hanzihome courses"
on public.hanzihome_courses;

create policy "Users can update own hanzihome courses"
on public.hanzihome_courses
for update
to authenticated
using (source = 'custom' and auth.uid() = user_id)
with check (source = 'custom' and auth.uid() = user_id);

drop policy if exists "Users can delete own hanzihome courses"
on public.hanzihome_courses;

create policy "Users can delete own hanzihome courses"
on public.hanzihome_courses
for delete
to authenticated
using (source = 'custom' and auth.uid() = user_id);

comment on table public.hanzihome_courses is
  'HanziHome courses. Seed rows are imported by the server-side seed script and readable through RLS; custom rows remain user-owned.';

alter table public.hanzihome_course_books
  alter column id type text using id::text,
  alter column id set default gen_random_uuid()::text,
  alter column user_id drop not null;

alter table public.hanzihome_course_books
  add column if not exists source text not null default 'custom',
  add column if not exists imported_at timestamptz;

alter table public.hanzihome_course_books
  drop constraint if exists hanzihome_course_books_source_check;

alter table public.hanzihome_course_books
  add constraint hanzihome_course_books_source_check
  check (source in ('seed', 'custom'));

create unique index if not exists hanzihome_course_books_seed_course_title_unique_idx
on public.hanzihome_course_books(course_id, title)
where source = 'seed';

create unique index if not exists hanzihome_course_books_seed_course_order_unique_idx
on public.hanzihome_course_books(course_id, book_order)
where source = 'seed';

drop policy if exists "Anyone can read seed hanzihome course books"
on public.hanzihome_course_books;

create policy "Anyone can read seed hanzihome course books"
on public.hanzihome_course_books
for select
using (source = 'seed');

drop policy if exists "Users can read own hanzihome course books"
on public.hanzihome_course_books;

create policy "Users can read own hanzihome course books"
on public.hanzihome_course_books
for select
to authenticated
using (source = 'custom' and auth.uid() = user_id);

drop policy if exists "Users can insert own hanzihome course books"
on public.hanzihome_course_books;

create policy "Users can insert own hanzihome course books"
on public.hanzihome_course_books
for insert
to authenticated
with check (source = 'custom' and auth.uid() = user_id);

drop policy if exists "Users can update own hanzihome course books"
on public.hanzihome_course_books;

create policy "Users can update own hanzihome course books"
on public.hanzihome_course_books
for update
to authenticated
using (source = 'custom' and auth.uid() = user_id)
with check (source = 'custom' and auth.uid() = user_id);

drop policy if exists "Users can delete own hanzihome course books"
on public.hanzihome_course_books;

create policy "Users can delete own hanzihome course books"
on public.hanzihome_course_books
for delete
to authenticated
using (source = 'custom' and auth.uid() = user_id);

alter table public.hanzihome_course_books enable row level security;

create table if not exists public.hanzihome_lessons (
  id text primary key,
  course_id text not null references public.hanzihome_courses(id) on delete cascade,
  book_id text not null references public.hanzihome_course_books(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  source text not null default 'seed' check (source in ('seed', 'custom')),
  lesson_number integer not null,
  lesson_order integer not null,
  title_zh text not null,
  title_vi text,
  source_file text,
  imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, book_id, lesson_number),
  unique(course_id, book_id, lesson_order)
);

create table if not exists public.hanzihome_lesson_texts (
  id text primary key,
  lesson_id text not null references public.hanzihome_lessons(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  source text not null default 'seed' check (source in ('seed', 'custom')),
  text_key text not null default 'main',
  title text,
  content text not null default '',
  content_format text not null default 'markdown' check (content_format in ('markdown', 'plain')),
  imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(lesson_id, text_key)
);

create table if not exists public.hanzihome_vocab_items (
  id text primary key,
  lesson_id text not null references public.hanzihome_lessons(id) on delete cascade,
  course_id text not null references public.hanzihome_courses(id) on delete cascade,
  book_id text not null references public.hanzihome_course_books(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  source text not null default 'seed' check (source in ('seed', 'custom')),
  item_order integer not null,
  word text not null,
  pinyin text not null,
  han_viet text not null,
  meaning text not null,
  category text not null default 'Từ vựng',
  level text,
  pos_vi text,
  pos_zh text,
  tone text,
  source_file text,
  imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(lesson_id, word, pinyin)
);

create table if not exists public.hanzihome_vocab_examples (
  id text primary key,
  vocab_item_id text not null references public.hanzihome_vocab_items(id) on delete cascade,
  lesson_id text not null references public.hanzihome_lessons(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  source text not null default 'seed' check (source in ('seed', 'custom')),
  example_order integer not null,
  zh text not null,
  pinyin text,
  vi text,
  note text,
  imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(vocab_item_id, example_order)
);

create table if not exists public.hanzihome_vocab_detail_sections (
  id text primary key,
  vocab_item_id text not null references public.hanzihome_vocab_items(id) on delete cascade,
  lesson_id text not null references public.hanzihome_lessons(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  source text not null default 'seed' check (source in ('seed', 'custom')),
  section_key text not null,
  title text not null,
  lines text[] not null default '{}',
  section_order integer not null,
  imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(vocab_item_id, section_key)
);

create table if not exists public.hanzihome_grammar_points (
  id text primary key,
  lesson_id text not null references public.hanzihome_lessons(id) on delete cascade,
  course_id text not null references public.hanzihome_courses(id) on delete cascade,
  book_id text not null references public.hanzihome_course_books(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  source text not null default 'seed' check (source in ('seed', 'custom')),
  point_order integer not null,
  title text not null,
  clean_title text not null,
  core text not null default '',
  content_md text,
  structures_view text[] not null default '{}',
  notes text[] not null default '{}',
  imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(lesson_id, title)
);

create table if not exists public.hanzihome_grammar_examples (
  id text primary key,
  grammar_point_id text not null references public.hanzihome_grammar_points(id) on delete cascade,
  lesson_id text not null references public.hanzihome_lessons(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  source text not null default 'seed' check (source in ('seed', 'custom')),
  example_order integer not null,
  zh text not null,
  pinyin text,
  vi text,
  note text,
  imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(grammar_point_id, example_order)
);

create table if not exists public.hanzihome_grammar_detail_sections (
  id text primary key,
  grammar_point_id text not null references public.hanzihome_grammar_points(id) on delete cascade,
  lesson_id text not null references public.hanzihome_lessons(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  source text not null default 'seed' check (source in ('seed', 'custom')),
  section_key text not null,
  title text not null,
  lines text[] not null default '{}',
  section_order integer not null,
  imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(grammar_point_id, section_key)
);

create index if not exists hanzihome_course_books_course_order_idx
on public.hanzihome_course_books(course_id, book_order);

create index if not exists hanzihome_lessons_course_book_order_idx
on public.hanzihome_lessons(course_id, book_id, lesson_order);

create index if not exists hanzihome_vocab_items_lesson_order_idx
on public.hanzihome_vocab_items(lesson_id, item_order);

create index if not exists hanzihome_vocab_items_lookup_idx
on public.hanzihome_vocab_items(word, pinyin, han_viet);

create index if not exists hanzihome_vocab_items_category_idx
on public.hanzihome_vocab_items(lesson_id, category);

create index if not exists hanzihome_vocab_examples_item_order_idx
on public.hanzihome_vocab_examples(vocab_item_id, example_order);

create index if not exists hanzihome_vocab_detail_sections_item_order_idx
on public.hanzihome_vocab_detail_sections(vocab_item_id, section_order);

create index if not exists hanzihome_grammar_points_lesson_order_idx
on public.hanzihome_grammar_points(lesson_id, point_order);

create index if not exists hanzihome_grammar_points_lookup_idx
on public.hanzihome_grammar_points(clean_title);

create index if not exists hanzihome_grammar_examples_point_order_idx
on public.hanzihome_grammar_examples(grammar_point_id, example_order);

create index if not exists hanzihome_grammar_detail_sections_point_order_idx
on public.hanzihome_grammar_detail_sections(grammar_point_id, section_order);

alter table public.hanzihome_lessons enable row level security;
alter table public.hanzihome_lesson_texts enable row level security;
alter table public.hanzihome_vocab_items enable row level security;
alter table public.hanzihome_vocab_examples enable row level security;
alter table public.hanzihome_vocab_detail_sections enable row level security;
alter table public.hanzihome_grammar_points enable row level security;
alter table public.hanzihome_grammar_examples enable row level security;
alter table public.hanzihome_grammar_detail_sections enable row level security;

comment on table public.hanzihome_course_books is
  'Canonical HanziHome books table. Seed rows are imported by the server-side seed script; custom rows remain user-owned and are used by the existing custom course flow.';
comment on table public.hanzihome_lessons is
  'Editable HanziHome lessons. Seed rows preserve stable lesson IDs from the legacy JSON import source.';
comment on table public.hanzihome_lesson_texts is
  'Lesson text blocks separated from lesson metadata so Bài khóa can become editable without rewriting lesson rows.';
comment on table public.hanzihome_vocab_items is
  'Editable vocabulary items imported from legacy static JSON with stable IDs and lesson/course/book relationships.';
comment on table public.hanzihome_vocab_examples is
  'Vocabulary examples normalized from raw example sections for queryable editing.';
comment on table public.hanzihome_vocab_detail_sections is
  'Vocabulary detail sections with stable section keys and ordered text lines.';
comment on table public.hanzihome_grammar_points is
  'Editable grammar points imported from legacy static JSON with normalized structures and notes.';
comment on table public.hanzihome_grammar_examples is
  'Grammar examples normalized into child rows for editing and review.';
comment on table public.hanzihome_grammar_detail_sections is
  'Grammar detail sections kept separate from grammar point metadata.';

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'hanzihome_lessons',
    'hanzihome_lesson_texts',
    'hanzihome_vocab_items',
    'hanzihome_vocab_examples',
    'hanzihome_vocab_detail_sections',
    'hanzihome_grammar_points',
    'hanzihome_grammar_examples',
    'hanzihome_grammar_detail_sections'
  ]
  loop
    execute format('drop policy if exists "Anyone can read seed %I" on public.%I', table_name, table_name);
    execute format(
      'create policy "Anyone can read seed %I" on public.%I for select using (source = ''seed'')',
      table_name,
      table_name
    );

    execute format('drop policy if exists "Users can read own %I" on public.%I', table_name, table_name);
    execute format(
      'create policy "Users can read own %I" on public.%I for select to authenticated using (auth.uid() = owner_id)',
      table_name,
      table_name
    );

    execute format('drop policy if exists "Users can insert own %I" on public.%I', table_name, table_name);
    execute format(
      'create policy "Users can insert own %I" on public.%I for insert to authenticated with check (source = ''custom'' and auth.uid() = owner_id)',
      table_name,
      table_name
    );

    execute format('drop policy if exists "Users can update own %I" on public.%I', table_name, table_name);
    execute format(
      'create policy "Users can update own %I" on public.%I for update to authenticated using (source = ''custom'' and auth.uid() = owner_id) with check (source = ''custom'' and auth.uid() = owner_id)',
      table_name,
      table_name
    );

    execute format('drop policy if exists "Users can delete own %I" on public.%I', table_name, table_name);
    execute format(
      'create policy "Users can delete own %I" on public.%I for delete to authenticated using (source = ''custom'' and auth.uid() = owner_id)',
      table_name,
      table_name
    );

    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_hanzihome_updated_at()',
      table_name,
      table_name
    );
  end loop;
end $$;

drop trigger if exists set_hanzihome_courses_updated_at
on public.hanzihome_courses;

create trigger set_hanzihome_courses_updated_at
before update on public.hanzihome_courses
for each row execute function public.set_hanzihome_updated_at();

drop trigger if exists set_hanzihome_course_books_updated_at
on public.hanzihome_course_books;

create trigger set_hanzihome_course_books_updated_at
before update on public.hanzihome_course_books
for each row execute function public.set_hanzihome_updated_at();

commit;
