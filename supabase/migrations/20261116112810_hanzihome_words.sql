begin;

-- One reading of one written form. Multi-character words ignore tone marks, so
-- neutral-tone and tone-sandhi spellings (rènào / rènao, yīxià / yíxià) reuse one
-- word; a single character keeps its tones, where they separate real readings.
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
      lower(normalize(btrim(coalesce(p_pinyin, '')), NFC)), '[\s''’·\-]+', '', 'g'
    ) as value
  ) k;
$$;

create table public.hanzihome_words (
  id text primary key,
  word text not null check (btrim(word) <> ''),
  pinyin_key text not null,
  pinyin text not null default '',
  han_viet text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index hanzihome_words_word_pinyin_key_idx
  on public.hanzihome_words (word, pinyin_key);

alter table public.hanzihome_words enable row level security;
create policy "HanziHome word reads" on public.hanzihome_words
  for select to anon, authenticated using (true);
revoke all on table public.hanzihome_words from anon, authenticated;
grant select on table public.hanzihome_words to anon, authenticated;
grant all on table public.hanzihome_words to service_role;

alter table public.hanzihome_vocab_items
  add column word_id text references public.hanzihome_words (id);
create index hanzihome_vocab_items_word_id_idx
  on public.hanzihome_vocab_items (word_id);

create or replace function public.hanzihome_assign_vocab_word()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_word text := btrim(new.word);
  v_pinyin_key text := public.hanzihome_word_pinyin_key(new.word, new.pinyin);
begin
  if v_word = '' then
    new.word_id := null;
    return new;
  end if;

  insert into public.hanzihome_words (id, word, pinyin_key, pinyin, han_viet)
  values (
    'word-' || substr(md5(v_word || E'\x1f' || v_pinyin_key), 1, 16),
    v_word, v_pinyin_key, new.pinyin, new.han_viet
  )
  on conflict (word, pinyin_key) do nothing;

  select id into new.word_id
  from public.hanzihome_words
  where word = v_word and pinyin_key = v_pinyin_key;
  return new;
end;
$$;

revoke execute on function public.hanzihome_assign_vocab_word() from public, anon, authenticated;
grant execute on function public.hanzihome_assign_vocab_word() to service_role;

create trigger hanzihome_vocab_items_assign_word
  before insert or update of word, pinyin on public.hanzihome_vocab_items
  for each row execute function public.hanzihome_assign_vocab_word();

-- Include soft-deleted rows so restores retain their canonical word link.
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

-- Preserve the existing updated_at trigger. It timestamps this backfill too.
update public.hanzihome_vocab_items v
set word_id = w.id
from public.hanzihome_words w
where w.word = btrim(v.word)
  and w.pinyin_key = public.hanzihome_word_pinyin_key(v.word, v.pinyin)
  and v.word_id is distinct from w.id;

commit;
