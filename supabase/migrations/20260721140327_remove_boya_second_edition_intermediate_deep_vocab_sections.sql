begin;

do $$
declare
  target_counts jsonb;
  expected_counts constant jsonb := jsonb_build_object(
    'boya-9e-intermediate-1:collocations', 586,
    'boya-9e-intermediate-1:warnings', 586,
    'boya-9e-intermediate-1:word_formation', 586,
    'boya-9e-intermediate-2:collocations', 684,
    'boya-9e-intermediate-2:warnings', 684,
    'boya-9e-intermediate-2:word_formation', 684
  );
  target_count integer;
  user_owned_count integer;
  deleted_count integer;
begin
  select
    coalesce(
      jsonb_object_agg(grouped.book_section_key, grouped.row_count),
      '{}'::jsonb
    ),
    coalesce(sum(grouped.row_count), 0)::integer,
    coalesce(sum(grouped.user_owned_count), 0)::integer
  into target_counts, target_count, user_owned_count
  from (
    select
      l.book_id || ':' || d.section_key as book_section_key,
      count(*)::integer as row_count,
      count(*) filter (
        where d.source <> 'seed' or d.owner_id is not null
      )::integer as user_owned_count
    from public.hanzihome_vocab_detail_sections d
    join public.hanzihome_lessons l on l.id = d.lesson_id
    where l.course_id = 'boya-nine-volume-second-edition'
      and l.book_id in (
        'boya-9e-intermediate-1',
        'boya-9e-intermediate-2'
      )
      and d.section_key in (
        'word_formation',
        'collocations',
        'warnings'
      )
    group by l.book_id, d.section_key
  ) grouped;

  if target_count <> 3810 or target_counts <> expected_counts then
    raise exception
      'Refusing Boya vocab cleanup: expected counts %, received % (% rows)',
      expected_counts,
      target_counts,
      target_count;
  end if;

  if user_owned_count <> 0 then
    raise exception
      'Refusing Boya vocab cleanup: found % custom or user-owned rows',
      user_owned_count;
  end if;

  delete from public.hanzihome_vocab_detail_sections d
  using public.hanzihome_lessons l
  where d.lesson_id = l.id
    and l.course_id = 'boya-nine-volume-second-edition'
    and l.book_id in (
      'boya-9e-intermediate-1',
      'boya-9e-intermediate-2'
    )
    and d.section_key in (
      'word_formation',
      'collocations',
      'warnings'
    );

  get diagnostics deleted_count = row_count;

  if deleted_count <> 3810 then
    raise exception
      'Boya vocab cleanup deleted % rows instead of 3810',
      deleted_count;
  end if;

  if exists (
    select 1
    from public.hanzihome_vocab_detail_sections d
    join public.hanzihome_lessons l on l.id = d.lesson_id
    where l.course_id = 'boya-nine-volume-second-edition'
      and l.book_id in (
        'boya-9e-intermediate-1',
        'boya-9e-intermediate-2'
      )
      and d.section_key in (
        'word_formation',
        'collocations',
        'warnings'
      )
  ) then
    raise exception 'Boya vocab cleanup left target rows behind';
  end if;
end;
$$;

commit;
