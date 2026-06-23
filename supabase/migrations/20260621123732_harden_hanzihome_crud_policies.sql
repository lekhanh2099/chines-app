begin;

do $$
declare
  target_table_name text;
  policy_name text;
begin
  foreach target_table_name in array array[
    'hanzihome_courses',
    'hanzihome_course_books',
    'hanzihome_lessons',
    'hanzihome_lesson_sections',
    'hanzihome_lesson_texts',
    'hanzihome_vocab_items',
    'hanzihome_vocab_examples',
    'hanzihome_vocab_detail_sections',
    'hanzihome_grammar_points',
    'hanzihome_grammar_examples',
    'hanzihome_grammar_detail_sections'
  ]
  loop
    for policy_name in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = target_table_name
        and cmd <> 'SELECT'
    loop
      execute format('drop policy if exists %I on public.%I', policy_name, target_table_name);
    end loop;
  end loop;
end $$;

revoke all on table public.hanzihome_content_audit_log from anon;
grant select on table public.hanzihome_content_audit_log to authenticated;

commit;
