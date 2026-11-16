begin;

-- A pinyin that lists several readings ("chuán/zhuàn") is keyed by the first one,
-- so the row reuses that reading's canonical word instead of creating its own.
create or replace function public.hanzihome_word_pinyin_key(p_word text, p_pinyin text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when char_length(btrim(coalesce(p_word, ''))) > 1
      then translate(k.value, 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹ', 'aaaaeeeeiiiioooouuuuüüüünnn')
    else k.value
  end
  from (
    select regexp_replace(
      lower(normalize(btrim(split_part(coalesce(p_pinyin, ''), '/', 1)), NFC)),
      '[\s''’·\-]+', '', 'g'
    ) as value
  ) k;
$$;

insert into public.hanzihome_words (id, word, pinyin_key, pinyin, han_viet)
select distinct on (btrim(v.word), public.hanzihome_word_pinyin_key(v.word, v.pinyin))
  'word-' || substr(md5(btrim(v.word) || E'\x1f' || public.hanzihome_word_pinyin_key(v.word, v.pinyin)), 1, 16),
  btrim(v.word),
  public.hanzihome_word_pinyin_key(v.word, v.pinyin),
  v.pinyin,
  v.han_viet
from public.hanzihome_vocab_items v
where btrim(v.word) <> ''
order by btrim(v.word), public.hanzihome_word_pinyin_key(v.word, v.pinyin), v.created_at, v.id
on conflict (word, pinyin_key) do nothing;

-- Only rows whose link changes are touched, so only they get a new updated_at.
update public.hanzihome_vocab_items v
set word_id = w.id
from public.hanzihome_words w
where w.word = btrim(v.word)
  and w.pinyin_key = public.hanzihome_word_pinyin_key(v.word, v.pinyin)
  and v.word_id is distinct from w.id;

delete from public.hanzihome_words w
where not exists (select 1 from public.hanzihome_vocab_items v where v.word_id = w.id);

-- A canonical word is readable only through a vocabulary row the caller can read,
-- so custom and soft-deleted vocabulary stays as protected as its lesson row.
drop policy "HanziHome word reads" on public.hanzihome_words;
revoke all on table public.hanzihome_words from anon;
create policy "HanziHome word reads" on public.hanzihome_words
  for select to authenticated
  using (
    exists (
      select 1 from public.hanzihome_vocab_items v
      where v.word_id = hanzihome_words.id
    )
  );

commit;
