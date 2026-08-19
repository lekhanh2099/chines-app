-- Listening runtime alignment for lesson-scoped reads and native-TTS transcripts.
-- Seed artifacts remain import-only; the application reads normalized Supabase rows.

alter table public.hanzihome_listening_items
  add column if not exists transcript jsonb;

alter table public.hanzihome_listening_items
  drop constraint if exists hanzihome_listening_items_transcript_check;

alter table public.hanzihome_listening_items
  add constraint hanzihome_listening_items_transcript_check
  check (transcript is null or jsonb_typeof(transcript) = 'object');

alter table public.hanzihome_listening_items
  drop constraint if exists hanzihome_listening_items_item_type_check;

alter table public.hanzihome_listening_items
  add constraint hanzihome_listening_items_item_type_check
  check (
    item_type = any (
      array[
        'sentence_mcq'::text,
        'dialogue_mcq'::text,
        'passage_mcq'::text,
        'stress_choice'::text,
        'true_false'::text,
        'matching'::text,
        'fill_blank'::text,
        'open_answer'::text,
        'oral_response'::text,
        'shadowing'::text,
        'dictation'::text
      ]
    )
  );

create unique index if not exists hanzihome_listening_items_section_order_unique_idx
  on public.hanzihome_listening_items (section_id, item_order)
  where deleted_at is null and section_id is not null;

create index if not exists hanzihome_listening_items_lesson_section_order_idx
  on public.hanzihome_listening_items (lesson_id, section_id, item_order)
  where deleted_at is null and publication_status = 'published';

create index if not exists hanzihome_listening_items_lesson_category_type_order_idx
  on public.hanzihome_listening_items (lesson_id, category, item_type, item_order)
  where deleted_at is null and publication_status = 'published';

create index if not exists hanzihome_listening_items_lesson_type_order_idx
  on public.hanzihome_listening_items (lesson_id, item_type, item_order)
  where deleted_at is null and publication_status = 'published';

grant select on table public.hanzihome_listening_items to anon;
grant select, insert, update, delete on table public.hanzihome_listening_items to authenticated;

comment on column public.hanzihome_listening_items.transcript is
  'Canonical structured transcript: mode, speakers, ordered zh/pinyin/vi lines, and full text for native Mandarin TTS.';

comment on table public.hanzihome_listening_items is
  'Listening exercise rows queried by lesson_id. Clients select explicit columns and never fetch the full course dataset.';
