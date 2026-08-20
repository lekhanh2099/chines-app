-- Add category and status columns to notes table for Smart Note Categorization

-- Category: Classifies the type of knowledge
-- 'grammar' = Ngữ pháp, 'vocabulary' = Từ vựng, 'culture' = Văn hóa/Mẹo, 'general' = Chung
alter table public.notes
  add column category text default 'general'
  check (category in ('grammar', 'vocabulary', 'culture', 'general'));

-- Status: Tracks the review/mastery state of the note
-- 'draft' = Bản nháp, 'reviewed' = Đã ôn, 'mastered' = Thuần thục
alter table public.notes
  add column status text default 'draft'
  check (status in ('draft', 'reviewed', 'mastered'));

-- Index for fast category-based queries (e.g., Grammar page)
create index idx_notes_category on public.notes (category);
create index idx_notes_user_category on public.notes (user_id, category);
