begin;

-- P1-02 makes hanzihome_practice_attempts the immutable evidence owner for
-- learner review actions. Validate the legacy compatibility source before any
-- backfill so an unexpected historical shape fails closed.
do $$
declare
  invalid_review_items bigint;
begin
  if exists (
    select 1
    from public.user_learning_state
    where jsonb_typeof(review_history) <> 'array'
  ) then
    raise exception 'user_learning_state.review_history must be a JSON array before review-attempt backfill';
  end if;

  select count(*)
  into invalid_review_items
  from public.user_learning_state state
  cross join lateral jsonb_array_elements(coalesce(state.review_history, '[]'::jsonb)) item
  where jsonb_typeof(item) <> 'object'
    or nullif(item ->> 'type', '') is null
    or item ->> 'type' not in ('vocab', 'grammar', 'radical')
    or nullif(item ->> 'id', '') is null
    or nullif(item ->> 'result', '') is null
    or item ->> 'result' not in ('again', 'hard', 'known')
    or nullif(item ->> 'answeredAt', '') is null
    or item ->> 'answeredAt' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?Z$'
    or (
      item ? 'label'
      and jsonb_typeof(item -> 'label') not in ('string', 'null')
    );

  if invalid_review_items > 0 then
    raise exception 'Found % incompatible review_history items; refusing review-attempt backfill', invalid_review_items;
  end if;
end;
$$;

alter table public.hanzihome_practice_attempts
  drop constraint if exists hanzihome_practice_attempts_surface_check;

alter table public.hanzihome_practice_attempts
  add constraint hanzihome_practice_attempts_surface_check
  check (surface in (
    'reader',
    'dictation',
    'translation',
    'listening',
    'personal-learning',
    'shadowing',
    'review'
  ));

-- Attempt rows are evidence: authenticated clients may append/read their own
-- rows, but cannot rewrite or delete historical attempts.
drop policy if exists "Users can manage own Studio practice attempts"
  on public.hanzihome_practice_attempts;
drop policy if exists "Users can read own Studio practice attempts"
  on public.hanzihome_practice_attempts;
drop policy if exists "Users can create own Studio practice attempts"
  on public.hanzihome_practice_attempts;

create policy "Users can read own Studio practice attempts"
on public.hanzihome_practice_attempts
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create own Studio practice attempts"
on public.hanzihome_practice_attempts
for insert
to authenticated
with check (user_id = (select auth.uid()));

revoke update, delete
on table public.hanzihome_practice_attempts
from authenticated;

grant select, insert
on table public.hanzihome_practice_attempts
to authenticated;

-- Preserve all valid historical review events as immutable evidence. The
-- legacy JSON column remains untouched/frozen for compatibility; application
-- cutover will stop appending new entries there.
insert into public.hanzihome_practice_attempts (
  user_id,
  surface,
  content_id,
  direction,
  answer,
  score,
  response_ms,
  created_at
)
select
  state.user_id,
  'review',
  concat(item ->> 'type', ':', item ->> 'id'),
  null,
  jsonb_strip_nulls(
    jsonb_build_object(
      'kind', 'review',
      'itemType', item ->> 'type',
      'result', item ->> 'result',
      'label', nullif(item ->> 'label', ''),
      'legacySource', 'user_learning_state.review_history',
      'legacyOrdinal', ordinal
    )
  ),
  null,
  null,
  (item ->> 'answeredAt')::timestamptz
from public.user_learning_state state
cross join lateral jsonb_array_elements(coalesce(state.review_history, '[]'::jsonb))
  with ordinality as history(item, ordinal)
where not exists (
  select 1
  from public.hanzihome_practice_attempts attempt
  where attempt.user_id = state.user_id
    and attempt.surface = 'review'
    and attempt.content_id = concat(item ->> 'type', ':', item ->> 'id')
    and attempt.created_at = (item ->> 'answeredAt')::timestamptz
    and attempt.answer ->> 'result' = item ->> 'result'
);

comment on table public.hanzihome_practice_attempts is
  'Append-only HanziHome practice/review attempt evidence. Current mastery and review scheduling are owned by separate state records.';

commit;
