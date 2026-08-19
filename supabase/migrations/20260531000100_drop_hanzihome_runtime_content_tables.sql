begin;

drop function if exists public.get_hanzihome_aggregate_vocab(text, text, text, text, integer) cascade;
drop function if exists public.get_hanzihome_aggregate_grammar(text, text, text, text, integer) cascade;
drop function if exists public.is_hanzihome_content_editor() cascade;

drop table if exists public.hanzihome_parse_warnings cascade;
drop table if exists public.hanzihome_unmapped_sections cascade;
drop table if exists public.hanzihome_learning_field_values cascade;
drop table if exists public.hanzihome_import_grammar_items cascade;
drop table if exists public.hanzihome_lesson_sections cascade;
drop table if exists public.hanzihome_learning_documents cascade;

drop table if exists public.parse_warnings cascade;
drop table if exists public.unmapped_sections cascade;
drop table if exists public.learning_field_values cascade;
drop table if exists public.grammar_items cascade;
drop table if exists public.lesson_sections cascade;
drop table if exists public.learning_documents cascade;

drop table if exists public.hanzihome_vocab_detail_sections cascade;
drop table if exists public.hanzihome_vocab_examples cascade;
drop table if exists public.hanzihome_vocab_items cascade;
drop table if exists public.hanzihome_grammar_detail_sections cascade;
drop table if exists public.hanzihome_grammar_examples cascade;
drop table if exists public.hanzihome_grammar_points cascade;
drop table if exists public.hanzihome_lesson_texts cascade;
drop table if exists public.hanzihome_lessons cascade;
drop table if exists public.hanzihome_lesson_drafts cascade;
drop table if exists public.hanzihome_course_books cascade;
drop table if exists public.hanzihome_courses cascade;
drop table if exists public.hanzihome_content_editors cascade;

drop table if exists public.user_learning_state cascade;

drop function if exists public.set_hanzihome_updated_at() cascade;

commit;
