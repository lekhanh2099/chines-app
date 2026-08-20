-- Add split view support to notes table
-- reading_content stores the Lexical JSON for the left reading pane
-- split_view_enabled remembers whether split view was active

alter table public.notes
  add column if not exists reading_content jsonb default null,
  add column if not exists split_view_enabled boolean default false;
