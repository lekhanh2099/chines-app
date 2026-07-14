-- Cache auth.uid() once per statement for the existing ownership policies.
-- The policy commands, roles, and boolean expressions remain unchanged.
do $migration$
declare
  policy_row record;
  optimized_qual text;
  optimized_check text;
begin
  for policy_row in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        coalesce(qual, '') like '%auth.uid()%'
        or coalesce(with_check, '') like '%auth.uid()%'
      )
      and coalesce(qual, '') not like '%SELECT auth.uid()%'
      and coalesce(with_check, '') not like '%SELECT auth.uid()%'
  loop
    optimized_qual := replace(policy_row.qual, 'auth.uid()', '(select auth.uid())');
    optimized_check := replace(policy_row.with_check, 'auth.uid()', '(select auth.uid())');

    execute format(
      'alter policy %I on %I.%I%s%s',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename,
      case
        when optimized_qual is null then ''
        else format(' using (%s)', optimized_qual)
      end,
      case
        when optimized_check is null then ''
        else format(' with check (%s)', optimized_check)
      end
    );
  end loop;
end
$migration$;

-- Aggregate endpoints filter these denormalized foreign keys directly.
create index if not exists hanzihome_vocab_items_course_id_idx
  on public.hanzihome_vocab_items (course_id);
create index if not exists hanzihome_vocab_items_book_id_idx
  on public.hanzihome_vocab_items (book_id);
create index if not exists hanzihome_grammar_points_course_id_idx
  on public.hanzihome_grammar_points (course_id);
create index if not exists hanzihome_grammar_points_book_id_idx
  on public.hanzihome_grammar_points (book_id);

-- Lesson-detail embedding and FK maintenance use these direct lesson links.
create index if not exists hanzihome_vocab_examples_lesson_id_idx
  on public.hanzihome_vocab_examples (lesson_id);
create index if not exists hanzihome_vocab_detail_sections_lesson_id_idx
  on public.hanzihome_vocab_detail_sections (lesson_id);
create index if not exists hanzihome_grammar_examples_lesson_id_idx
  on public.hanzihome_grammar_examples (lesson_id);
create index if not exists hanzihome_grammar_detail_sections_lesson_id_idx
  on public.hanzihome_grammar_detail_sections (lesson_id);

-- Legacy vocabulary routes perform reverse lookups by the referenced row.
create index if not exists user_vocab_progress_vocab_id_idx
  on public.user_vocab_progress (vocab_id);
create index if not exists user_vocabularies_dictionary_id_idx
  on public.user_vocabularies (dictionary_id);
