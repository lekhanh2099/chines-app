begin;

-- A canonical word shows the pinyin and Hán-Việt of its lesson row while that row
-- is its only one, so fixing a typo in the lesson fixes the canonical word too.
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

  update public.hanzihome_words w
  set pinyin = new.pinyin, han_viet = new.han_viet, updated_at = now()
  where w.id = new.word_id
    and (w.pinyin, w.han_viet) is distinct from (new.pinyin, new.han_viet)
    and not exists (
      select 1 from public.hanzihome_vocab_items v
      where v.word_id = w.id and v.id <> new.id
    );
  return new;
end;
$$;

drop trigger hanzihome_vocab_items_assign_word on public.hanzihome_vocab_items;
create trigger hanzihome_vocab_items_assign_word
  before insert or update of word, pinyin, han_viet on public.hanzihome_vocab_items
  for each row execute function public.hanzihome_assign_vocab_word();

-- A canonical word no lesson row points to any more is removed.
create or replace function public.hanzihome_prune_vocab_word()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.word_id is not distinct from new.word_id then
    return null;
  end if;
  delete from public.hanzihome_words w
  where w.id = old.word_id
    and not exists (select 1 from public.hanzihome_vocab_items v where v.word_id = w.id);
  return null;
end;
$$;

revoke execute on function public.hanzihome_prune_vocab_word() from public, anon, authenticated;
grant execute on function public.hanzihome_prune_vocab_word() to service_role;

create trigger hanzihome_vocab_items_prune_word
  after update or delete on public.hanzihome_vocab_items
  for each row when (old.word_id is not null)
  execute function public.hanzihome_prune_vocab_word();

delete from public.hanzihome_words w
where not exists (select 1 from public.hanzihome_vocab_items v where v.word_id = w.id);

commit;
