create or replace function public.get_hanzihome_catalog_stats()
returns table (
  course_id text,
  book_count bigint,
  lesson_count bigint,
  vocab_count bigint,
  grammar_count bigint,
  fallback_lesson_id text,
  last_lesson_id text
)
language sql
stable
security invoker
set search_path = ''
as $function$
  with book_stats as (
    select
      books.course_id,
      count(*)::bigint as book_count
    from public.hanzihome_course_books as books
    where books.deleted_at is null
    group by books.course_id
  ),
  lesson_stats as (
    select
      lessons.course_id,
      count(*)::bigint as lesson_count,
      (array_agg(lessons.id order by lessons.lesson_order, lessons.id))[1] as fallback_lesson_id,
      (array_agg(lessons.id order by lessons.lesson_order desc, lessons.id desc))[1] as last_lesson_id
    from public.hanzihome_lessons as lessons
    where lessons.deleted_at is null
    group by lessons.course_id
  ),
  vocab_stats as (
    select
      vocab.course_id,
      count(*)::bigint as vocab_count
    from public.hanzihome_vocab_items as vocab
    where vocab.deleted_at is null
    group by vocab.course_id
  ),
  grammar_stats as (
    select
      grammar.course_id,
      count(*)::bigint as grammar_count
    from public.hanzihome_grammar_points as grammar
    where grammar.deleted_at is null
    group by grammar.course_id
  )
  select
    courses.id as course_id,
    coalesce(book_stats.book_count, 0) as book_count,
    coalesce(lesson_stats.lesson_count, 0) as lesson_count,
    coalesce(vocab_stats.vocab_count, 0) as vocab_count,
    coalesce(grammar_stats.grammar_count, 0) as grammar_count,
    lesson_stats.fallback_lesson_id,
    lesson_stats.last_lesson_id
  from public.hanzihome_courses as courses
  left join book_stats on book_stats.course_id = courses.id
  left join lesson_stats on lesson_stats.course_id = courses.id
  left join vocab_stats on vocab_stats.course_id = courses.id
  left join grammar_stats on grammar_stats.course_id = courses.id
  where courses.deleted_at is null
  order by courses.course_order, courses.id;
$function$;

revoke all on function public.get_hanzihome_catalog_stats() from public;
revoke all on function public.get_hanzihome_catalog_stats() from anon;
grant execute on function public.get_hanzihome_catalog_stats() to authenticated;
grant execute on function public.get_hanzihome_catalog_stats() to service_role;
