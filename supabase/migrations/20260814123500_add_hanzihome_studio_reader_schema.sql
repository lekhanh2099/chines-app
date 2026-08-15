begin;

create extension if not exists pgcrypto;

create table if not exists public.hanzihome_reading_documents (
  id text primary key,
  lesson_id text not null references public.hanzihome_lessons(id) on delete cascade,
  owner_id uuid null references auth.users(id) on delete cascade,
  source text not null default 'seed' check (source in ('seed', 'custom')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  kind text not null check (kind in ('core', 'mock', 'reinforcement')),
  slug text not null,
  unit_id text null,
  reading_number integer null check (reading_number is null or reading_number > 0),
  title_zh text not null,
  title_pinyin text not null default '',
  title_vi text not null default '',
  genre_vi text not null default '',
  objectives_vi text[] not null default '{}',
  analysis jsonb not null default '{"mainIdeaVi":"","paragraphStructureVi":[],"logicChainVi":[],"trapsVi":[],"keywordsZh":[]}'::jsonb check (jsonb_typeof(analysis) = 'object'),
  summary jsonb not null default '{"modelZh":"","rubricVi":[]}'::jsonb check (jsonb_typeof(summary) = 'object'),
  source_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(source_metadata) = 'object'),
  schema_version text not null default '1.0.0',
  imported_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  unique (source, slug),
  constraint hanzihome_reading_documents_source_owner_check
    check (source = 'seed' or owner_id is not null)
);

create index if not exists hanzihome_reading_documents_lesson_idx
  on public.hanzihome_reading_documents (lesson_id, kind, slug)
  where deleted_at is null;
create index if not exists hanzihome_reading_documents_publication_idx
  on public.hanzihome_reading_documents (publication_status, kind)
  where deleted_at is null;

create table if not exists public.hanzihome_reading_paragraphs (
  id text primary key,
  document_id text not null references public.hanzihome_reading_documents(id) on delete cascade,
  source text not null default 'seed' check (source in ('seed', 'custom')),
  paragraph_order integer not null check (paragraph_order > 0),
  zh text not null,
  pinyin text not null default '',
  vi text not null default '',
  role_vi text not null default '',
  source_version integer not null default 1 check (source_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, paragraph_order)
);

create index if not exists hanzihome_reading_paragraphs_document_idx
  on public.hanzihome_reading_paragraphs (document_id, paragraph_order);

create table if not exists public.hanzihome_reading_vocab_links (
  id text primary key,
  document_id text not null references public.hanzihome_reading_documents(id) on delete cascade,
  vocab_item_id text not null references public.hanzihome_vocab_items(id) on delete cascade,
  source text not null default 'seed' check (source in ('seed', 'custom')),
  item_order integer not null check (item_order > 0),
  meaning_in_context_vi text not null default '',
  source_ref text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, item_order),
  unique (document_id, vocab_item_id)
);

create index if not exists hanzihome_reading_vocab_links_vocab_idx
  on public.hanzihome_reading_vocab_links (vocab_item_id);

create table if not exists public.hanzihome_reading_exercise_groups (
  id text primary key,
  document_id text not null references public.hanzihome_reading_documents(id) on delete cascade,
  source text not null default 'seed' check (source in ('seed', 'custom')),
  exercise_order integer not null check (exercise_order > 0),
  exercise_type text not null check (exercise_type in (
    'notes', 'vocabulary_review', 'true_false', 'multiple_choice',
    'short_answer', 'fill_blank', 'discussion', 'mock_questions'
  )),
  title_zh text not null default '',
  title_vi text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, exercise_order)
);

create table if not exists public.hanzihome_reading_exercise_items (
  id text primary key,
  group_id text not null references public.hanzihome_reading_exercise_groups(id) on delete cascade,
  source text not null default 'seed' check (source in ('seed', 'custom')),
  item_order integer not null check (item_order > 0),
  item_type text not null check (item_type in (
    'note', 'multiple_choice', 'true_false', 'short_answer',
    'answer_review', 'fill_blank', 'discussion'
  )),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, item_order)
);

create index if not exists hanzihome_reading_exercise_items_group_idx
  on public.hanzihome_reading_exercise_items (group_id, item_order);

create table if not exists public.hanzihome_reading_assets (
  id text primary key,
  document_id text null references public.hanzihome_reading_documents(id) on delete cascade,
  source text not null default 'seed' check (source in ('seed', 'custom')),
  asset_type text not null check (asset_type in ('pdf', 'audio', 'image', 'other')),
  source_path text not null,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  storage_bucket text null,
  storage_path text null,
  external_url text null,
  mime_type text null,
  rights_status text not null check (rights_status in ('public-domain', 'original', 'licensed', 'unknown', 'blocked')),
  redistribution_allowed boolean not null default false,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hanzihome_reading_assets_location_check check (
    (storage_bucket is not null and storage_path is not null) or external_url is not null
  ),
  constraint hanzihome_reading_assets_rights_check check (
    redistribution_allowed = true or source = 'custom'
  )
);

create unique index if not exists hanzihome_reading_assets_sha256_idx
  on public.hanzihome_reading_assets (sha256, source_path);

create table if not exists public.hanzihome_reader_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id text not null references public.hanzihome_reading_documents(id) on delete cascade,
  show_pinyin boolean not null default false,
  show_meaning boolean not null default false,
  completed boolean not null default false,
  summary_text text not null default '',
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, document_id)
);

create table if not exists public.hanzihome_reader_annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id text not null references public.hanzihome_reading_documents(id) on delete cascade,
  paragraph_id text null references public.hanzihome_reading_paragraphs(id) on delete cascade,
  asset_id text null references public.hanzihome_reading_assets(id) on delete cascade,
  annotation_type text not null check (annotation_type in ('highlight', 'underline', 'note', 'ink')),
  page_number integer null check (page_number is null or page_number > 0),
  start_offset integer null check (start_offset is null or start_offset >= 0),
  end_offset integer null check (end_offset is null or end_offset > start_offset),
  selected_text text not null default '',
  note_text text not null default '',
  color text not null default 'yellow' check (color in ('yellow', 'green', 'blue', 'pink')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  constraint hanzihome_reader_annotations_target_check check (
    (paragraph_id is not null)::integer + (asset_id is not null)::integer = 1
  ),
  constraint hanzihome_reader_annotations_page_check check (
    asset_id is not null or page_number is null
  ),
  constraint hanzihome_reader_annotations_range_check check (
    (start_offset is null and end_offset is null)
    or (start_offset is not null and end_offset is not null and end_offset > start_offset)
  )
);

create index if not exists hanzihome_reader_annotations_document_idx
  on public.hanzihome_reader_annotations (user_id, document_id, paragraph_id, updated_at desc)
  where deleted_at is null;

create unique index if not exists hanzihome_reader_annotations_range_idx
  on public.hanzihome_reader_annotations (
    user_id, document_id, paragraph_id, asset_id, annotation_type, page_number,
    start_offset, end_offset
  )
  where deleted_at is null and start_offset is not null and end_offset is not null;

create table if not exists public.hanzihome_practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  surface text not null check (surface in ('reader', 'dictation', 'translation', 'listening', 'personal-learning')),
  content_id text not null,
  direction text null,
  answer jsonb not null default '{}'::jsonb check (jsonb_typeof(answer) = 'object'),
  score numeric(5, 4) null check (score is null or (score >= 0 and score <= 1)),
  response_ms integer null check (response_ms is null or response_ms >= 0),
  created_at timestamptz not null default now()
);

create index if not exists hanzihome_practice_attempts_user_content_idx
  on public.hanzihome_practice_attempts (user_id, surface, content_id, created_at desc);

create table if not exists public.hanzihome_personal_learning_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null,
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object'),
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, node_id)
);

create table if not exists public.hanzihome_daily_reading_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  published_date date not null,
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object'),
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, published_date)
);

create table if not exists public.hanzihome_tts_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.hanzihome_tts_clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid null references public.hanzihome_tts_folders(id) on delete set null,
  title text not null default '',
  text text not null check (length(btrim(text)) > 0),
  voice text not null check (length(btrim(voice)) > 0),
  rate numeric(4, 2) not null check (rate > 0 and rate <= 3),
  cache_key text not null check (length(btrim(cache_key)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, cache_key)
);

create index if not exists hanzihome_tts_clips_folder_idx
  on public.hanzihome_tts_clips (user_id, folder_id, created_at desc);

create or replace function public.hanzihome_studio_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.hanzihome_reader_annotations_parent_check()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.paragraph_id is not null and not exists (
    select 1
    from public.hanzihome_reading_paragraphs paragraph
    where paragraph.id = new.paragraph_id
      and paragraph.document_id = new.document_id
  ) then
    raise exception 'Reader annotation paragraph does not belong to the document';
  end if;

  if new.asset_id is not null and not exists (
    select 1
    from public.hanzihome_reading_assets asset
    where asset.id = new.asset_id
      and (asset.document_id is null or asset.document_id = new.document_id)
  ) then
    raise exception 'Reader annotation asset does not belong to the document';
  end if;

  return new;
end;
$$;

drop trigger if exists hanzihome_reader_annotations_parent_check
  on public.hanzihome_reader_annotations;
create trigger hanzihome_reader_annotations_parent_check
before insert or update on public.hanzihome_reader_annotations
for each row execute function public.hanzihome_reader_annotations_parent_check();

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'hanzihome_reading_documents',
    'hanzihome_reading_paragraphs',
    'hanzihome_reading_vocab_links',
    'hanzihome_reading_exercise_groups',
    'hanzihome_reading_exercise_items',
    'hanzihome_reading_assets',
    'hanzihome_reader_progress',
    'hanzihome_reader_annotations',
    'hanzihome_personal_learning_state',
    'hanzihome_daily_reading_state',
    'hanzihome_tts_folders',
    'hanzihome_tts_clips'
  ] loop
    execute format('drop trigger if exists %I_updated_at on public.%I', target_table, target_table);
    execute format(
      'create trigger %I_updated_at before update on public.%I for each row execute function public.hanzihome_studio_touch_updated_at()',
      target_table,
      target_table
    );
  end loop;
end;
$$;

alter table public.hanzihome_reading_documents enable row level security;
alter table public.hanzihome_reading_paragraphs enable row level security;
alter table public.hanzihome_reading_vocab_links enable row level security;
alter table public.hanzihome_reading_exercise_groups enable row level security;
alter table public.hanzihome_reading_exercise_items enable row level security;
alter table public.hanzihome_reading_assets enable row level security;
alter table public.hanzihome_reader_progress enable row level security;
alter table public.hanzihome_reader_annotations enable row level security;
alter table public.hanzihome_practice_attempts enable row level security;
alter table public.hanzihome_personal_learning_state enable row level security;
alter table public.hanzihome_daily_reading_state enable row level security;
alter table public.hanzihome_tts_folders enable row level security;
alter table public.hanzihome_tts_clips enable row level security;

create policy "Anyone can read published Studio reading documents"
on public.hanzihome_reading_documents for select
using (deleted_at is null and publication_status = 'published');

create policy "HanziHome editors can manage Studio reading documents"
on public.hanzihome_reading_documents for all to authenticated
using ((select public.can_edit_hanzihome_content()) or (source = 'custom' and owner_id = (select auth.uid())))
with check ((select public.can_edit_hanzihome_content()) or (source = 'custom' and owner_id = (select auth.uid())));

create policy "Anyone can read published Studio reading paragraphs"
on public.hanzihome_reading_paragraphs for select
using (exists (
  select 1 from public.hanzihome_reading_documents document
  where document.id = document_id and document.deleted_at is null and document.publication_status = 'published'
));

create policy "HanziHome editors can manage Studio reading paragraphs"
on public.hanzihome_reading_paragraphs for all to authenticated
using ((select public.can_edit_hanzihome_content()))
with check ((select public.can_edit_hanzihome_content()));

create policy "Anyone can read published Studio reading vocabulary links"
on public.hanzihome_reading_vocab_links for select
using (exists (
  select 1 from public.hanzihome_reading_documents document
  where document.id = document_id and document.deleted_at is null and document.publication_status = 'published'
));

create policy "HanziHome editors can manage Studio reading vocabulary links"
on public.hanzihome_reading_vocab_links for all to authenticated
using ((select public.can_edit_hanzihome_content()))
with check ((select public.can_edit_hanzihome_content()));

create policy "Anyone can read published Studio reading exercise groups"
on public.hanzihome_reading_exercise_groups for select
using (exists (
  select 1
  from public.hanzihome_reading_documents document
  where document.id = document_id and document.deleted_at is null and document.publication_status = 'published'
));

create policy "HanziHome editors can manage Studio reading exercise groups"
on public.hanzihome_reading_exercise_groups for all to authenticated
using ((select public.can_edit_hanzihome_content()))
with check ((select public.can_edit_hanzihome_content()));

create policy "Anyone can read published Studio reading exercise items"
on public.hanzihome_reading_exercise_items for select
using (exists (
  select 1
  from public.hanzihome_reading_exercise_groups group_row
  join public.hanzihome_reading_documents document on document.id = group_row.document_id
  where group_row.id = group_id and document.deleted_at is null and document.publication_status = 'published'
));

create policy "HanziHome editors can manage Studio reading exercise items"
on public.hanzihome_reading_exercise_items for all to authenticated
using ((select public.can_edit_hanzihome_content()))
with check ((select public.can_edit_hanzihome_content()));

create policy "Anyone can read distributable Studio reading assets"
on public.hanzihome_reading_assets for select
using (redistribution_allowed = true and rights_status not in ('unknown', 'blocked'));

create policy "HanziHome editors can manage Studio reading assets"
on public.hanzihome_reading_assets for all to authenticated
using ((select public.can_edit_hanzihome_content()))
with check ((select public.can_edit_hanzihome_content()));

create policy "Users can manage own Studio reader progress"
on public.hanzihome_reader_progress for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can manage own Studio reader annotations"
on public.hanzihome_reader_annotations for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can manage own Studio practice attempts"
on public.hanzihome_practice_attempts for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can manage own Studio personal learning state"
on public.hanzihome_personal_learning_state for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can manage own Studio daily reading state"
on public.hanzihome_daily_reading_state for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can manage own HanziHome TTS folders"
on public.hanzihome_tts_folders for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can manage own HanziHome TTS clips"
on public.hanzihome_tts_clips for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

revoke all on table
  public.hanzihome_reading_documents,
  public.hanzihome_reading_paragraphs,
  public.hanzihome_reading_vocab_links,
  public.hanzihome_reading_exercise_groups,
  public.hanzihome_reading_exercise_items,
  public.hanzihome_reading_assets,
  public.hanzihome_reader_progress,
  public.hanzihome_reader_annotations,
  public.hanzihome_practice_attempts,
  public.hanzihome_personal_learning_state,
  public.hanzihome_daily_reading_state,
  public.hanzihome_tts_folders,
  public.hanzihome_tts_clips
from anon, authenticated;

grant select on table
  public.hanzihome_reading_documents,
  public.hanzihome_reading_paragraphs,
  public.hanzihome_reading_vocab_links,
  public.hanzihome_reading_exercise_groups,
  public.hanzihome_reading_exercise_items,
  public.hanzihome_reading_assets
to anon, authenticated;

grant select, insert, update, delete on table
  public.hanzihome_reading_documents,
  public.hanzihome_reading_paragraphs,
  public.hanzihome_reading_vocab_links,
  public.hanzihome_reading_exercise_groups,
  public.hanzihome_reading_exercise_items,
  public.hanzihome_reading_assets,
  public.hanzihome_reader_progress,
  public.hanzihome_reader_annotations,
  public.hanzihome_practice_attempts,
  public.hanzihome_personal_learning_state,
  public.hanzihome_daily_reading_state,
  public.hanzihome_tts_folders,
  public.hanzihome_tts_clips
to authenticated;

comment on table public.hanzihome_reading_documents is
  'Typed Reader content contract retained for future authored rows. Published Hanzi Studio content is served from the checked-in static JSON package; runtime does not require content rows in this table.';

comment on table public.hanzihome_reader_annotations is
  'New HanziHome Reader annotations only. Existing Studio localStorage, IndexedDB, Convex annotations, and other user state are not imported.';

comment on table public.hanzihome_reading_exercise_items is
  'Exercise payloads are validated by the owning HanziHome exercise-family schemas before rendering or persistence.';

commit;
