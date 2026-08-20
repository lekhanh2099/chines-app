begin;

-- Reader corpus is served from the reviewed static package. These normalized
-- tables have never contained live content, while user-owned state keeps
-- stable static IDs without foreign keys to this retired contract.
--
-- Do not use CASCADE: a newly introduced dependency must fail this migration
-- rather than be removed implicitly.
drop table public.hanzihome_reading_exercise_items;
drop table public.hanzihome_reading_vocab_links;
drop table public.hanzihome_reading_assets;
drop table public.hanzihome_reading_paragraphs;
drop table public.hanzihome_reading_exercise_groups;
drop table public.hanzihome_reading_documents;

-- The parent constraints were detached in the prior static-content cutover,
-- leaving these validation triggers unreachable.
drop function public.hanzihome_reader_annotations_parent_check();
drop function public.hanzihome_reader_pronunciation_override_parent_check();

commit;
