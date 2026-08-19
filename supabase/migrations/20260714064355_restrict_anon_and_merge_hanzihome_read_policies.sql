revoke all privileges on all tables in schema public from anon;
revoke all privileges on all sequences in schema public from anon;

revoke execute on function public.get_hanzihome_aggregate_vocab(text, text, text, text, integer)
from public, anon;
grant execute on function public.get_hanzihome_aggregate_vocab(text, text, text, text, integer)
to authenticated;

revoke execute on function public.get_hanzihome_aggregate_grammar(text, text, text, text, integer)
from public, anon;
grant execute on function public.get_hanzihome_aggregate_grammar(text, text, text, text, integer)
to authenticated;

revoke execute on function public.is_hanzihome_content_editor()
from public, anon;
grant execute on function public.is_hanzihome_content_editor()
to authenticated;

do $$
declare
  table_name text;
  active_read_qual text;
  target_tables constant text[] := array[
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
  ];
begin
  foreach table_name in array target_tables
  loop
    select policy.qual
    into active_read_qual
    from pg_policies policy
    where policy.schemaname = 'public'
      and policy.tablename = table_name
      and policy.policyname = 'HanziHome canonical active reads';

    if active_read_qual is null then
      raise exception 'Missing canonical active read policy for public.%', table_name;
    end if;

    execute format(
      'drop policy %I on public.%I',
      'HanziHome canonical active reads',
      table_name
    );
    execute format(
      'drop policy %I on public.%I',
      'HanziHome editors can read deleted content',
      table_name
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using ((%s) or (select public.can_edit_hanzihome_content()))',
      'HanziHome authenticated reads',
      table_name,
      active_read_qual
    );
  end loop;
end
$$;
