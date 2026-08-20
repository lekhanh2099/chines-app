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

create table if not exists public.hanzihome_courses (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade,
  slug text not null,
  title text not null,
  subtitle text,
  type text not null default 'custom',
  course_order integer not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null default 'custom',
  imported_at timestamptz,

  constraint hanzihome_courses_type_check
    check (type in ('hanyu', 'hsk', 'listening', 'custom'))
);

create table if not exists public.hanzihome_course_books (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade,
  course_id text not null references public.hanzihome_courses(id) on delete cascade,
  title text not null,
  short_title text,
  book_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null default 'custom',
  imported_at timestamptz
);

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

alter table public.hanzihome_courses enable row level security;
alter table public.hanzihome_course_books enable row level security;
alter table public.hanzihome_lessons enable row level security;
alter table public.hanzihome_lesson_texts enable row level security;
alter table public.hanzihome_vocab_items enable row level security;
alter table public.hanzihome_vocab_examples enable row level security;
alter table public.hanzihome_vocab_detail_sections enable row level security;
alter table public.hanzihome_grammar_points enable row level security;
alter table public.hanzihome_grammar_examples enable row level security;
alter table public.hanzihome_grammar_detail_sections enable row level security;

commit;
