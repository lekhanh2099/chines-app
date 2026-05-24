begin;

drop function if exists public.get_hanzihome_aggregate_vocab(text, text, text, text, integer);
drop function if exists public.get_hanzihome_aggregate_grammar(text, text, text, text, integer);

create function public.get_hanzihome_aggregate_vocab(
  p_course_id text default null,
  p_book_id text default null,
  p_lesson_id text default null,
  p_q text default null,
  p_limit integer default 1500
)
returns table (
  id text,
  course_id text,
  book_id text,
  lesson_id text,
  lesson_number integer,
  lesson_order integer,
  lesson_title text,
  word text,
  pinyin text,
  han_viet text,
  meaning text,
  category text,
  level text,
  pos_vi text,
  pos_zh text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    v.id,
    v.course_id,
    v.book_id,
    v.lesson_id,
    l.lesson_number,
    l.lesson_order,
    coalesce(l.title_vi, l.title_zh, l.id) as lesson_title,
    v.word,
    v.pinyin,
    v.han_viet,
    v.meaning,
    v.category,
    v.level,
    v.pos_vi,
    v.pos_zh
  from public.hanzihome_vocab_items v
  join public.hanzihome_lessons l on l.id = v.lesson_id
  where
    (v.source = 'seed' or v.owner_id = auth.uid())
    and (p_course_id is null or v.course_id = p_course_id)
    and (p_book_id is null or v.book_id = p_book_id)
    and (p_lesson_id is null or v.lesson_id = p_lesson_id)
    and (
      nullif(trim(coalesce(p_q, '')), '') is null
      or v.word ilike '%' || trim(p_q) || '%'
      or v.pinyin ilike '%' || trim(p_q) || '%'
      or v.han_viet ilike '%' || trim(p_q) || '%'
      or v.meaning ilike '%' || trim(p_q) || '%'
    )
  order by l.lesson_order asc, v.item_order asc, v.word asc
  limit least(greatest(coalesce(p_limit, 1500), 1), 1500);
$$;

create function public.get_hanzihome_aggregate_grammar(
  p_course_id text default null,
  p_book_id text default null,
  p_lesson_id text default null,
  p_q text default null,
  p_limit integer default 1000
)
returns table (
  id text,
  course_id text,
  book_id text,
  lesson_id text,
  lesson_number integer,
  lesson_order integer,
  lesson_title text,
  title text,
  clean_title text,
  core text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.id,
    g.course_id,
    g.book_id,
    g.lesson_id,
    l.lesson_number,
    l.lesson_order,
    coalesce(l.title_vi, l.title_zh, l.id) as lesson_title,
    g.title,
    g.clean_title,
    g.core
  from public.hanzihome_grammar_points g
  join public.hanzihome_lessons l on l.id = g.lesson_id
  where
    (g.source = 'seed' or g.owner_id = auth.uid())
    and (p_course_id is null or g.course_id = p_course_id)
    and (p_book_id is null or g.book_id = p_book_id)
    and (p_lesson_id is null or g.lesson_id = p_lesson_id)
    and (
      nullif(trim(coalesce(p_q, '')), '') is null
      or g.title ilike '%' || trim(p_q) || '%'
      or g.clean_title ilike '%' || trim(p_q) || '%'
      or g.core ilike '%' || trim(p_q) || '%'
    )
  order by l.lesson_order asc, g.point_order asc, g.clean_title asc
  limit least(greatest(coalesce(p_limit, 1000), 1), 1000);
$$;

revoke all on function public.get_hanzihome_aggregate_vocab(text, text, text, text, integer) from public;
revoke all on function public.get_hanzihome_aggregate_grammar(text, text, text, text, integer) from public;

grant execute on function public.get_hanzihome_aggregate_vocab(text, text, text, text, integer) to anon, authenticated;
grant execute on function public.get_hanzihome_aggregate_grammar(text, text, text, text, integer) to anon, authenticated;

commit;
