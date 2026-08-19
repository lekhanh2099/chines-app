-- Boya Listening: additive schema aligned with existing HanziHome course/book/lesson model.
-- Content rows are imported as draft first. Public clients only read published listening items.

create or replace function public.hanzihome_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.hanzihome_listening_items (
  id text primary key,
  lesson_id text not null references public.hanzihome_lessons(id) on delete cascade,
  section_id uuid null references public.hanzihome_lesson_sections(id) on delete set null,
  owner_id uuid null references auth.users(id) on delete cascade,
  source text not null default 'seed' check (source in ('seed','custom')),
  publication_status text not null default 'draft' check (publication_status in ('draft','published','archived')),
  source_item_key text not null,
  item_order integer not null check (item_order > 0),
  category text not null check (category in ('listening_comprehension','pronunciation','extra_practice')),
  item_type text not null check (item_type in ('sentence_mcq','dialogue_mcq','passage_mcq','true_false','matching','open_answer','shadowing','dictation')),
  section_title text null,
  transcript_zh text null,
  prompt_zh text null,
  translation_vi text null,
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  answer jsonb null check (answer is null or jsonb_typeof(answer) = 'object'),
  explanation_vi text null,
  tags text[] not null default '{}',
  quality_status text not null default 'needs_review' check (quality_status in ('verified','verified_structure','extracted','needs_review','missing_source')),
  quality_issues text[] not null default '{}',
  check_needed boolean not null default true,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  source_file text null,
  imported_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  deleted_by uuid null references auth.users(id),
  constraint hanzihome_listening_items_content_check check (transcript_zh is not null or prompt_zh is not null),
  constraint hanzihome_listening_items_source_key_unique unique (lesson_id, source_item_key)
);

create index if not exists hanzihome_listening_items_lesson_order_idx
  on public.hanzihome_listening_items (lesson_id, item_order)
  where deleted_at is null;
create index if not exists hanzihome_listening_items_filter_idx
  on public.hanzihome_listening_items (publication_status, category, item_type)
  where deleted_at is null;
create index if not exists hanzihome_listening_items_quality_idx
  on public.hanzihome_listening_items (quality_status, check_needed)
  where deleted_at is null;
create index if not exists hanzihome_listening_items_options_gin_idx
  on public.hanzihome_listening_items using gin (options);
create index if not exists hanzihome_listening_items_metadata_gin_idx
  on public.hanzihome_listening_items using gin (metadata);

create table if not exists public.hanzihome_listening_audio (
  id uuid primary key default gen_random_uuid(),
  lesson_id text not null references public.hanzihome_lessons(id) on delete cascade,
  item_id text null references public.hanzihome_listening_items(id) on delete cascade,
  section_id uuid null references public.hanzihome_lesson_sections(id) on delete set null,
  owner_id uuid null references auth.users(id) on delete cascade,
  source text not null default 'seed' check (source in ('seed','custom')),
  publication_status text not null default 'draft' check (publication_status in ('draft','published','archived')),
  audio_role text not null default 'source' check (audio_role in ('source','prompt','option','shadowing','dictation')),
  storage_bucket text null,
  storage_path text null,
  external_url text null,
  duration_ms integer null check (duration_ms is null or duration_ms >= 0),
  mime_type text null,
  speaker text null,
  variant text null,
  transcript_zh text null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  constraint hanzihome_listening_audio_location_check check (
    (storage_bucket is not null and storage_path is not null) or external_url is not null
  )
);

create index if not exists hanzihome_listening_audio_item_idx
  on public.hanzihome_listening_audio (item_id, audio_role)
  where deleted_at is null;
create unique index if not exists hanzihome_listening_audio_storage_unique_idx
  on public.hanzihome_listening_audio (storage_bucket, storage_path)
  where storage_bucket is not null and storage_path is not null and deleted_at is null;

create table if not exists public.hanzihome_listening_item_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references public.hanzihome_listening_items(id) on delete cascade,
  status text not null default 'new' check (status in ('new','learning','review','mastered')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  correct_count integer not null default 0 check (correct_count >= 0 and correct_count <= attempt_count),
  last_answer jsonb null,
  last_is_correct boolean null,
  mastery_score numeric(5,4) not null default 0 check (mastery_score >= 0 and mastery_score <= 1),
  last_position_ms integer not null default 0 check (last_position_ms >= 0),
  bookmarked boolean not null default false,
  personal_note text null,
  last_attempt_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create index if not exists hanzihome_listening_progress_review_idx
  on public.hanzihome_listening_item_progress (user_id, status, last_attempt_at);

create table if not exists public.hanzihome_listening_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references public.hanzihome_listening_items(id) on delete cascade,
  answer jsonb null,
  is_correct boolean null,
  score numeric(5,4) null check (score is null or (score >= 0 and score <= 1)),
  response_ms integer null check (response_ms is null or response_ms >= 0),
  listened_count integer not null default 0 check (listened_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists hanzihome_listening_attempts_user_item_idx
  on public.hanzihome_listening_attempts (user_id, item_id, created_at desc);

alter table public.hanzihome_listening_items enable row level security;
alter table public.hanzihome_listening_audio enable row level security;
alter table public.hanzihome_listening_item_progress enable row level security;
alter table public.hanzihome_listening_attempts enable row level security;

drop policy if exists "Boya listening public reads" on public.hanzihome_listening_items;
create policy "Boya listening public reads"
on public.hanzihome_listening_items
for select to anon, authenticated
using (deleted_at is null and publication_status = 'published');

drop policy if exists "Boya listening editors read all" on public.hanzihome_listening_items;
create policy "Boya listening editors read all"
on public.hanzihome_listening_items
for select to authenticated
using ((select public.can_edit_hanzihome_content()));

drop policy if exists "Boya listening editors write" on public.hanzihome_listening_items;
create policy "Boya listening editors write"
on public.hanzihome_listening_items
for all to authenticated
using ((select public.can_edit_hanzihome_content()) or (source = 'custom' and owner_id = (select auth.uid())))
with check ((select public.can_edit_hanzihome_content()) or (source = 'custom' and owner_id = (select auth.uid())));

drop policy if exists "Boya listening audio public reads" on public.hanzihome_listening_audio;
create policy "Boya listening audio public reads"
on public.hanzihome_listening_audio
for select to anon, authenticated
using (deleted_at is null and publication_status = 'published');

drop policy if exists "Boya listening audio editors" on public.hanzihome_listening_audio;
create policy "Boya listening audio editors"
on public.hanzihome_listening_audio
for all to authenticated
using ((select public.can_edit_hanzihome_content()) or (source = 'custom' and owner_id = (select auth.uid())))
with check ((select public.can_edit_hanzihome_content()) or (source = 'custom' and owner_id = (select auth.uid())));

drop policy if exists "Users own listening progress" on public.hanzihome_listening_item_progress;
create policy "Users own listening progress"
on public.hanzihome_listening_item_progress
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users own listening attempts" on public.hanzihome_listening_attempts;
create policy "Users own listening attempts"
on public.hanzihome_listening_attempts
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

grant select on public.hanzihome_listening_items, public.hanzihome_listening_audio to anon, authenticated;
grant insert, update, delete on public.hanzihome_listening_items, public.hanzihome_listening_audio to authenticated;
grant select, insert, update, delete on public.hanzihome_listening_item_progress, public.hanzihome_listening_attempts to authenticated;

create or replace trigger hanzihome_listening_items_touch_updated_at
before update on public.hanzihome_listening_items
for each row execute function public.hanzihome_touch_updated_at();

create or replace trigger hanzihome_listening_audio_touch_updated_at
before update on public.hanzihome_listening_audio
for each row execute function public.hanzihome_touch_updated_at();

create or replace trigger hanzihome_listening_progress_touch_updated_at
before update on public.hanzihome_listening_item_progress
for each row execute function public.hanzihome_touch_updated_at();

insert into public.hanzihome_courses (
  id, user_id, slug, title, subtitle, type, course_order, source, imported_at
) values (
  'boya-listening', null, 'boya-listening', 'Boya Listening', 'Giáo trình nghe Boya', 'listening', 20, 'seed', now()
)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  subtitle = excluded.subtitle,
  type = excluded.type,
  course_order = excluded.course_order,
  source = excluded.source,
  imported_at = excluded.imported_at,
  deleted_at = null,
  updated_at = now();

insert into public.hanzihome_course_books (
  id, user_id, course_id, title, short_title, book_order, source, imported_at
) values (
  'boya-listening-v2', null, 'boya-listening', 'Boya Listening · Quyển 2', 'Nghe Boya 2', 2, 'seed', now()
)
on conflict (id) do update set
  course_id = excluded.course_id,
  title = excluded.title,
  short_title = excluded.short_title,
  book_order = excluded.book_order,
  source = excluded.source,
  imported_at = excluded.imported_at,
  deleted_at = null,
  updated_at = now();

insert into public.hanzihome_lessons (id, course_id, book_id, owner_id, source, lesson_number, lesson_order, title_zh, title_vi, source_file, imported_at, tags)
values
  ('boya-listening-v2-l01', 'boya-listening', 'boya-listening-v2', null, 'seed', 1, 1, '第1课', 'Bài 1', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[]),
  ('boya-listening-v2-l02', 'boya-listening', 'boya-listening-v2', null, 'seed', 2, 2, '第2课', 'Bài 2', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[]),
  ('boya-listening-v2-l03', 'boya-listening', 'boya-listening-v2', null, 'seed', 3, 3, '第3课', 'Bài 3', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[]),
  ('boya-listening-v2-l04', 'boya-listening', 'boya-listening-v2', null, 'seed', 4, 4, '第4课', 'Bài 4', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[]),
  ('boya-listening-v2-l05', 'boya-listening', 'boya-listening-v2', null, 'seed', 5, 5, '第5课', 'Bài 5', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[]),
  ('boya-listening-v2-l06', 'boya-listening', 'boya-listening-v2', null, 'seed', 6, 6, '第6课', 'Bài 6', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:extracted']::text[]),
  ('boya-listening-v2-l07', 'boya-listening', 'boya-listening-v2', null, 'seed', 7, 7, '第7课', 'Bài 7', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[]),
  ('boya-listening-v2-l08', 'boya-listening', 'boya-listening-v2', null, 'seed', 8, 8, '第8课', 'Bài 8', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[]),
  ('boya-listening-v2-l09', 'boya-listening', 'boya-listening-v2', null, 'seed', 9, 9, '第9课', 'Bài 9', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[]),
  ('boya-listening-v2-l10', 'boya-listening', 'boya-listening-v2', null, 'seed', 10, 10, '第10课', 'Bài 10', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[]),
  ('boya-listening-v2-l11', 'boya-listening', 'boya-listening-v2', null, 'seed', 11, 11, '第11课', 'Bài 11', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[]),
  ('boya-listening-v2-l12', 'boya-listening', 'boya-listening-v2', null, 'seed', 12, 12, '第12课', 'Bài 12', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[]),
  ('boya-listening-v2-l13', 'boya-listening', 'boya-listening-v2', null, 'seed', 13, 13, '第13课', 'Bài 13', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[]),
  ('boya-listening-v2-l14', 'boya-listening', 'boya-listening-v2', null, 'seed', 14, 14, '第14课', 'Bài 14', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[]),
  ('boya-listening-v2-l15', 'boya-listening', 'boya-listening-v2', null, 'seed', 15, 15, '第15课', 'Bài 15', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[]),
  ('boya-listening-v2-l16', 'boya-listening', 'boya-listening-v2', null, 'seed', 16, 16, '第16课', 'Bài 16', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[]),
  ('boya-listening-v2-l17', 'boya-listening', 'boya-listening-v2', null, 'seed', 17, 17, '第17课', 'Bài 17', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[]),
  ('boya-listening-v2-l18', 'boya-listening', 'boya-listening-v2', null, 'seed', 18, 18, '第18课', 'Bài 18', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[]),
  ('boya-listening-v2-l19', 'boya-listening', 'boya-listening-v2', null, 'seed', 19, 19, '第19课', 'Bài 19', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[]),
  ('boya-listening-v2-l20', 'boya-listening', 'boya-listening-v2', null, 'seed', 20, 20, '第20课', 'Bài 20', 'Văn bản đã dán (1)(1).txt', now(), ARRAY['boya','listening','volume-2','quality:needs_review']::text[])
on conflict (id) do update set
  course_id=excluded.course_id, book_id=excluded.book_id, lesson_number=excluded.lesson_number,
  lesson_order=excluded.lesson_order, title_zh=excluded.title_zh, title_vi=excluded.title_vi,
  source_file=excluded.source_file, imported_at=excluded.imported_at, tags=excluded.tags,
  deleted_at=null, updated_at=now();
