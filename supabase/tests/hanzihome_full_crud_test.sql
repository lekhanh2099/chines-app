begin;

-- Canonical word identity of the vocabulary store rows (hanzihome_vocab_items).
-- Course lesson content is bundled with the app; only the vocabulary rows and
-- the course/book/lesson rows they reference remain in the database.
select plan(19);

insert into public.hanzihome_courses (id, slug, title, source)
values ('canonical-crud-course', 'canonical-crud-course', 'Canonical words', 'custom');
insert into public.hanzihome_course_books (id, course_id, title, source)
values ('canonical-crud-book', 'canonical-crud-course', 'Canonical words', 'custom');
insert into public.hanzihome_lessons (id, course_id, book_id, lesson_number, lesson_order, title_zh, source)
select 'canonical-crud-lesson-' || i, 'canonical-crud-course', 'canonical-crud-book', i, i, '测试', 'custom'
from generate_series(1, 2) i;

-- Writers never submit a canonical word id; the trigger assigns it.
insert into public.hanzihome_vocab_items
  (id, course_id, book_id, lesson_id, item_order, word, pinyin, han_viet, meaning, category)
select 'canonical-crud-vocab-' || i, 'canonical-crud-course', 'canonical-crud-book',
  'canonical-crud-lesson-' || i, 1, '行', 'xíng', 'Hành',
  case when i = 1 then 'đi' else 'được' end, 'Từ vựng'
from generate_series(1, 2) i;

create temporary table canonical_word_before as
select id, word_id from public.hanzihome_vocab_items
where id in ('canonical-crud-vocab-1', 'canonical-crud-vocab-2');

select is(
  (select count(*)::integer from canonical_word_before where word_id is not null),
  2, 'new vocabulary rows get a canonical word without the writer naming it'
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
  $query$
    update public.hanzihome_vocab_items set pinyin = 'háng' where id = 'canonical-crud-vocab-1'
  $query$,
  'a vocabulary row can change its pinyin'
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
  0, 'every row keeps the canonical word of its own word and reading'
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

-- Upkeep: a word follows its only lesson row and disappears with its last one.
insert into public.hanzihome_vocab_items
  (id, course_id, book_id, lesson_id, item_order, word, pinyin, han_viet, meaning)
select 'canonical-crud-upkeep', course_id, book_id, lesson_id, 40, '独词', 'dú cí', 'Doc tu', 'từ đơn lẻ'
from public.hanzihome_vocab_items where id = 'canonical-crud-vocab-2';
update public.hanzihome_vocab_items set han_viet = 'Độc từ' where id = 'canonical-crud-upkeep';
select is(
  (select w.han_viet from public.hanzihome_words w
   join public.hanzihome_vocab_items v on v.word_id = w.id where v.id = 'canonical-crud-upkeep'),
  'Độc từ', 'a canonical word follows the Hán-Việt of its only lesson row'
);
update public.hanzihome_vocab_items set han_viet = 'Khác' where id = 'canonical-crud-tone-1';
select is(
  (select w.han_viet from public.hanzihome_words w
   join public.hanzihome_vocab_items v on v.word_id = w.id where v.id = 'canonical-crud-tone-1'),
  'Nhiệt náo', 'a canonical word shared by several rows keeps its text'
);
update public.hanzihome_vocab_items set word = '独词二' where id = 'canonical-crud-upkeep';
select is(
  (select count(*)::integer from public.hanzihome_words where word = '独词'),
  0, 'a canonical word without lesson rows is removed'
);

select * from finish();
rollback;
