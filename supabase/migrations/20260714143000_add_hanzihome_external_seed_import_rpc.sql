create or replace function public.hanzihome_import_external_seed_package(p_seed jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_collision text;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;

  if jsonb_typeof(p_seed) <> 'object' then
    raise exception using errcode = '22023', message = 'Seed package must be a JSON object';
  end if;

  select collision into v_collision
  from (
    select 'hanzihome_courses:' || (value->>'id') as collision
    from jsonb_array_elements(coalesce(p_seed->'courses', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_courses row where row.id = value->>'id')
    union all
    select 'hanzihome_course_books:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'books', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_course_books row where row.id = value->>'id')
    union all
    select 'hanzihome_lessons:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'lessons', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_lessons row where row.id = value->>'id')
    union all
    select 'hanzihome_lesson_sections:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'lessonSections', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_lesson_sections row where row.id = (value->>'id')::uuid)
    union all
    select 'hanzihome_lesson_texts:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'lessonTexts', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_lesson_texts row where row.id = value->>'id')
    union all
    select 'hanzihome_vocab_items:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'vocabItems', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_vocab_items row where row.id = value->>'id')
    union all
    select 'hanzihome_vocab_examples:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'vocabExamples', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_vocab_examples row where row.id = value->>'id')
    union all
    select 'hanzihome_vocab_detail_sections:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'vocabDetailSections', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_vocab_detail_sections row where row.id = value->>'id')
    union all
    select 'hanzihome_grammar_points:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'grammarPoints', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_grammar_points row where row.id = value->>'id')
    union all
    select 'hanzihome_grammar_examples:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'grammarExamples', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_grammar_examples row where row.id = value->>'id')
    union all
    select 'hanzihome_grammar_detail_sections:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'grammarDetailSections', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_grammar_detail_sections row where row.id = value->>'id')
  ) collisions
  limit 1;

  if v_collision is not null then
    raise exception using errcode = '23505', message = 'Seed ID already exists: ' || v_collision;
  end if;

  insert into public.hanzihome_courses
    (id, user_id, slug, title, subtitle, type, course_order, source, imported_at)
  select id, user_id, slug, title, subtitle, type, course_order, source, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'courses', '[]'::jsonb)) as row(
    id text, user_id uuid, slug text, title text, subtitle text, type text,
    course_order integer, source text, imported_at timestamptz
  );

  insert into public.hanzihome_course_books
    (id, user_id, course_id, title, short_title, book_order, source, imported_at)
  select id, user_id, course_id, title, short_title, book_order, source, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'books', '[]'::jsonb)) as row(
    id text, user_id uuid, course_id text, title text, short_title text,
    book_order integer, source text, imported_at timestamptz
  );

  insert into public.hanzihome_lessons
    (id, course_id, book_id, owner_id, source, lesson_number, lesson_order,
     title_zh, title_vi, source_file, imported_at, title_pinyin, title_en, tags)
  select id, course_id, book_id, owner_id, source, lesson_number, lesson_order,
    title_zh, title_vi, source_file, imported_at, title_pinyin, title_en, tags
  from jsonb_to_recordset(coalesce(p_seed->'lessons', '[]'::jsonb)) as row(
    id text, course_id text, book_id text, owner_id uuid, source text,
    lesson_number integer, lesson_order integer, title_zh text, title_vi text,
    source_file text, imported_at timestamptz, title_pinyin text, title_en text, tags text[]
  );

  insert into public.hanzihome_lesson_sections
    (id, lesson_id, owner_id, source, source_section_id, section_key, section_type,
     title, title_vi, section_order, payload, source_file, imported_at)
  select id, lesson_id, owner_id, source, source_section_id, section_key, section_type,
    title, title_vi, section_order, payload, source_file, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'lessonSections', '[]'::jsonb)) as row(
    id uuid, lesson_id text, owner_id uuid, source text, source_section_id text,
    section_key text, section_type text, title text, title_vi text,
    section_order integer, payload jsonb, source_file text, imported_at timestamptz
  );

  insert into public.hanzihome_lesson_texts
    (id, lesson_id, owner_id, source, text_key, title, content, content_format, imported_at)
  select id, lesson_id, owner_id, source, text_key, title, content, content_format, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'lessonTexts', '[]'::jsonb)) as row(
    id text, lesson_id text, owner_id uuid, source text, text_key text, title text,
    content text, content_format text, imported_at timestamptz
  );

  insert into public.hanzihome_vocab_items
    (id, lesson_id, course_id, book_id, owner_id, source, item_order, word, pinyin,
     han_viet, meaning, category, level, pos_vi, pos_zh, tone, source_file,
     imported_at, meaning_en, tags)
  select id, lesson_id, course_id, book_id, owner_id, source, item_order, word, pinyin,
    han_viet, meaning, category, level, pos_vi, pos_zh, tone, source_file,
    imported_at, meaning_en, tags
  from jsonb_to_recordset(coalesce(p_seed->'vocabItems', '[]'::jsonb)) as row(
    id text, lesson_id text, course_id text, book_id text, owner_id uuid, source text,
    item_order integer, word text, pinyin text, han_viet text, meaning text,
    category text, level text, pos_vi text, pos_zh text, tone text, source_file text,
    imported_at timestamptz, meaning_en text, tags text[]
  );

  insert into public.hanzihome_vocab_examples
    (id, vocab_item_id, lesson_id, owner_id, source, example_order, zh, pinyin, vi, note, imported_at)
  select id, vocab_item_id, lesson_id, owner_id, source, example_order, zh, pinyin, vi, note, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'vocabExamples', '[]'::jsonb)) as row(
    id text, vocab_item_id text, lesson_id text, owner_id uuid, source text,
    example_order integer, zh text, pinyin text, vi text, note text, imported_at timestamptz
  );

  insert into public.hanzihome_vocab_detail_sections
    (id, vocab_item_id, lesson_id, owner_id, source, section_key, title, lines, section_order, imported_at)
  select id, vocab_item_id, lesson_id, owner_id, source, section_key, title, lines, section_order, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'vocabDetailSections', '[]'::jsonb)) as row(
    id text, vocab_item_id text, lesson_id text, owner_id uuid, source text,
    section_key text, title text, lines text[], section_order integer, imported_at timestamptz
  );

  insert into public.hanzihome_grammar_points
    (id, lesson_id, course_id, book_id, owner_id, source, point_order, title,
     clean_title, core, content_md, structures_view, notes, imported_at, title_vi, level, tags)
  select id, lesson_id, course_id, book_id, owner_id, source, point_order, title,
    clean_title, core, content_md, structures_view, notes, imported_at, title_vi, level, tags
  from jsonb_to_recordset(coalesce(p_seed->'grammarPoints', '[]'::jsonb)) as row(
    id text, lesson_id text, course_id text, book_id text, owner_id uuid, source text,
    point_order integer, title text, clean_title text, core text, content_md text,
    structures_view text[], notes text[], imported_at timestamptz, title_vi text, level text, tags text[]
  );

  insert into public.hanzihome_grammar_examples
    (id, grammar_point_id, lesson_id, owner_id, source, example_order, zh, pinyin, vi, note, imported_at)
  select id, grammar_point_id, lesson_id, owner_id, source, example_order, zh, pinyin, vi, note, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'grammarExamples', '[]'::jsonb)) as row(
    id text, grammar_point_id text, lesson_id text, owner_id uuid, source text,
    example_order integer, zh text, pinyin text, vi text, note text, imported_at timestamptz
  );

  insert into public.hanzihome_grammar_detail_sections
    (id, grammar_point_id, lesson_id, owner_id, source, section_key, title, lines, section_order, imported_at)
  select id, grammar_point_id, lesson_id, owner_id, source, section_key, title, lines, section_order, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'grammarDetailSections', '[]'::jsonb)) as row(
    id text, grammar_point_id text, lesson_id text, owner_id uuid, source text,
    section_key text, title text, lines text[], section_order integer, imported_at timestamptz
  );

  return jsonb_build_object(
    'courses', jsonb_array_length(coalesce(p_seed->'courses', '[]'::jsonb)),
    'books', jsonb_array_length(coalesce(p_seed->'books', '[]'::jsonb)),
    'lessons', jsonb_array_length(coalesce(p_seed->'lessons', '[]'::jsonb)),
    'lessonSections', jsonb_array_length(coalesce(p_seed->'lessonSections', '[]'::jsonb)),
    'lessonTexts', jsonb_array_length(coalesce(p_seed->'lessonTexts', '[]'::jsonb)),
    'vocabItems', jsonb_array_length(coalesce(p_seed->'vocabItems', '[]'::jsonb)),
    'vocabExamples', jsonb_array_length(coalesce(p_seed->'vocabExamples', '[]'::jsonb)),
    'vocabDetailSections', jsonb_array_length(coalesce(p_seed->'vocabDetailSections', '[]'::jsonb)),
    'grammarPoints', jsonb_array_length(coalesce(p_seed->'grammarPoints', '[]'::jsonb)),
    'grammarExamples', jsonb_array_length(coalesce(p_seed->'grammarExamples', '[]'::jsonb)),
    'grammarDetailSections', jsonb_array_length(coalesce(p_seed->'grammarDetailSections', '[]'::jsonb))
  );
end;
$$;

revoke all on function public.hanzihome_import_external_seed_package(jsonb)
from public, anon, authenticated;
grant execute on function public.hanzihome_import_external_seed_package(jsonb)
to service_role;
