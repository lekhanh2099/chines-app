-- Read-only preview, including soft-deleted vocabulary for future restores.
-- Mirrors public.hanzihome_word_pinyin_key so it can run before the migration.
with vocabulary as (
  select v.*,
    case
      when char_length(btrim(v.word)) > 1
        then translate(k.value, 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹ', 'aaaaeeeeiiiioooouuuuüüüünnn')
      else k.value
    end as pinyin_key
  from public.hanzihome_vocab_items v
  cross join lateral (
    select regexp_replace(
      lower(normalize(btrim(coalesce(v.pinyin, '')), NFC)), '[\s''’·\-]+', '', 'g'
    ) as value
  ) k
)
select
  count(*) as vocab_rows,
  count(*) filter (where deleted_at is null) as active_rows,
  count(distinct (btrim(word), pinyin_key)) filter (where btrim(word) <> '') as canonical_words,
  count(*) filter (where btrim(word) = '') as empty_words,
  count(*) filter (where deleted_at is null and btrim(word) = '') as active_empty_words,
  count(*) filter (where deleted_at is null and pinyin_key = '') as active_empty_pinyin
from vocabulary;

-- Written forms that will become several canonical words: real polyphones, or
-- pinyin entry mistakes worth fixing before the backfill.
with vocabulary as (
  select btrim(v.word) as word,
    case
      when char_length(btrim(v.word)) > 1
        then translate(k.value, 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹ', 'aaaaeeeeiiiioooouuuuüüüünnn')
      else k.value
    end as pinyin_key
  from public.hanzihome_vocab_items v
  cross join lateral (
    select regexp_replace(
      lower(normalize(btrim(coalesce(v.pinyin, '')), NFC)), '[\s''’·\-]+', '', 'g'
    ) as value
  ) k
)
select word, array_agg(distinct pinyin_key order by pinyin_key) as pinyin_keys
from vocabulary
where word <> ''
group by word
having count(distinct pinyin_key) >= 2
order by word;
