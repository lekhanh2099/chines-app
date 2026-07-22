begin;

do $$
declare
  v_schema constant text := 'backup_hanzihome_20260618';
  v_expected_tables constant text[] := array[
    'hanzihome_course_books',
    'hanzihome_courses',
    'hanzihome_grammar_detail_sections',
    'hanzihome_grammar_examples',
    'hanzihome_grammar_points',
    'hanzihome_lesson_texts',
    'hanzihome_lessons',
    'hanzihome_vocab_detail_sections',
    'hanzihome_vocab_examples',
    'hanzihome_vocab_items',
    'lesson_note_links',
    'notes'
  ]::text[];
  v_expected_counts constant jsonb := jsonb_build_object(
    'hanzihome_course_books', 7,
    'hanzihome_courses', 6,
    'hanzihome_grammar_detail_sections', 93,
    'hanzihome_grammar_examples', 759,
    'hanzihome_grammar_points', 140,
    'hanzihome_lesson_texts', 52,
    'hanzihome_lessons', 53,
    'hanzihome_vocab_detail_sections', 12363,
    'hanzihome_vocab_examples', 6519,
    'hanzihome_vocab_items', 2229,
    'lesson_note_links', 8,
    'notes', 16
  );
  v_actual_tables text[];
  v_table record;
  v_actual_count bigint;
begin
  if not exists (select 1 from pg_catalog.pg_namespace where nspname = v_schema) then
    raise exception using errcode = '3F000', message = 'Expected legacy HanziHome backup schema is missing';
  end if;

  select array_agg(c.relname order by c.relname)
  into v_actual_tables
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = v_schema and c.relkind in ('r', 'p');

  if v_actual_tables is distinct from v_expected_tables then
    raise exception using errcode = 'P0001', message = 'Legacy HanziHome backup table manifest changed';
  end if;

  for v_table in select key as table_name, value::text::bigint as expected_count from jsonb_each(v_expected_counts)
  loop
    execute format('select count(*) from %I.%I', v_schema, v_table.table_name) into v_actual_count;
    if v_actual_count <> v_table.expected_count then
      raise exception using
        errcode = 'P0001',
        message = format('Legacy HanziHome backup count changed for %s: expected %s, found %s', v_table.table_name, v_table.expected_count, v_actual_count);
    end if;
  end loop;
end;
$$;

drop table backup_hanzihome_20260618.hanzihome_vocab_detail_sections;
drop table backup_hanzihome_20260618.hanzihome_vocab_examples;
drop table backup_hanzihome_20260618.hanzihome_vocab_items;
drop table backup_hanzihome_20260618.hanzihome_grammar_detail_sections;
drop table backup_hanzihome_20260618.hanzihome_grammar_examples;
drop table backup_hanzihome_20260618.hanzihome_grammar_points;
drop table backup_hanzihome_20260618.hanzihome_lesson_texts;
drop table backup_hanzihome_20260618.lesson_note_links;
drop table backup_hanzihome_20260618.notes;
drop table backup_hanzihome_20260618.hanzihome_lessons;
drop table backup_hanzihome_20260618.hanzihome_course_books;
drop table backup_hanzihome_20260618.hanzihome_courses;
drop schema backup_hanzihome_20260618 restrict;

commit;
