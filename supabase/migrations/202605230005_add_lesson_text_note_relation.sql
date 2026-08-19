alter table public.lesson_note_links
drop constraint if exists lesson_note_links_relation_type_check;

alter table public.lesson_note_links
add constraint lesson_note_links_relation_type_check
check (relation_type in ('main', 'lesson_text', 'vocab', 'grammar', 'annotation'));
