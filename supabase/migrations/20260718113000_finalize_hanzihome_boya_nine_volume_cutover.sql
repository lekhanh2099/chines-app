do $migration$
declare
  v_deleted integer;
  v_deleted_books integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('hanzihome:boya-nine-volume-cutover', 0)
  );

  if (select count(*) from public.hanzihome_courses where id = 'boya-nine-volume-second-edition' and deleted_at is null) <> 1
    or (select count(*) from public.hanzihome_course_books where course_id = 'boya-nine-volume-second-edition' and deleted_at is null) <> 4
    or (select count(*) from public.hanzihome_lessons where course_id = 'boya-nine-volume-second-edition' and deleted_at is null) <> 42
    or (select count(*) from public.hanzihome_lesson_sections where lesson_id in (select id from public.hanzihome_lessons where course_id = 'boya-nine-volume-second-edition')) <> 281
    or (select count(*) from public.hanzihome_lesson_texts where lesson_id in (select id from public.hanzihome_lessons where course_id = 'boya-nine-volume-second-edition')) <> 66
    or (select count(*) from public.hanzihome_vocab_items where course_id = 'boya-nine-volume-second-edition' and deleted_at is null) <> 2951
    or (select count(*) from public.hanzihome_vocab_examples where lesson_id in (select id from public.hanzihome_lessons where course_id = 'boya-nine-volume-second-edition')) <> 5490
    or (select count(*) from public.hanzihome_vocab_detail_sections where lesson_id in (select id from public.hanzihome_lessons where course_id = 'boya-nine-volume-second-edition')) <> 11990
    or (select count(*) from public.hanzihome_grammar_points where course_id = 'boya-nine-volume-second-edition' and deleted_at is null) <> 243
    or (select count(*) from public.hanzihome_grammar_examples where lesson_id in (select id from public.hanzihome_lessons where course_id = 'boya-nine-volume-second-edition')) <> 141
    or (select count(*) from public.hanzihome_grammar_detail_sections where lesson_id in (select id from public.hanzihome_lessons where course_id = 'boya-nine-volume-second-edition')) <> 379
    or (select count(*) from public.hanzihome_vocab_items where course_id = 'boya-nine-volume-second-edition' and tags @> array['check-needed']::text[]) <> 11
    or (select count(*) from public.hanzihome_vocab_examples where lesson_id in (select id from public.hanzihome_lessons where course_id = 'boya-nine-volume-second-edition') and pinyin is null) <> 1680
    or (select count(*) from public.hanzihome_lessons where course_id = 'boya-nine-volume-second-edition' and tags @> array['partial_source']::text[]) <> 1
  then
    raise exception using errcode = '55000', message = 'Boya nine-volume QA counts are not ready for finalization';
  end if;

  if (select count(*) from public.hanzihome_courses
      where id = any(array['boya-preintermediate','boya-intermediate']::text[])
        and source = 'seed' and deleted_at is not null) <> 2
  then
    raise exception using errcode = '55000', message = 'Legacy Boya courses are not in the expected soft-hidden state';
  end if;

  if (select count(*) from public.hanzihome_lesson_drafts) <> 6 then
    raise exception using errcode = '55000', message = 'Legacy draft count changed after backup';
  end if;

  delete from public.hanzihome_course_books
  where id = any(array['boya-preintermediate-1','boya-preintermediate-2','boya-intermediate-2']::text[])
    and source = 'seed';
  get diagnostics v_deleted_books = row_count;
  if v_deleted_books <> 3 then
    raise exception using errcode = '55000', message = 'Legacy Boya hard-delete book scope mismatch';
  end if;

  delete from public.hanzihome_courses
  where id = any(array['boya-preintermediate','boya-intermediate']::text[])
    and source = 'seed' and deleted_at is not null;
  get diagnostics v_deleted = row_count;
  if v_deleted <> 2 then
    raise exception using errcode = '55000', message = 'Legacy Boya hard-delete scope mismatch';
  end if;

  if exists (select 1 from public.hanzihome_course_books where id = any(array['boya-preintermediate-1','boya-preintermediate-2','boya-intermediate-2']::text[]))
    or exists (select 1 from public.hanzihome_lessons where book_id = any(array['boya-preintermediate-1','boya-preintermediate-2','boya-intermediate-2']::text[]))
  then
    raise exception using errcode = '55000', message = 'Legacy Boya cascade verification failed';
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
    raise exception using errcode = '55000', message = 'Elementary Boya changed during finalization';
  end if;
end;
$migration$;

truncate table public.hanzihome_import_chunks;
drop table public.hanzihome_lesson_drafts;

drop function public.hanzihome_rollback_boya_nine_volume_cutover();
drop function public.hanzihome_cutover_boya_legacy_to_nine_volume(text, text);
