create or replace function public.hanzihome_refresh_external_seed_package(p_seed jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_unsafe_row text;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;

  if jsonb_typeof(p_seed) <> 'object' then
    raise exception using errcode = '22023', message = 'Seed package must be a JSON object';
  end if;

  select collection || ':' || coalesce(value->>'id', '<missing>')
  into v_unsafe_row
  from (
    select 'courses' collection, value from jsonb_array_elements(coalesce(p_seed->'courses', '[]'::jsonb)) value
    union all select 'books', value from jsonb_array_elements(coalesce(p_seed->'books', '[]'::jsonb)) value
    union all select 'lessons', value from jsonb_array_elements(coalesce(p_seed->'lessons', '[]'::jsonb)) value
    union all select 'lessonSections', value from jsonb_array_elements(coalesce(p_seed->'lessonSections', '[]'::jsonb)) value
    union all select 'lessonTexts', value from jsonb_array_elements(coalesce(p_seed->'lessonTexts', '[]'::jsonb)) value
    union all select 'vocabItems', value from jsonb_array_elements(coalesce(p_seed->'vocabItems', '[]'::jsonb)) value
    union all select 'vocabExamples', value from jsonb_array_elements(coalesce(p_seed->'vocabExamples', '[]'::jsonb)) value
    union all select 'vocabDetailSections', value from jsonb_array_elements(coalesce(p_seed->'vocabDetailSections', '[]'::jsonb)) value
    union all select 'grammarPoints', value from jsonb_array_elements(coalesce(p_seed->'grammarPoints', '[]'::jsonb)) value
    union all select 'grammarExamples', value from jsonb_array_elements(coalesce(p_seed->'grammarExamples', '[]'::jsonb)) value
    union all select 'grammarDetailSections', value from jsonb_array_elements(coalesce(p_seed->'grammarDetailSections', '[]'::jsonb)) value
  ) package_rows
  where value->>'source' is distinct from 'seed'
  limit 1;

  if v_unsafe_row is not null then
    raise exception using errcode = '22023', message = 'Refresh accepts seed rows only: ' || v_unsafe_row;
  end if;

  select collision into v_unsafe_row
  from (
    select 'hanzihome_courses:' || (value->>'id') as collision
    from jsonb_array_elements(coalesce(p_seed->'courses', '[]'::jsonb)) value
    join public.hanzihome_courses row on row.id = value->>'id'
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_course_books:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'books', '[]'::jsonb)) value
    join public.hanzihome_course_books row on row.id = value->>'id'
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_lessons:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'lessons', '[]'::jsonb)) value
    join public.hanzihome_lessons row on row.id = value->>'id'
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_lesson_sections:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'lessonSections', '[]'::jsonb)) value
    join public.hanzihome_lesson_sections row on row.id = (value->>'id')::uuid
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_lesson_texts:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'lessonTexts', '[]'::jsonb)) value
    join public.hanzihome_lesson_texts row on row.id = value->>'id'
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_vocab_items:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'vocabItems', '[]'::jsonb)) value
    join public.hanzihome_vocab_items row on row.id = value->>'id'
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_vocab_examples:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'vocabExamples', '[]'::jsonb)) value
    join public.hanzihome_vocab_examples row on row.id = value->>'id'
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_vocab_detail_sections:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'vocabDetailSections', '[]'::jsonb)) value
    join public.hanzihome_vocab_detail_sections row on row.id = value->>'id'
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_grammar_points:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'grammarPoints', '[]'::jsonb)) value
    join public.hanzihome_grammar_points row on row.id = value->>'id'
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_grammar_examples:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'grammarExamples', '[]'::jsonb)) value
    join public.hanzihome_grammar_examples row on row.id = value->>'id'
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_grammar_detail_sections:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'grammarDetailSections', '[]'::jsonb)) value
    join public.hanzihome_grammar_detail_sections row on row.id = value->>'id'
    where row.source is distinct from 'seed'
  ) unsafe_collisions
  limit 1;

  if v_unsafe_row is not null then
    raise exception using errcode = '23505', message = 'Cannot replace non-seed row: ' || v_unsafe_row;
  end if;

  insert into public.hanzihome_courses
    (id, user_id, slug, title, subtitle, type, course_order, source, imported_at)
  select id, user_id, slug, title, subtitle, type, course_order, source, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'courses', '[]'::jsonb)) as row(
    id text, user_id uuid, slug text, title text, subtitle text, type text,
    course_order integer, source text, imported_at timestamptz
  )
  on conflict (id) do update set
    slug = excluded.slug, title = excluded.title, subtitle = excluded.subtitle,
    type = excluded.type, course_order = excluded.course_order, imported_at = excluded.imported_at;

  insert into public.hanzihome_course_books
    (id, user_id, course_id, title, short_title, book_order, source, imported_at)
  select id, user_id, course_id, title, short_title, book_order, source, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'books', '[]'::jsonb)) as row(
    id text, user_id uuid, course_id text, title text, short_title text,
    book_order integer, source text, imported_at timestamptz
  )
  on conflict (id) do update set
    course_id = excluded.course_id, title = excluded.title, short_title = excluded.short_title,
    book_order = excluded.book_order, imported_at = excluded.imported_at;

  insert into public.hanzihome_lessons
    (id, course_id, book_id, owner_id, source, lesson_number, lesson_order,
     title_zh, title_vi, source_file, imported_at, title_pinyin, title_en, tags)
  select id, course_id, book_id, owner_id, source, lesson_number, lesson_order,
    title_zh, title_vi, source_file, imported_at, title_pinyin, title_en, tags
  from jsonb_to_recordset(coalesce(p_seed->'lessons', '[]'::jsonb)) as row(
    id text, course_id text, book_id text, owner_id uuid, source text,
    lesson_number integer, lesson_order integer, title_zh text, title_vi text,
    source_file text, imported_at timestamptz, title_pinyin text, title_en text, tags text[]
  )
  on conflict (id) do update set
    course_id = excluded.course_id, book_id = excluded.book_id,
    lesson_number = excluded.lesson_number, lesson_order = excluded.lesson_order,
    title_zh = excluded.title_zh, title_vi = excluded.title_vi,
    source_file = excluded.source_file, imported_at = excluded.imported_at,
    title_pinyin = excluded.title_pinyin, title_en = excluded.title_en, tags = excluded.tags;

  insert into public.hanzihome_lesson_sections
    (id, lesson_id, owner_id, source, source_section_id, section_key, section_type,
     title, title_vi, section_order, payload, source_file, imported_at)
  select id, lesson_id, owner_id, source, source_section_id, section_key, section_type,
    title, title_vi, section_order, payload, source_file, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'lessonSections', '[]'::jsonb)) as row(
    id uuid, lesson_id text, owner_id uuid, source text, source_section_id text,
    section_key text, section_type text, title text, title_vi text,
    section_order integer, payload jsonb, source_file text, imported_at timestamptz
  )
  on conflict (id) do update set
    lesson_id = excluded.lesson_id, source_section_id = excluded.source_section_id,
    section_key = excluded.section_key, section_type = excluded.section_type,
    title = excluded.title, title_vi = excluded.title_vi,
    section_order = excluded.section_order, payload = excluded.payload,
    source_file = excluded.source_file, imported_at = excluded.imported_at;

  insert into public.hanzihome_lesson_texts
    (id, lesson_id, owner_id, source, text_key, title, content, content_format, imported_at)
  select id, lesson_id, owner_id, source, text_key, title, content, content_format, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'lessonTexts', '[]'::jsonb)) as row(
    id text, lesson_id text, owner_id uuid, source text, text_key text, title text,
    content text, content_format text, imported_at timestamptz
  )
  on conflict (id) do update set
    lesson_id = excluded.lesson_id, text_key = excluded.text_key, title = excluded.title,
    content = excluded.content, content_format = excluded.content_format,
    imported_at = excluded.imported_at;

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
  )
  on conflict (id) do update set
    lesson_id = excluded.lesson_id, course_id = excluded.course_id, book_id = excluded.book_id,
    item_order = excluded.item_order, word = excluded.word, pinyin = excluded.pinyin,
    han_viet = excluded.han_viet, meaning = excluded.meaning, category = excluded.category,
    level = excluded.level, pos_vi = excluded.pos_vi, pos_zh = excluded.pos_zh,
    tone = excluded.tone, source_file = excluded.source_file,
    imported_at = excluded.imported_at, meaning_en = excluded.meaning_en, tags = excluded.tags;

  insert into public.hanzihome_vocab_examples
    (id, vocab_item_id, lesson_id, owner_id, source, example_order, zh, pinyin, vi, note, imported_at)
  select id, vocab_item_id, lesson_id, owner_id, source, example_order, zh, pinyin, vi, note, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'vocabExamples', '[]'::jsonb)) as row(
    id text, vocab_item_id text, lesson_id text, owner_id uuid, source text,
    example_order integer, zh text, pinyin text, vi text, note text, imported_at timestamptz
  )
  on conflict (id) do update set
    vocab_item_id = excluded.vocab_item_id, lesson_id = excluded.lesson_id,
    example_order = excluded.example_order, zh = excluded.zh, pinyin = excluded.pinyin,
    vi = excluded.vi, note = excluded.note, imported_at = excluded.imported_at;

  insert into public.hanzihome_vocab_detail_sections
    (id, vocab_item_id, lesson_id, owner_id, source, section_key, title, lines, section_order, imported_at)
  select id, vocab_item_id, lesson_id, owner_id, source, section_key, title, lines, section_order, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'vocabDetailSections', '[]'::jsonb)) as row(
    id text, vocab_item_id text, lesson_id text, owner_id uuid, source text,
    section_key text, title text, lines text[], section_order integer, imported_at timestamptz
  )
  on conflict (id) do update set
    vocab_item_id = excluded.vocab_item_id, lesson_id = excluded.lesson_id,
    section_key = excluded.section_key, title = excluded.title, lines = excluded.lines,
    section_order = excluded.section_order, imported_at = excluded.imported_at;

  insert into public.hanzihome_grammar_points
    (id, lesson_id, course_id, book_id, owner_id, source, point_order, title,
     clean_title, core, content_md, structures_view, notes, imported_at, title_vi, level, tags)
  select id, lesson_id, course_id, book_id, owner_id, source, point_order, title,
    clean_title, core, content_md, structures_view, notes, imported_at, title_vi, level, tags
  from jsonb_to_recordset(coalesce(p_seed->'grammarPoints', '[]'::jsonb)) as row(
    id text, lesson_id text, course_id text, book_id text, owner_id uuid, source text,
    point_order integer, title text, clean_title text, core text, content_md text,
    structures_view text[], notes text[], imported_at timestamptz, title_vi text, level text, tags text[]
  )
  on conflict (id) do update set
    lesson_id = excluded.lesson_id, course_id = excluded.course_id, book_id = excluded.book_id,
    point_order = excluded.point_order, title = excluded.title, clean_title = excluded.clean_title,
    core = excluded.core, content_md = excluded.content_md,
    structures_view = excluded.structures_view, notes = excluded.notes,
    imported_at = excluded.imported_at, title_vi = excluded.title_vi,
    level = excluded.level, tags = excluded.tags;

  insert into public.hanzihome_grammar_examples
    (id, grammar_point_id, lesson_id, owner_id, source, example_order, zh, pinyin, vi, note, imported_at)
  select id, grammar_point_id, lesson_id, owner_id, source, example_order, zh, pinyin, vi, note, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'grammarExamples', '[]'::jsonb)) as row(
    id text, grammar_point_id text, lesson_id text, owner_id uuid, source text,
    example_order integer, zh text, pinyin text, vi text, note text, imported_at timestamptz
  )
  on conflict (id) do update set
    grammar_point_id = excluded.grammar_point_id, lesson_id = excluded.lesson_id,
    example_order = excluded.example_order, zh = excluded.zh, pinyin = excluded.pinyin,
    vi = excluded.vi, note = excluded.note, imported_at = excluded.imported_at;

  insert into public.hanzihome_grammar_detail_sections
    (id, grammar_point_id, lesson_id, owner_id, source, section_key, title, lines, section_order, imported_at)
  select id, grammar_point_id, lesson_id, owner_id, source, section_key, title, lines, section_order, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'grammarDetailSections', '[]'::jsonb)) as row(
    id text, grammar_point_id text, lesson_id text, owner_id uuid, source text,
    section_key text, title text, lines text[], section_order integer, imported_at timestamptz
  )
  on conflict (id) do update set
    grammar_point_id = excluded.grammar_point_id, lesson_id = excluded.lesson_id,
    section_key = excluded.section_key, title = excluded.title, lines = excluded.lines,
    section_order = excluded.section_order, imported_at = excluded.imported_at;

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

revoke all on function public.hanzihome_refresh_external_seed_package(jsonb)
from public, anon, authenticated;
grant execute on function public.hanzihome_refresh_external_seed_package(jsonb)
to service_role;
