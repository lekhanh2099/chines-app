begin;

create table if not exists public.hanzihome_learning_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  draft_id uuid references public.hanzihome_lesson_drafts(id) on delete set null,
  lesson_id text references public.hanzihome_lessons(id) on delete set null,
  kind text not null check (kind in ('grammar', 'lesson', 'vocab')),
  title text,
  book text,
  lesson_no integer,
  source_type text not null default 'markdown'
    check (source_type in ('markdown', 'manual', 'json_import')),
  source_markdown text,
  parser_version text not null,
  parse_status text not null default 'success'
    check (parse_status in ('success', 'partial', 'failed')),
  parse_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hanzihome_import_grammar_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.hanzihome_learning_documents(id)
    on delete cascade,
  lesson_id text references public.hanzihome_lessons(id) on delete set null,
  order_index integer not null default 0,
  title text not null,
  source_heading text,
  normalized_heading text,
  confidence numeric not null default 0
    check (confidence >= 0 and confidence <= 1),
  fallback boolean not null default false,
  fallback_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hanzihome_lesson_sections (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.hanzihome_learning_documents(id)
    on delete cascade,
  lesson_id text references public.hanzihome_lessons(id) on delete set null,
  section_type text not null
    check (
      section_type in (
        'text',
        'vocab',
        'notes',
        'grammar',
        'exercises',
        'reading',
        'handwriting',
        'other'
      )
    ),
  title text not null,
  source_heading text,
  normalized_heading text,
  order_index integer not null default 0,
  raw_markdown text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hanzihome_learning_field_values (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.hanzihome_learning_documents(id)
    on delete cascade,
  owner_type text not null check (owner_type in ('grammar_item', 'lesson_section')),
  owner_id uuid not null,
  field_name text not null,
  order_index integer not null default 0,
  value_kind text not null check (value_kind in ('text', 'list', 'table', 'examples')),
  text_value text,
  list_value text[],
  table_value jsonb,
  examples_value jsonb,
  raw_markdown text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hanzihome_learning_field_values_value_check check (
    (value_kind = 'text' and text_value is not null) or
    (value_kind = 'list' and list_value is not null) or
    (value_kind = 'table' and table_value is not null) or
    (value_kind = 'examples' and examples_value is not null)
  )
);

create table if not exists public.hanzihome_unmapped_sections (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.hanzihome_learning_documents(id)
    on delete cascade,
  owner_type text check (owner_type in ('document', 'grammar_item', 'lesson_section')),
  owner_id uuid,
  title text,
  normalized_title text,
  content text not null,
  reason text not null
    check (
      reason in (
        'UNKNOWN_HEADING',
        'LOW_CONFIDENCE',
        'UNSUPPORTED_STRUCTURE',
        'NO_FIELD_MATCH',
        'PARSER_ERROR'
      )
    ),
  suggested_field_name text,
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  resolved boolean not null default false,
  resolved_as jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hanzihome_parse_warnings (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.hanzihome_learning_documents(id)
    on delete cascade,
  owner_type text check (owner_type in ('document', 'grammar_item', 'lesson_section')),
  owner_id uuid,
  type text not null
    check (
      type in (
        'FALLBACK_USED',
        'LOW_CONFIDENCE',
        'UNKNOWN_SECTION',
        'DROPPED_CONTENT',
        'EXAMPLE_PARTIAL',
        'ROOT_DETECTION_UNCERTAIN'
      )
    ),
  message text not null,
  severity text not null default 'warning'
    check (severity in ('info', 'warning', 'error')),
  created_at timestamptz not null default now()
);

create index if not exists hanzihome_learning_documents_owner_kind_idx
on public.hanzihome_learning_documents(owner_id, kind, updated_at desc);

create index if not exists hanzihome_learning_documents_lesson_idx
on public.hanzihome_learning_documents(lesson_id);

create index if not exists hanzihome_learning_documents_draft_idx
on public.hanzihome_learning_documents(draft_id);

create index if not exists hanzihome_import_grammar_items_document_order_idx
on public.hanzihome_import_grammar_items(document_id, order_index);

create index if not exists hanzihome_lesson_sections_document_order_idx
on public.hanzihome_lesson_sections(document_id, order_index);

create index if not exists hanzihome_learning_field_values_owner_idx
on public.hanzihome_learning_field_values(owner_type, owner_id, order_index);

create index if not exists hanzihome_learning_field_values_document_idx
on public.hanzihome_learning_field_values(document_id);

create index if not exists hanzihome_unmapped_sections_document_idx
on public.hanzihome_unmapped_sections(document_id, resolved);

create index if not exists hanzihome_parse_warnings_document_idx
on public.hanzihome_parse_warnings(document_id, severity);

drop trigger if exists set_hanzihome_learning_documents_updated_at
on public.hanzihome_learning_documents;
create trigger set_hanzihome_learning_documents_updated_at
before update on public.hanzihome_learning_documents
for each row execute function public.set_hanzihome_updated_at();

drop trigger if exists set_hanzihome_import_grammar_items_updated_at
on public.hanzihome_import_grammar_items;
create trigger set_hanzihome_import_grammar_items_updated_at
before update on public.hanzihome_import_grammar_items
for each row execute function public.set_hanzihome_updated_at();

drop trigger if exists set_hanzihome_lesson_sections_updated_at
on public.hanzihome_lesson_sections;
create trigger set_hanzihome_lesson_sections_updated_at
before update on public.hanzihome_lesson_sections
for each row execute function public.set_hanzihome_updated_at();

drop trigger if exists set_hanzihome_learning_field_values_updated_at
on public.hanzihome_learning_field_values;
create trigger set_hanzihome_learning_field_values_updated_at
before update on public.hanzihome_learning_field_values
for each row execute function public.set_hanzihome_updated_at();

drop trigger if exists set_hanzihome_unmapped_sections_updated_at
on public.hanzihome_unmapped_sections;
create trigger set_hanzihome_unmapped_sections_updated_at
before update on public.hanzihome_unmapped_sections
for each row execute function public.set_hanzihome_updated_at();

alter table public.hanzihome_learning_documents enable row level security;
alter table public.hanzihome_import_grammar_items enable row level security;
alter table public.hanzihome_lesson_sections enable row level security;
alter table public.hanzihome_learning_field_values enable row level security;
alter table public.hanzihome_unmapped_sections enable row level security;
alter table public.hanzihome_parse_warnings enable row level security;

drop policy if exists "Users manage own hanzihome learning documents"
on public.hanzihome_learning_documents;

create policy "Users manage own hanzihome learning documents"
on public.hanzihome_learning_documents
for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Users manage own hanzihome import grammar items"
on public.hanzihome_import_grammar_items;

create policy "Users manage own hanzihome import grammar items"
on public.hanzihome_import_grammar_items
for all
to authenticated
using (
  exists (
    select 1
    from public.hanzihome_learning_documents document
    where document.id = document_id
      and document.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.hanzihome_learning_documents document
    where document.id = document_id
      and document.owner_id = auth.uid()
  )
);

drop policy if exists "Users manage own hanzihome lesson sections"
on public.hanzihome_lesson_sections;

create policy "Users manage own hanzihome lesson sections"
on public.hanzihome_lesson_sections
for all
to authenticated
using (
  exists (
    select 1
    from public.hanzihome_learning_documents document
    where document.id = document_id
      and document.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.hanzihome_learning_documents document
    where document.id = document_id
      and document.owner_id = auth.uid()
  )
);

drop policy if exists "Users manage own hanzihome learning field values"
on public.hanzihome_learning_field_values;

create policy "Users manage own hanzihome learning field values"
on public.hanzihome_learning_field_values
for all
to authenticated
using (
  exists (
    select 1
    from public.hanzihome_learning_documents document
    where document.id = document_id
      and document.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.hanzihome_learning_documents document
    where document.id = document_id
      and document.owner_id = auth.uid()
  )
);

drop policy if exists "Users manage own hanzihome unmapped sections"
on public.hanzihome_unmapped_sections;

create policy "Users manage own hanzihome unmapped sections"
on public.hanzihome_unmapped_sections
for all
to authenticated
using (
  exists (
    select 1
    from public.hanzihome_learning_documents document
    where document.id = document_id
      and document.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.hanzihome_learning_documents document
    where document.id = document_id
      and document.owner_id = auth.uid()
  )
);

drop policy if exists "Users read own hanzihome parse warnings"
on public.hanzihome_parse_warnings;

create policy "Users read own hanzihome parse warnings"
on public.hanzihome_parse_warnings
for select
to authenticated
using (
  exists (
    select 1
    from public.hanzihome_learning_documents document
    where document.id = document_id
      and document.owner_id = auth.uid()
  )
);

drop policy if exists "Users insert own hanzihome parse warnings"
on public.hanzihome_parse_warnings;

create policy "Users insert own hanzihome parse warnings"
on public.hanzihome_parse_warnings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.hanzihome_learning_documents document
    where document.id = document_id
      and document.owner_id = auth.uid()
  )
);

comment on table public.hanzihome_learning_documents is
  'Smart Markdown parser import documents. Stores raw source, parser version, parse metadata, and status for re-parse/debug without replacing canonical lesson data.';

comment on table public.hanzihome_learning_field_values is
  'Structured parser field values for grammar items and lesson sections. Supports text, list, table, and examples blocks.';

commit;
