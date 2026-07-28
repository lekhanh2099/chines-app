begin;

with section_only_vocabulary as (
  select distinct on (item->>'id')
    item->>'id' as id,
    section.lesson_id,
    lesson.course_id,
    lesson.book_id,
    section.owner_id,
    section.source,
    (item->>'order')::integer as item_order,
    item->>'hanzi' as word,
    coalesce(item->>'pinyin', '') as pinyin,
    ''::text as han_viet,
    item->>'meaning_vi' as meaning,
    nullif(item->>'meaning_en', '') as meaning_en,
    coalesce(
      array(
        select tag.value
        from jsonb_array_elements_text(
          coalesce(item->'tags', '[]'::jsonb)
        ) as tag(value)
      ),
      '{}'::text[]
    ) as tags,
    'Từ vựng'::text as category,
    null::text as level,
    coalesce(item->>'pos', 'unknown') as pos_vi,
    null::text as pos_zh,
    null::text as tone,
    section.source_file,
    coalesce(section.imported_at, now()) as imported_at
  from public.hanzihome_lesson_sections as section
  join public.hanzihome_lessons as lesson
    on lesson.id = section.lesson_id
  cross join lateral jsonb_array_elements(section.payload->'items') as item
  where section.section_type = 'vocabulary'
    and section.deleted_at is null
    and lesson.deleted_at is null
    and jsonb_typeof(section.payload->'items') = 'array'
    and (item->>'order') ~ '^[0-9]+$'
    and nullif(item->>'id', '') is not null
    and nullif(item->>'hanzi', '') is not null
    and nullif(item->>'meaning_vi', '') is not null
    and not exists (
      select 1
      from public.hanzihome_vocab_items as vocab
      where vocab.lesson_id = section.lesson_id
        and vocab.deleted_at is null
        and (
          vocab.id = item->>'id'
          or (vocab.word = item->>'hanzi' and vocab.pinyin = coalesce(item->>'pinyin', ''))
          or vocab.item_order = (item->>'order')::integer
        )
    )
  order by item->>'id', section.section_order
)
insert into public.hanzihome_vocab_items (
  id,
  lesson_id,
  course_id,
  book_id,
  owner_id,
  source,
  item_order,
  word,
  pinyin,
  han_viet,
  meaning,
  meaning_en,
  tags,
  category,
  level,
  pos_vi,
  pos_zh,
  tone,
  source_file,
  imported_at
)
select
  id,
  lesson_id,
  course_id,
  book_id,
  owner_id,
  source,
  item_order,
  word,
  pinyin,
  han_viet,
  meaning,
  meaning_en,
  tags,
  category,
  level,
  pos_vi,
  pos_zh,
  tone,
  source_file,
  imported_at
from section_only_vocabulary
on conflict do nothing;

with section_vocabulary_examples as (
  select distinct on (example->>'id')
    example->>'id' as id,
    vocab.id as vocab_item_id,
    section.lesson_id,
    section.owner_id,
    section.source,
    example_entry.ordinality::integer as example_order,
    example->>'zh' as zh,
    nullif(example->>'pinyin', '') as pinyin,
    nullif(example->>'vi', '') as vi,
    null::text as note,
    coalesce(section.imported_at, now()) as imported_at
  from public.hanzihome_lesson_sections as section
  cross join lateral jsonb_array_elements(section.payload->'items') as item
  cross join lateral jsonb_array_elements(
    coalesce(item->'examples', '[]'::jsonb)
  ) with ordinality as example_entry(example, ordinality)
  join public.hanzihome_vocab_items as vocab
    on vocab.lesson_id = section.lesson_id
    and vocab.id = item->>'id'
    and vocab.deleted_at is null
  where section.section_type = 'vocabulary'
    and section.deleted_at is null
    and jsonb_typeof(section.payload->'items') = 'array'
    and nullif(example->>'id', '') is not null
    and nullif(example->>'zh', '') is not null
    and not exists (
      select 1
      from public.hanzihome_vocab_examples as vocab_example
      where vocab_example.vocab_item_id = vocab.id
        and vocab_example.deleted_at is null
        and (
          vocab_example.id = example->>'id'
          or vocab_example.example_order = example_entry.ordinality::integer
        )
    )
  order by example->>'id', section.section_order, example_entry.ordinality
)
insert into public.hanzihome_vocab_examples (
  id,
  vocab_item_id,
  lesson_id,
  owner_id,
  source,
  example_order,
  zh,
  pinyin,
  vi,
  note,
  imported_at
)
select
  id,
  vocab_item_id,
  lesson_id,
  owner_id,
  source,
  example_order,
  zh,
  pinyin,
  vi,
  note,
  imported_at
from section_vocabulary_examples
on conflict do nothing;

with exact_vocabulary_sections as materialized (
  select section.id
  from public.hanzihome_lesson_sections as section
  where section.section_type = 'vocabulary'
    and section.deleted_at is null
    and jsonb_typeof(section.payload->'items') = 'array'
    and jsonb_array_length(section.payload->'items') > 0
    and jsonb_array_length(section.payload->'items') = (
      select count(*)
      from public.hanzihome_vocab_items as vocab
      where vocab.lesson_id = section.lesson_id
        and vocab.deleted_at is null
    )
    and jsonb_array_length(section.payload->'items') = (
      select count(distinct item->>'id')
      from jsonb_array_elements(section.payload->'items') as item
    )
    and not exists (
      select 1
      from jsonb_array_elements(section.payload->'items') as item
      where not exists (
        select 1
        from public.hanzihome_vocab_items as vocab
        where vocab.lesson_id = section.lesson_id
          and vocab.deleted_at is null
          and vocab.id = item->>'id'
          and (item->>'order') ~ '^[0-9]+$'
          and vocab.item_order = (item->>'order')::integer
          and vocab.word = item->>'hanzi'
          and vocab.pinyin = coalesce(item->>'pinyin', '')
          and vocab.meaning = item->>'meaning_vi'
          and case lower(replace(coalesce(vocab.pos_vi, 'unknown'), ' ', '_'))
            when 'noun' then 'noun'
            when 'verb' then 'verb'
            when 'adjective' then 'adjective'
            when 'adverb' then 'adverb'
            when 'particle' then 'particle'
            when 'preposition' then 'preposition'
            when 'conjunction' then 'conjunction'
            when 'measure_word' then 'measure_word'
            when 'pronoun' then 'pronoun'
            when 'numeral' then 'numeral'
            when 'interjection' then 'interjection'
            when 'phrase' then 'phrase'
            when 'noun_phrase' then 'noun_phrase'
            when 'verb_phrase' then 'verb_phrase'
            when 'verb_noun' then 'verb_noun'
            when 'adjective_phrase' then 'adjective_phrase'
            when 'idiom' then 'idiom'
            when 'proper_noun' then 'proper_noun'
            when 'grammar_word' then 'grammar_word'
            when 'morpheme' then 'morpheme'
            else 'unknown'
          end = coalesce(item->>'pos', 'unknown')
          and (
            select coalesce(jsonb_agg(section_tag.value order by section_tag.value), '[]'::jsonb)
            from jsonb_array_elements_text(
              coalesce(item->'tags', '[]'::jsonb)
            ) as section_tag(value)
          ) = (
            select coalesce(jsonb_agg(vocab_tag.value order by vocab_tag.value), '[]'::jsonb)
            from unnest(vocab.tags) as vocab_tag(value)
          )
      )
    )
)
update public.hanzihome_lesson_sections as section
set payload = jsonb_set(section.payload, '{items}', '[]'::jsonb, false),
    updated_at = now()
from exact_vocabulary_sections
where section.id = exact_vocabulary_sections.id;

commit;
