begin;

create table if not exists public.hanzihome_learning_loop_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  stable_key text not null,
  kind text not null,
  source_id text not null,
  source_href text not null,
  title_zh text not null default '',
  title_vi text not null default '',
  prompt_zh text not null,
  pinyin text not null default '',
  meaning_vi text not null default '',
  user_answer text not null default '',
  error_key text not null default '',
  state text not null check (state in ('new', 'learning', 'stable')),
  due_at timestamptz not null,
  interval_days integer not null default 0 check (interval_days >= 0),
  correct_streak integer not null default 0 check (correct_streak >= 0),
  lapse_count integer not null default 0 check (lapse_count >= 0),
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id, stable_key)
);

create index if not exists hanzihome_learning_loop_due_idx
  on public.hanzihome_learning_loop_items (user_id, due_at, state);

create table if not exists public.hanzihome_learning_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('encountered', 'inspected', 'review-added')),
  source_id text not null,
  source_href text not null,
  term text not null check (length(btrim(term)) > 0 and length(term) <= 48),
  context_text text not null default '' check (length(context_text) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists hanzihome_learning_events_user_created_idx
  on public.hanzihome_learning_events (user_id, created_at desc);

create or replace function public.hanzihome_learning_loop_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hanzihome_learning_loop_items_updated_at
  on public.hanzihome_learning_loop_items;
create trigger hanzihome_learning_loop_items_updated_at
before update on public.hanzihome_learning_loop_items
for each row execute function public.hanzihome_learning_loop_touch_updated_at();

alter table public.hanzihome_learning_loop_items enable row level security;
alter table public.hanzihome_learning_events enable row level security;

create policy "Users can manage own HanziHome learning loop items"
on public.hanzihome_learning_loop_items for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can manage own HanziHome learning events"
on public.hanzihome_learning_events for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

revoke all on table
  public.hanzihome_learning_loop_items,
  public.hanzihome_learning_events
from anon, authenticated;

grant select, insert, update, delete on table
  public.hanzihome_learning_loop_items,
  public.hanzihome_learning_events
to authenticated;

create or replace function public.hanzihome_rate_learning_loop_item(
  p_item_id text,
  p_rating text,
  p_expected_revision integer
)
returns public.hanzihome_learning_loop_items
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_row public.hanzihome_learning_loop_items;
  next_row public.hanzihome_learning_loop_items;
  next_interval integer;
  next_streak integer;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_item_id is null or length(btrim(p_item_id)) = 0 then
    raise exception using errcode = '22023', message = 'Learning loop item is required';
  end if;
  if p_rating not in ('again', 'hard', 'good') then
    raise exception using errcode = '22023', message = 'Learning loop rating is invalid';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception using errcode = '22023', message = 'Expected revision cannot be negative';
  end if;

  select * into current_row
  from public.hanzihome_learning_loop_items
  where user_id = auth.uid() and id = p_item_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Learning loop item not found';
  end if;
  if current_row.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Learning loop item changed since it was loaded';
  end if;

  next_interval := case
    when p_rating = 'again' then 0
    when p_rating = 'hard' then greatest(1, current_row.interval_days)
    else greatest(2, case when current_row.interval_days = 0 then 2 else current_row.interval_days * 2 end)
  end;
  next_streak := case when p_rating = 'again' then 0 else current_row.correct_streak + 1 end;

  update public.hanzihome_learning_loop_items
  set state = case when next_streak >= 3 then 'stable' else 'learning' end,
      due_at = case
        when p_rating = 'again' then now() + interval '10 minutes'
        else now() + make_interval(days => next_interval)
      end,
      interval_days = next_interval,
      correct_streak = next_streak,
      lapse_count = case when p_rating = 'again' then current_row.lapse_count + 1 else current_row.lapse_count end,
      revision = current_row.revision + 1
  where user_id = auth.uid() and id = p_item_id
  returning * into next_row;

  return next_row;
end;
$$;

revoke all on function public.hanzihome_rate_learning_loop_item(text, text, integer)
from public, anon;
grant execute on function public.hanzihome_rate_learning_loop_item(text, text, integer)
to authenticated;

commit;
