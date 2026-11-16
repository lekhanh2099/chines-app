begin;

select plan(25);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) values (
  '00000000-0000-4000-8000-000000000901',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'hanzihome-crud-test@example.com',
  crypt('test-password', gen_salt('bf')),
  now(),
  now(),
  now()
);

create temporary table hanzihome_crud_test_state (
  course_id text not null,
  updated_at timestamptz not null
);

insert into hanzihome_crud_test_state (course_id, updated_at)
select
  result -> 'item' ->> 'id',
  (result -> 'item' ->> 'updated_at')::timestamptz
from private.hanzihome_mutate_content(
  '00000000-0000-4000-8000-000000000901',
  'create',
  'course',
  null,
  null,
  '{"slug":"crud-test","title":"CRUD Test","subtitle":null,"type":"custom"}'::jsonb,
  'Create CRUD test course'
) as mutation(result);

select is(
  (select count(*)::integer from hanzihome_crud_test_state),
  1,
  'create returns one canonical course'
);

select is(
  (
    select count(*)::integer
    from public.hanzihome_content_audit_log audit
    join hanzihome_crud_test_state state on state.course_id = audit.entity_id
    where audit.operation = 'create'
  ),
  1,
  'create writes its audit record in the same transaction'
);

select throws_ok(
  format(
    $query$
      select private.hanzihome_mutate_content(
        '00000000-0000-4000-8000-000000000901',
        'update',
        'course',
        %L,
        '2000-01-01T00:00:00Z',
        '{"title":"Stale update"}'::jsonb,
        'Reject stale update'
      )
    $query$,
    (select course_id from hanzihome_crud_test_state)
  ),
  '40001',
  'HanziHome entity changed since it was loaded',
  'stale updates fail with optimistic concurrency conflict'
);

select throws_ok(
  $query$
    select private.hanzihome_mutate_content(
      '00000000-0000-4000-8000-000000000901',
      'create',
      'book',
      null,
      null,
      '{"course_id":"missing-course","title":"Invalid parent"}'::jsonb,
      'Reject invalid parent'
    )
  $query$,
  '23503',
  'Active parent entity was not found',
  'create verifies the parent relationship'
);

select is(
  (
    select count(*)::integer
    from public.hanzihome_content_audit_log
    where reason = 'Reject invalid parent'
  ),
  0,
  'failed mutation does not write an audit record'
);

update hanzihome_crud_test_state state
set updated_at = (
  select (result -> 'item' ->> 'updated_at')::timestamptz
  from private.hanzihome_mutate_content(
    '00000000-0000-4000-8000-000000000901',
    'delete',
    'course',
    state.course_id,
    state.updated_at,
    '{}'::jsonb,
    'Soft delete CRUD test course'
  ) as mutation(result)
);

select ok(
  (
    select course.deleted_at is not null
    from public.hanzihome_courses course
    join hanzihome_crud_test_state state on state.course_id = course.id
  ),
  'delete is a soft delete'
);

select throws_ok(
  format(
    $query$
      select private.hanzihome_mutate_content(
        '00000000-0000-4000-8000-000000000901',
        'update',
        'course',
        %L,
        %L,
        '{"title":"Deleted update"}'::jsonb,
        'Reject update while deleted'
      )
    $query$,
    (select course_id from hanzihome_crud_test_state),
    (select updated_at from hanzihome_crud_test_state)
  ),
  '22023',
  'Deleted content must be restored before it can be changed',
  'deleted content cannot be updated'
);

update hanzihome_crud_test_state state
set updated_at = (
  select (result -> 'item' ->> 'updated_at')::timestamptz
  from private.hanzihome_mutate_content(
    '00000000-0000-4000-8000-000000000901',
    'restore',
    'course',
    state.course_id,
    state.updated_at,
    '{}'::jsonb,
    'Restore CRUD test course'
  ) as mutation(result)
);

select ok(
  (
    select course.deleted_at is null
    from public.hanzihome_courses course
    join hanzihome_crud_test_state state on state.course_id = course.id
  ),
  'restore makes soft-deleted content active again'
);

select is(
  (
    select count(*)::integer
    from public.hanzihome_content_audit_log audit
    join hanzihome_crud_test_state state on state.course_id = audit.entity_id
    where audit.operation in ('create', 'delete', 'restore')
  ),
  3,
  'successful create, delete, and restore each have an audit record'
);

-- Exercise the existing editor RPC; callers never submit a canonical word ID.
do $$
declare
  v_course_id text := (select course_id from hanzihome_crud_test_state);
  v_lesson_id text;
begin
  perform private.hanzihome_mutate_content(
    '00000000-0000-4000-8000-000000000901', 'create', 'book',
    'canonical-crud-book', null,
    jsonb_build_object('course_id', v_course_id, 'title', 'Canonical words'),
    'Create canonical word test book'
  );
  for i in 1..2 loop
    v_lesson_id := 'canonical-crud-lesson-' || i;
    perform private.hanzihome_mutate_content(
      '00000000-0000-4000-8000-000000000901', 'create', 'lesson',
      v_lesson_id, null,
      jsonb_build_object('course_id', v_course_id, 'book_id', 'canonical-crud-book',
        'lesson_number', i, 'title_zh', '测试', 'tags', '[]'::jsonb),
      'Create canonical word test lesson'
    );
    perform private.hanzihome_mutate_content(
      '00000000-0000-4000-8000-000000000901', 'create', 'vocab_item',
      'canonical-crud-vocab-' || i, null,
      jsonb_build_object('course_id', v_course_id, 'book_id', 'canonical-crud-book',
        'lesson_id', v_lesson_id, 'word', '行', 'pinyin', 'xíng', 'han_viet', 'Hành',
        'meaning', case when i = 1 then 'đi' else 'được' end,
        'category', 'Từ vựng', 'tags', '[]'::jsonb),
      'Create canonical word test vocabulary'
    );
  end loop;
end;
$$;

create temporary table canonical_word_before as
select id, word_id from public.hanzihome_vocab_items
where id in ('canonical-crud-vocab-1', 'canonical-crud-vocab-2');

select is(
  (select count(*)::integer from canonical_word_before where word_id is not null),
  2, 'editor creates populate word_id without changing the write contract'
);
select is(
  (select count(distinct word_id)::integer from canonical_word_before),
  1, 'the same reading in two lessons reuses its canonical word'
);
select is(
  (select word_id from canonical_word_before where id = 'canonical-crud-vocab-1'),
  'word-' || substr(md5('行' || E'\x1f' || 'xíng'), 1, 16),
  'canonical IDs are deterministic'
);
select is(
  (select meaning from public.hanzihome_vocab_items where id = 'canonical-crud-vocab-2'),
  'được', 'each lesson retains its own meaning'
);

select lives_ok(
  format(
    $query$
      select private.hanzihome_mutate_content(
        '00000000-0000-4000-8000-000000000901', 'update', 'vocab_item',
        'canonical-crud-vocab-1', %L, '{"pinyin":"háng"}'::jsonb,
        'Change canonical word reading'
      )
    $query$,
    (select updated_at from public.hanzihome_vocab_items where id = 'canonical-crud-vocab-1')
  ),
  'editor can change pinyin through the existing RPC'
);
select isnt(
  (select word_id from public.hanzihome_vocab_items where id = 'canonical-crud-vocab-1'),
  (select word_id from canonical_word_before where id = 'canonical-crud-vocab-1'),
  'changing pinyin assigns the other canonical reading'
);
select is(
  (select word_id from public.hanzihome_vocab_items where id = 'canonical-crud-vocab-2'),
  (select word_id from canonical_word_before where id = 'canonical-crud-vocab-2'),
  'changing one lesson does not change its sibling lesson link'
);
select ok(
  not has_table_privilege('anon', 'public.hanzihome_words', 'INSERT,UPDATE,DELETE,TRUNCATE')
  and not has_table_privilege('authenticated', 'public.hanzihome_words', 'INSERT,UPDATE,DELETE,TRUNCATE'),
  'clients cannot write canonical words directly'
);
select ok(
  not has_table_privilege('anon', 'public.hanzihome_words', 'SELECT')
  and has_table_privilege('authenticated', 'public.hanzihome_words', 'SELECT'),
  'only signed-in clients can read canonical words'
);
select ok(
  not has_function_privilege('anon', 'public.hanzihome_assign_vocab_word()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.hanzihome_assign_vocab_word()', 'EXECUTE'),
  'the security definer trigger cannot be called directly by clients'
);
select throws_ok(
  $query$
    insert into public.hanzihome_vocab_items
      (id, course_id, book_id, lesson_id, item_order, word, pinyin, han_viet, meaning)
    select 'canonical-crud-duplicate', course_id, book_id, lesson_id, 2, word, pinyin, han_viet, meaning
    from public.hanzihome_vocab_items where id = 'canonical-crud-vocab-2'
  $query$,
  '23505',
  'duplicate key value violates unique constraint "hanzihome_vocab_items_active_word_idx"',
  'the existing active lesson word/pinyin uniqueness still applies'
);
select is(
  (select count(*)::integer
   from public.hanzihome_vocab_items v join public.hanzihome_words w on w.id = v.word_id
   where v.id like 'canonical-crud-vocab-%'
     and (w.word <> btrim(v.word) or w.pinyin_key <> public.hanzihome_word_pinyin_key(v.word, v.pinyin))),
  0, 'editor writes retain matching canonical word and reading'
);

-- A multi-character word reuses one canonical word across tone spellings.
insert into public.hanzihome_vocab_items
  (id, course_id, book_id, lesson_id, item_order, word, pinyin, han_viet, meaning)
select 'canonical-crud-tone-' || n, course_id, book_id, lesson_id, 10 + n, '热闹',
  case n when 1 then 'rènào' else 'rènao' end, 'Nhiệt náo', 'náo nhiệt'
from public.hanzihome_vocab_items, generate_series(1, 2) n
where id = 'canonical-crud-vocab-2';
select is(
  (select count(distinct word_id)::integer from public.hanzihome_vocab_items
   where id like 'canonical-crud-tone-%' and word_id is not null),
  1, 'neutral-tone spellings of a multi-character word share one canonical word'
);
select lives_ok(
  $query$
    insert into public.hanzihome_vocab_items
      (id, course_id, book_id, lesson_id, item_order, word, pinyin, han_viet, meaning)
    select 'canonical-crud-blank', course_id, book_id, lesson_id, 20, ' ', '', '', ''
    from public.hanzihome_vocab_items where id = 'canonical-crud-vocab-2'
  $query$,
  'a blank word is stored without a canonical word instead of failing'
);

-- A pinyin listing several readings reuses the canonical word of the first one.
insert into public.hanzihome_vocab_items
  (id, course_id, book_id, lesson_id, item_order, word, pinyin, han_viet, meaning)
select 'canonical-crud-list', course_id, book_id, lesson_id, 30, '行', 'háng/xíng', 'Hàng', 'hàng'
from public.hanzihome_vocab_items where id = 'canonical-crud-vocab-2';
select is(
  (select word_id from public.hanzihome_vocab_items where id = 'canonical-crud-list'),
  (select word_id from public.hanzihome_vocab_items where id = 'canonical-crud-vocab-1'),
  'a reading list reuses the canonical word of its first reading'
);
select is(
  (select qual from pg_policies
   where schemaname = 'public' and tablename = 'hanzihome_words' and cmd = 'SELECT') like '%hanzihome_vocab_items%',
  true, 'canonical word reads follow vocabulary row visibility'
);

select * from finish();
rollback;
