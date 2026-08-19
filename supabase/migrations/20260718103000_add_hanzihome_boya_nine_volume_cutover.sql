create or replace function public.hanzihome_cutover_boya_legacy_to_nine_volume(
  p_import_key text,
  p_expected_sha256 text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_payload text;
  v_actual_sha256 text;
  v_seed jsonb;
  v_total_parts integer;
  v_part_count integer;
  v_min_part integer;
  v_max_part integer;
  v_seed_counts jsonb;
  v_old_counts jsonb;
  v_dependency_count bigint;
  v_unsafe_row text;
  v_import_result jsonb;
  v_affected integer;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
  if p_import_key is null or p_import_key !~ '^[a-z0-9][a-z0-9._-]{7,127}$' then
    raise exception using errcode = '22023', message = 'Invalid Boya import key';
  end if;
  if p_expected_sha256 is null or p_expected_sha256 !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '22023', message = 'Invalid expected SHA-256';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('hanzihome:boya-nine-volume-cutover', 0)
  );

  select
    pg_catalog.string_agg(chunks.payload, '' order by chunks.part),
    pg_catalog.count(*)::integer,
    pg_catalog.min(chunks.total_parts),
    pg_catalog.min(chunks.part),
    pg_catalog.max(chunks.part)
  into v_payload, v_part_count, v_total_parts, v_min_part, v_max_part
  from public.hanzihome_import_chunks as chunks
  where chunks.import_key = p_import_key;

  if v_payload is null
    or v_part_count <> v_total_parts
    or v_min_part <> 0
    or v_max_part <> v_total_parts - 1
    or exists (
      select 1
      from public.hanzihome_import_chunks as chunks
      where chunks.import_key = p_import_key
        and chunks.total_parts <> v_total_parts
    )
  then
    raise exception using errcode = '22023', message = 'Boya import staging is incomplete or inconsistent';
  end if;

  v_actual_sha256 := pg_catalog.encode(
    extensions.digest(pg_catalog.convert_to(v_payload, 'UTF8'), 'sha256'),
    'hex'
  );
  if v_actual_sha256 <> p_expected_sha256 then
    raise exception using errcode = '22023', message = 'Boya import staging checksum mismatch';
  end if;

  begin
    v_seed := v_payload::jsonb;
  exception when others then
    raise exception using errcode = '22023', message = 'Boya import staging is not valid JSON';
  end;

  v_seed_counts := pg_catalog.jsonb_build_object(
    'courses', pg_catalog.jsonb_array_length(pg_catalog.coalesce(v_seed->'courses', '[]'::jsonb)),
    'books', pg_catalog.jsonb_array_length(pg_catalog.coalesce(v_seed->'books', '[]'::jsonb)),
    'lessons', pg_catalog.jsonb_array_length(pg_catalog.coalesce(v_seed->'lessons', '[]'::jsonb)),
    'lessonSections', pg_catalog.jsonb_array_length(pg_catalog.coalesce(v_seed->'lessonSections', '[]'::jsonb)),
    'lessonTexts', pg_catalog.jsonb_array_length(pg_catalog.coalesce(v_seed->'lessonTexts', '[]'::jsonb)),
    'vocabItems', pg_catalog.jsonb_array_length(pg_catalog.coalesce(v_seed->'vocabItems', '[]'::jsonb)),
    'vocabExamples', pg_catalog.jsonb_array_length(pg_catalog.coalesce(v_seed->'vocabExamples', '[]'::jsonb)),
    'vocabDetailSections', pg_catalog.jsonb_array_length(pg_catalog.coalesce(v_seed->'vocabDetailSections', '[]'::jsonb)),
    'grammarPoints', pg_catalog.jsonb_array_length(pg_catalog.coalesce(v_seed->'grammarPoints', '[]'::jsonb)),
    'grammarExamples', pg_catalog.jsonb_array_length(pg_catalog.coalesce(v_seed->'grammarExamples', '[]'::jsonb)),
    'grammarDetailSections', pg_catalog.jsonb_array_length(pg_catalog.coalesce(v_seed->'grammarDetailSections', '[]'::jsonb))
  );
  if v_seed_counts <> '{
    "courses": 1,
    "books": 4,
    "lessons": 42,
    "lessonSections": 281,
    "lessonTexts": 66,
    "vocabItems": 2951,
    "vocabExamples": 5490,
    "vocabDetailSections": 11990,
    "grammarPoints": 243,
    "grammarExamples": 141,
    "grammarDetailSections": 379
  }'::jsonb then
    raise exception using errcode = '22023', message = 'Boya seed counts do not match the reviewed manifest';
  end if;

  if (select pg_catalog.array_agg(value->>'id' order by value->>'id')
      from pg_catalog.jsonb_array_elements(v_seed->'courses'))
     <> array['boya-nine-volume-second-edition']::text[]
  then
    raise exception using errcode = '22023', message = 'Unexpected Boya course namespace';
  end if;
  if (select pg_catalog.array_agg(value->>'id' order by value->>'id')
      from pg_catalog.jsonb_array_elements(v_seed->'books'))
     <> array[
       'boya-9e-advanced-1',
       'boya-9e-advanced-2',
       'boya-9e-intermediate-1',
       'boya-9e-intermediate-2'
     ]::text[]
  then
    raise exception using errcode = '22023', message = 'Unexpected Boya book namespace';
  end if;

  select collection || ':' || pg_catalog.coalesce(value->>'id', '<missing>')
  into v_unsafe_row
  from (
    select 'courses' collection, value from pg_catalog.jsonb_array_elements(v_seed->'courses') value
    union all select 'books', value from pg_catalog.jsonb_array_elements(v_seed->'books') value
    union all select 'lessons', value from pg_catalog.jsonb_array_elements(v_seed->'lessons') value
    union all select 'lessonSections', value from pg_catalog.jsonb_array_elements(v_seed->'lessonSections') value
    union all select 'lessonTexts', value from pg_catalog.jsonb_array_elements(v_seed->'lessonTexts') value
    union all select 'vocabItems', value from pg_catalog.jsonb_array_elements(v_seed->'vocabItems') value
    union all select 'vocabExamples', value from pg_catalog.jsonb_array_elements(v_seed->'vocabExamples') value
    union all select 'vocabDetailSections', value from pg_catalog.jsonb_array_elements(v_seed->'vocabDetailSections') value
    union all select 'grammarPoints', value from pg_catalog.jsonb_array_elements(v_seed->'grammarPoints') value
    union all select 'grammarExamples', value from pg_catalog.jsonb_array_elements(v_seed->'grammarExamples') value
    union all select 'grammarDetailSections', value from pg_catalog.jsonb_array_elements(v_seed->'grammarDetailSections') value
  ) as package_rows
  where value->>'source' is distinct from 'seed'
  limit 1;
  if v_unsafe_row is not null then
    raise exception using errcode = '22023', message = 'Boya package contains a non-seed row: ' || v_unsafe_row;
  end if;

  with target_lessons as (
    select id from public.hanzihome_lessons
    where book_id = any(array['boya-preintermediate-1','boya-preintermediate-2','boya-intermediate-2']::text[])
  ), target_vocab as (
    select id from public.hanzihome_vocab_items where lesson_id in (select id from target_lessons)
  ), target_grammar as (
    select id from public.hanzihome_grammar_points where lesson_id in (select id from target_lessons)
  )
  select pg_catalog.jsonb_build_object(
    'courses', (select count(*) from public.hanzihome_courses where id = any(array['boya-preintermediate','boya-intermediate']::text[])),
    'books', (select count(*) from public.hanzihome_course_books where id = any(array['boya-preintermediate-1','boya-preintermediate-2','boya-intermediate-2']::text[])),
    'lessons', (select count(*) from target_lessons),
    'lessonSections', (select count(*) from public.hanzihome_lesson_sections where lesson_id in (select id from target_lessons)),
    'lessonTexts', (select count(*) from public.hanzihome_lesson_texts where lesson_id in (select id from target_lessons)),
    'vocabItems', (select count(*) from target_vocab),
    'vocabExamples', (select count(*) from public.hanzihome_vocab_examples where vocab_item_id in (select id from target_vocab)),
    'vocabDetailSections', (select count(*) from public.hanzihome_vocab_detail_sections where vocab_item_id in (select id from target_vocab)),
    'grammarPoints', (select count(*) from target_grammar),
    'grammarExamples', (select count(*) from public.hanzihome_grammar_examples where grammar_point_id in (select id from target_grammar)),
    'grammarDetailSections', (select count(*) from public.hanzihome_grammar_detail_sections where grammar_point_id in (select id from target_grammar))
  ) into v_old_counts;
  if v_old_counts <> '{
    "courses": 2,
    "books": 3,
    "lessons": 42,
    "lessonSections": 168,
    "lessonTexts": 42,
    "vocabItems": 1637,
    "vocabExamples": 1469,
    "vocabDetailSections": 127,
    "grammarPoints": 207,
    "grammarExamples": 128,
    "grammarDetailSections": 256
  }'::jsonb then
    raise exception using errcode = '55000', message = 'Legacy Boya counts drifted after preflight';
  end if;

  select unsafe_row into v_unsafe_row
  from (
    select 'course:' || id as unsafe_row from public.hanzihome_courses
      where id = any(array['boya-preintermediate','boya-intermediate']::text[])
        and (source is distinct from 'seed' or user_id is not null or deleted_at is not null)
    union all select 'book:' || id from public.hanzihome_course_books
      where id = any(array['boya-preintermediate-1','boya-preintermediate-2','boya-intermediate-2']::text[])
        and (source is distinct from 'seed' or user_id is not null or deleted_at is not null)
    union all select 'lesson:' || id from public.hanzihome_lessons
      where book_id = any(array['boya-preintermediate-1','boya-preintermediate-2','boya-intermediate-2']::text[])
        and (source is distinct from 'seed' or owner_id is not null or deleted_at is not null)
    union all select 'section:' || id::text from public.hanzihome_lesson_sections
      where lesson_id in (select id from public.hanzihome_lessons where book_id = any(array['boya-preintermediate-1','boya-preintermediate-2','boya-intermediate-2']::text[]))
        and (source is distinct from 'seed' or owner_id is not null or deleted_at is not null)
    union all select 'text:' || id from public.hanzihome_lesson_texts
      where lesson_id in (select id from public.hanzihome_lessons where book_id = any(array['boya-preintermediate-1','boya-preintermediate-2','boya-intermediate-2']::text[]))
        and (source is distinct from 'seed' or owner_id is not null or deleted_at is not null)
    union all select 'vocab:' || id from public.hanzihome_vocab_items
      where book_id = any(array['boya-preintermediate-1','boya-preintermediate-2','boya-intermediate-2']::text[])
        and (source is distinct from 'seed' or owner_id is not null or deleted_at is not null)
    union all select 'grammar:' || id from public.hanzihome_grammar_points
      where book_id = any(array['boya-preintermediate-1','boya-preintermediate-2','boya-intermediate-2']::text[])
        and (source is distinct from 'seed' or owner_id is not null or deleted_at is not null)
  ) unsafe_rows
  limit 1;
  if v_unsafe_row is not null then
    raise exception using errcode = '55000', message = 'Legacy Boya contains an unsafe row: ' || v_unsafe_row;
  end if;

  with target_lessons as (
    select id from public.hanzihome_lessons
    where book_id = any(array['boya-preintermediate-1','boya-preintermediate-2','boya-intermediate-2']::text[])
  )
  select
    (select count(*) from public.lesson_text_annotations where lesson_id in (select id from target_lessons))
    + (select count(*) from public.hanzihome_memory_tips where source_lesson_id in (select id from target_lessons))
    + (select count(*) from public.lesson_note_links where target_key in (select id from target_lessons))
    + (select count(*) from public.hanzihome_listening_items where lesson_id in (select id from target_lessons))
    + (select count(*) from public.hanzihome_listening_audio where lesson_id in (select id from target_lessons))
    + (select count(*) from public.hanzihome_content_audit_log
       where entity_id in (select id from target_lessons)
          or parent_entity_id in (select id from target_lessons)
          or entity_id = any(array['boya-preintermediate-1','boya-preintermediate-2','boya-intermediate-2']::text[])
          or parent_entity_id = any(array['boya-preintermediate-1','boya-preintermediate-2','boya-intermediate-2']::text[]))
    + (select count(*) from public.user_learning_state as state
       where exists (
         select 1 from target_lessons as lesson
         where state.progress::text like '%' || lesson.id || '%'
            or state.bookmarks::text like '%' || lesson.id || '%'
            or state.review_history::text like '%' || lesson.id || '%'
       ))
  into v_dependency_count;
  if v_dependency_count <> 0 then
    raise exception using errcode = '55000', message = 'Legacy Boya gained user-dependent rows after preflight';
  end if;

  if (select count(*) from public.hanzihome_course_books where id = any(array['boya-elementary-1','boya-elementary-2']::text[])) <> 2
    or (select pg_catalog.md5(pg_catalog.string_agg(id, '|' order by id)) from public.hanzihome_course_books where id = any(array['boya-elementary-1','boya-elementary-2']::text[])) <> '4877d58dd723e1a233aee3d315043341'
    or (select count(*) from public.hanzihome_lessons where book_id = any(array['boya-elementary-1','boya-elementary-2']::text[])) <> 55
    or (select pg_catalog.md5(pg_catalog.string_agg(id, '|' order by id)) from public.hanzihome_lessons where book_id = any(array['boya-elementary-1','boya-elementary-2']::text[])) <> '9d4963d4bb86770a2a5bc8758df9d077'
    or (select count(*) from public.hanzihome_vocab_items where book_id = any(array['boya-elementary-1','boya-elementary-2']::text[])) <> 1070
    or (select pg_catalog.md5(pg_catalog.string_agg(id, '|' order by id)) from public.hanzihome_vocab_items where book_id = any(array['boya-elementary-1','boya-elementary-2']::text[])) <> 'f871ac6ccc54af21699cfd0a7e833198'
    or (select count(*) from public.hanzihome_grammar_points where book_id = any(array['boya-elementary-1','boya-elementary-2']::text[])) <> 80
    or (select pg_catalog.md5(pg_catalog.string_agg(id, '|' order by id)) from public.hanzihome_grammar_points where book_id = any(array['boya-elementary-1','boya-elementary-2']::text[])) <> 'aaca320c96b99c88715095349e690937'
  then
    raise exception using errcode = '55000', message = 'Elementary Boya snapshot drifted after preflight';
  end if;

  if exists (select 1 from public.hanzihome_courses where id = 'boya-nine-volume-second-edition') then
    raise exception using errcode = '23505', message = 'Boya nine-volume course already exists';
  end if;

  update public.hanzihome_courses
  set deleted_at = pg_catalog.clock_timestamp(), deleted_by = null
  where id = any(array['boya-preintermediate','boya-intermediate']::text[])
    and deleted_at is null;
  get diagnostics v_affected = row_count;
  if v_affected <> 2 then
    raise exception using errcode = '55000', message = 'Could not soft-hide both legacy Boya courses';
  end if;

  v_import_result := public.hanzihome_import_external_seed_package(v_seed);

  if (select count(*) from public.hanzihome_courses where id = 'boya-nine-volume-second-edition' and deleted_at is null) <> 1
    or (select count(*) from public.hanzihome_course_books where course_id = 'boya-nine-volume-second-edition' and deleted_at is null) <> 4
    or (select count(*) from public.hanzihome_lessons where course_id = 'boya-nine-volume-second-edition' and deleted_at is null) <> 42
    or (select count(*) from public.hanzihome_vocab_items where course_id = 'boya-nine-volume-second-edition' and deleted_at is null) <> 2951
    or (select count(*) from public.hanzihome_grammar_points where course_id = 'boya-nine-volume-second-edition' and deleted_at is null) <> 243
  then
    raise exception using errcode = '55000', message = 'Boya nine-volume post-import verification failed';
  end if;

  return pg_catalog.jsonb_build_object(
    'status', 'cutover_pending_qa',
    'importKey', p_import_key,
    'sha256', v_actual_sha256,
    'seedCounts', v_seed_counts,
    'legacyCounts', v_old_counts,
    'importResult', v_import_result
  );
end;
$function$;

create or replace function public.hanzihome_rollback_boya_nine_volume_cutover()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_deleted integer;
  v_restored integer;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('hanzihome:boya-nine-volume-cutover', 0)
  );
  if exists (
    select 1 from public.hanzihome_courses
    where id = 'boya-nine-volume-second-edition' and source is distinct from 'seed'
  ) then
    raise exception using errcode = '55000', message = 'Cannot rollback a non-seed Boya course';
  end if;

  delete from public.hanzihome_courses
  where id = 'boya-nine-volume-second-edition' and source = 'seed';
  get diagnostics v_deleted = row_count;
  update public.hanzihome_courses
  set deleted_at = null, deleted_by = null
  where id = any(array['boya-preintermediate','boya-intermediate']::text[])
    and source = 'seed' and deleted_at is not null;
  get diagnostics v_restored = row_count;
  if v_deleted <> 1 or v_restored <> 2 then
    raise exception using errcode = '55000', message = 'Boya rollback scope did not match the cutover';
  end if;
  return pg_catalog.jsonb_build_object('deletedNewCourses', v_deleted, 'restoredLegacyCourses', v_restored);
end;
$function$;

revoke all on function public.hanzihome_cutover_boya_legacy_to_nine_volume(text, text)
from public, anon, authenticated;
grant execute on function public.hanzihome_cutover_boya_legacy_to_nine_volume(text, text)
to service_role;

revoke all on function public.hanzihome_rollback_boya_nine_volume_cutover()
from public, anon, authenticated;
grant execute on function public.hanzihome_rollback_boya_nine_volume_cutover()
to service_role;
