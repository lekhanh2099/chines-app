begin;

-- Phase 4 retrieval uses exact pgvector search first. ANN indexes remain deliberately deferred.
create extension if not exists vector with schema extensions;

alter table public.ai_memories
  add column embedding extensions.vector(768) null,
  add column embedding_model text null,
  add column embedding_version integer null;

alter table public.ai_memories
  add constraint ai_memories_embedding_metadata_check
  check (
    (embedding is null and embedding_model is null and embedding_version is null)
    or
    (
      embedding is not null
      and embedding_model is not null
      and length(btrim(embedding_model)) > 0
      and embedding_version is not null
      and embedding_version > 0
    )
  );

alter table public.ai_post_turn_jobs
  add column memory_applied_at timestamptz null,
  add column relationship_applied_at timestamptz null,
  add column summary_applied_at timestamptz null;

create or replace function public.ai_match_memories(
  p_user_id uuid,
  p_character_id uuid,
  p_query_embedding text,
  p_match_count integer default 12,
  p_min_similarity double precision default 0.35
)
returns table (
  id uuid,
  character_id uuid,
  kind text,
  memory_key text,
  content text,
  importance numeric,
  confidence numeric,
  reinforcement_count integer,
  updated_at timestamptz,
  similarity double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.id,
    m.character_id,
    m.kind,
    m.memory_key,
    m.content,
    m.importance,
    m.confidence,
    m.reinforcement_count,
    m.updated_at,
    1 - (m.embedding OPERATOR(extensions.<=>) p_query_embedding::extensions.vector) as similarity
  from public.ai_memories m
  where m.user_id = p_user_id
    and m.status = 'active'
    and (m.character_id is null or m.character_id = p_character_id)
    and (m.valid_until is null or m.valid_until > now())
    and m.embedding is not null
    and 1 - (m.embedding OPERATOR(extensions.<=>) p_query_embedding::extensions.vector) >= p_min_similarity
  order by
    m.embedding OPERATOR(extensions.<=>) p_query_embedding::extensions.vector,
    m.importance desc,
    m.updated_at desc
  limit least(greatest(p_match_count, 1), 50);
$$;

revoke all on function public.ai_match_memories(uuid, uuid, text, integer, double precision)
from public, anon, authenticated;
grant execute on function public.ai_match_memories(uuid, uuid, text, integer, double precision)
to service_role;

create or replace function public.ai_set_memory_embedding(
  p_user_id uuid,
  p_memory_id uuid,
  p_embedding text,
  p_embedding_model text,
  p_embedding_version integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_embedding is null
     or p_embedding_model is null
     or length(btrim(p_embedding_model)) = 0
     or p_embedding_version is null
     or p_embedding_version <= 0 then
    raise exception 'Invalid AI memory embedding metadata' using errcode = '22023';
  end if;

  update public.ai_memories
  set
    embedding = p_embedding::extensions.vector,
    embedding_model = btrim(p_embedding_model),
    embedding_version = p_embedding_version,
    updated_at = now()
  where id = p_memory_id
    and user_id = p_user_id
    and status = 'active';

  return found;
end;
$$;

revoke all on function public.ai_set_memory_embedding(uuid, uuid, text, text, integer)
from public, anon, authenticated;
grant execute on function public.ai_set_memory_embedding(uuid, uuid, text, text, integer)
to service_role;

create or replace function public.ai_claim_post_turn_jobs(
  p_user_id uuid,
  p_conversation_id uuid default null,
  p_limit integer default 2
)
returns setof public.ai_post_turn_jobs
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with candidates as (
    select j.id
    from public.ai_post_turn_jobs j
    where j.user_id = p_user_id
      and (p_conversation_id is null or j.conversation_id = p_conversation_id)
      and j.status in ('pending', 'retry')
      and j.available_at <= now()
    order by j.available_at asc, j.created_at asc
    for update skip locked
    limit least(greatest(p_limit, 1), 5)
  )
  update public.ai_post_turn_jobs j
  set
    status = 'processing',
    attempt_count = j.attempt_count + 1,
    locked_at = now(),
    updated_at = now()
  from candidates c
  where j.id = c.id
  returning j.*;
end;
$$;

revoke all on function public.ai_claim_post_turn_jobs(uuid, uuid, integer)
from public, anon, authenticated;
grant execute on function public.ai_claim_post_turn_jobs(uuid, uuid, integer)
to service_role;

create or replace function public.ai_apply_memory_changes(
  p_user_id uuid,
  p_job_id uuid,
  p_user_message_id uuid,
  p_changes jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.ai_post_turn_jobs%rowtype;
  v_conversation_character_id uuid;
  v_expected_user_message_id uuid;
  v_change jsonb;
  v_action text;
  v_kind text;
  v_scope text;
  v_scope_character_id uuid;
  v_target_id uuid;
  v_target_content text;
  v_target_kind text;
  v_target_character_id uuid;
  v_target_memory_key text;
  v_memory_key text;
  v_content text;
  v_importance numeric;
  v_confidence numeric;
  v_embedding_text text;
  v_embedding_model text;
  v_embedding_version integer;
  v_new_id uuid;
  v_applied integer := 0;
begin
  if jsonb_typeof(p_changes) <> 'array' or jsonb_array_length(p_changes) > 8 then
    raise exception 'AI memory changes must be a JSON array with at most 8 items' using errcode = '22023';
  end if;

  select *
  into v_job
  from public.ai_post_turn_jobs
  where id = p_job_id
    and user_id = p_user_id
  for update;

  if v_job.id is null then
    raise exception 'AI post-turn job not found' using errcode = '42501';
  end if;

  if v_job.status <> 'processing' then
    raise exception 'AI post-turn job is not processing' using errcode = '55000';
  end if;

  if v_job.memory_applied_at is not null then
    return 0;
  end if;

  select c.character_id, a.reply_to_message_id
  into v_conversation_character_id, v_expected_user_message_id
  from public.ai_messages a
  join public.ai_conversations c
    on c.id = a.conversation_id
   and c.user_id = a.user_id
  where a.id = v_job.assistant_message_id
    and a.conversation_id = v_job.conversation_id
    and a.user_id = p_user_id
    and a.role = 'assistant';

  if v_conversation_character_id is null
     or v_expected_user_message_id is null
     or v_expected_user_message_id <> p_user_message_id then
    raise exception 'AI post-turn job evidence mismatch' using errcode = '42501';
  end if;

  for v_change in
    select value from jsonb_array_elements(p_changes)
  loop
    v_action := lower(btrim(coalesce(v_change ->> 'action', '')));
    if v_action = 'ignore' or v_action = '' then
      continue;
    end if;
    if v_action not in ('add', 'reinforce', 'supersede', 'resolve', 'forget') then
      raise exception 'Unsupported AI memory action: %', v_action using errcode = '22023';
    end if;

    v_kind := nullif(lower(btrim(coalesce(v_change ->> 'kind', ''))), '');
    v_scope := lower(btrim(coalesce(v_change ->> 'scope', 'character')));
    if v_scope not in ('global', 'character') then
      raise exception 'Unsupported AI memory scope: %', v_scope using errcode = '22023';
    end if;
    v_scope_character_id := case when v_scope = 'character' then v_conversation_character_id else null end;

    v_target_id := null;
    v_target_content := null;
    v_target_kind := null;
    v_target_character_id := null;
    v_target_memory_key := null;
    v_memory_key := nullif(lower(btrim(coalesce(v_change ->> 'memoryKey', ''))), '');
    v_content := nullif(btrim(coalesce(v_change ->> 'content', '')), '');
    v_importance := coalesce((v_change ->> 'importance')::numeric, 0.5);
    v_confidence := coalesce((v_change ->> 'confidence')::numeric, 0.5);
    v_embedding_text := nullif(v_change ->> 'embedding', '');
    v_embedding_model := nullif(btrim(coalesce(v_change ->> 'embeddingModel', '')), '');
    v_embedding_version := nullif(v_change ->> 'embeddingVersion', '')::integer;

    if v_importance < 0 or v_importance > 1 or v_confidence < 0 or v_confidence > 1 then
      raise exception 'AI memory scores must be between 0 and 1' using errcode = '22023';
    end if;

    if nullif(v_change ->> 'targetMemoryId', '') is not null then
      select m.id, m.content, m.kind, m.character_id, m.memory_key
      into v_target_id, v_target_content, v_target_kind, v_target_character_id, v_target_memory_key
      from public.ai_memories m
      where m.id = (v_change ->> 'targetMemoryId')::uuid
        and m.user_id = p_user_id
        and m.status = 'active'
      for update;
    end if;

    if v_target_id is null and v_memory_key is not null then
      select m.id, m.content, m.kind, m.character_id, m.memory_key
      into v_target_id, v_target_content, v_target_kind, v_target_character_id, v_target_memory_key
      from public.ai_memories m
      where m.user_id = p_user_id
        and m.status = 'active'
        and m.memory_key = v_memory_key
        and m.character_id is not distinct from v_scope_character_id
      order by m.updated_at desc
      limit 1
      for update;
    end if;

    if v_target_id is not null and v_action in ('reinforce', 'supersede', 'resolve', 'forget') then
      v_scope_character_id := v_target_character_id;
      if v_memory_key is null then
        v_memory_key := v_target_memory_key;
      end if;
      if v_kind is null then
        v_kind := v_target_kind;
      end if;
    end if;

    if v_action = 'add' and v_target_id is not null then
      if lower(btrim(v_target_content)) = lower(btrim(coalesce(v_content, ''))) then
        v_action := 'reinforce';
      else
        v_action := 'supersede';
      end if;
    end if;

    if v_action = 'reinforce' and v_target_id is null then
      v_action := 'add';
    end if;

    if v_action = 'supersede' and v_target_id is null then
      v_action := 'add';
    end if;

    if v_action = 'forget' then
      if v_target_id is not null then
        delete from public.ai_memories
        where id = v_target_id
          and user_id = p_user_id;
        v_applied := v_applied + 1;
      end if;
      continue;
    end if;

    if v_action = 'resolve' then
      if v_target_id is not null and v_target_kind = 'open_loop' then
        update public.ai_memories
        set
          status = 'resolved',
          updated_at = now()
        where id = v_target_id
          and user_id = p_user_id
          and status = 'active';

        insert into public.ai_memory_evidence (memory_id, message_id, user_id, action)
        values (v_target_id, p_user_message_id, p_user_id, 'resolved')
        on conflict do nothing;
        v_applied := v_applied + 1;
      end if;
      continue;
    end if;

    if v_kind not in ('fact', 'preference', 'habit', 'goal', 'episode', 'open_loop', 'inside_joke') then
      raise exception 'Invalid AI memory kind' using errcode = '22023';
    end if;

    if v_action in ('add', 'supersede') and v_content is null then
      raise exception 'AI memory content is required for add/supersede' using errcode = '22023';
    end if;

    if v_action = 'reinforce' then
      update public.ai_memories
      set
        reinforcement_count = reinforcement_count + 1,
        last_reinforced_at = now(),
        importance = greatest(importance, v_importance),
        confidence = greatest(confidence, v_confidence),
        embedding = case
          when embedding is null and v_embedding_text is not null then v_embedding_text::extensions.vector
          else embedding
        end,
        embedding_model = case
          when embedding is null and v_embedding_text is not null then v_embedding_model
          else embedding_model
        end,
        embedding_version = case
          when embedding is null and v_embedding_text is not null then v_embedding_version
          else embedding_version
        end,
        updated_at = now()
      where id = v_target_id
        and user_id = p_user_id
        and status = 'active';

      insert into public.ai_memory_evidence (memory_id, message_id, user_id, action)
      values (v_target_id, p_user_message_id, p_user_id, 'reinforced')
      on conflict do nothing;
      v_applied := v_applied + 1;
      continue;
    end if;

    if v_action = 'supersede' then
      update public.ai_memories
      set
        status = 'superseded',
        updated_at = now()
      where id = v_target_id
        and user_id = p_user_id
        and status = 'active';
    end if;

    insert into public.ai_memories (
      user_id,
      character_id,
      kind,
      memory_key,
      content,
      importance,
      confidence,
      embedding,
      embedding_model,
      embedding_version
    )
    values (
      p_user_id,
      v_scope_character_id,
      v_kind,
      v_memory_key,
      v_content,
      v_importance,
      v_confidence,
      case when v_embedding_text is null then null else v_embedding_text::extensions.vector end,
      case when v_embedding_text is null then null else v_embedding_model end,
      case when v_embedding_text is null then null else v_embedding_version end
    )
    returning id into v_new_id;

    insert into public.ai_memory_evidence (memory_id, message_id, user_id, action)
    values (v_new_id, p_user_message_id, p_user_id, 'created')
    on conflict do nothing;

    if v_action = 'supersede' and v_target_id is not null then
      update public.ai_memories
      set
        superseded_by_id = v_new_id,
        updated_at = now()
      where id = v_target_id
        and user_id = p_user_id;

      insert into public.ai_memory_evidence (memory_id, message_id, user_id, action)
      values (v_target_id, p_user_message_id, p_user_id, 'superseded')
      on conflict do nothing;
    end if;

    v_applied := v_applied + 1;
  end loop;

  update public.ai_post_turn_jobs
  set
    memory_applied_at = now(),
    updated_at = now()
  where id = p_job_id
    and user_id = p_user_id;

  return v_applied;
end;
$$;

revoke all on function public.ai_apply_memory_changes(uuid, uuid, uuid, jsonb)
from public, anon, authenticated;
grant execute on function public.ai_apply_memory_changes(uuid, uuid, uuid, jsonb)
to service_role;

create or replace function public.ai_evolve_relationship_for_job(
  p_user_id uuid,
  p_job_id uuid,
  p_increment numeric
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.ai_post_turn_jobs%rowtype;
  v_character_id uuid;
begin
  if p_increment < 0 or p_increment > 0.1 then
    raise exception 'AI relationship increment must be between 0 and 0.1' using errcode = '22023';
  end if;

  select *
  into v_job
  from public.ai_post_turn_jobs
  where id = p_job_id
    and user_id = p_user_id
  for update;

  if v_job.id is null then
    raise exception 'AI post-turn job not found' using errcode = '42501';
  end if;

  if v_job.relationship_applied_at is not null then
    return false;
  end if;

  select c.character_id
  into v_character_id
  from public.ai_conversations c
  where c.id = v_job.conversation_id
    and c.user_id = p_user_id;

  if v_character_id is null then
    raise exception 'AI conversation not found for relationship job' using errcode = '42501';
  end if;

  if p_increment > 0 then
    insert into public.ai_relationship_states (
      user_id,
      character_id,
      familiarity_score,
      revision
    )
    values (
      p_user_id,
      v_character_id,
      least(1, p_increment),
      1
    )
    on conflict (user_id, character_id) do update
    set
      familiarity_score = least(
        1,
        public.ai_relationship_states.familiarity_score
          + p_increment * (1 - public.ai_relationship_states.familiarity_score)
      ),
      revision = public.ai_relationship_states.revision + 1,
      updated_at = now();
  end if;

  update public.ai_post_turn_jobs
  set
    relationship_applied_at = now(),
    updated_at = now()
  where id = p_job_id
    and user_id = p_user_id;

  return p_increment > 0;
end;
$$;

revoke all on function public.ai_evolve_relationship_for_job(uuid, uuid, numeric)
from public, anon, authenticated;
grant execute on function public.ai_evolve_relationship_for_job(uuid, uuid, numeric)
to service_role;

create or replace function public.ai_apply_summary_for_job(
  p_user_id uuid,
  p_job_id uuid,
  p_summary text default null,
  p_summary_until_seq bigint default null,
  p_expected_summary_version integer default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.ai_post_turn_jobs%rowtype;
  v_conversation public.ai_conversations%rowtype;
  v_changed boolean := false;
begin
  select *
  into v_job
  from public.ai_post_turn_jobs
  where id = p_job_id
    and user_id = p_user_id
  for update;

  if v_job.id is null then
    raise exception 'AI post-turn job not found' using errcode = '42501';
  end if;

  if v_job.summary_applied_at is not null then
    return false;
  end if;

  select *
  into v_conversation
  from public.ai_conversations
  where id = v_job.conversation_id
    and user_id = p_user_id
  for update;

  if v_conversation.id is null then
    raise exception 'AI conversation not found for summary job' using errcode = '42501';
  end if;

  if p_summary is not null then
    if length(btrim(p_summary)) = 0
       or p_summary_until_seq is null
       or p_expected_summary_version is null
       or p_expected_summary_version <> v_conversation.summary_version
       or p_summary_until_seq < v_conversation.summary_until_seq
       or p_summary_until_seq > v_conversation.last_message_seq then
      raise exception 'Invalid AI summary checkpoint' using errcode = '22023';
    end if;

    update public.ai_conversations
    set
      summary = btrim(p_summary),
      summary_until_seq = p_summary_until_seq,
      summary_version = summary_version + 1,
      updated_at = now()
    where id = v_conversation.id
      and user_id = p_user_id;
    v_changed := true;
  end if;

  update public.ai_post_turn_jobs
  set
    summary_applied_at = now(),
    updated_at = now()
  where id = p_job_id
    and user_id = p_user_id;

  return v_changed;
end;
$$;

revoke all on function public.ai_apply_summary_for_job(uuid, uuid, text, bigint, integer)
from public, anon, authenticated;
grant execute on function public.ai_apply_summary_for_job(uuid, uuid, text, bigint, integer)
to service_role;

create or replace function public.ai_finish_post_turn_job(
  p_user_id uuid,
  p_job_id uuid,
  p_succeeded boolean,
  p_error text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.ai_post_turn_jobs%rowtype;
  v_backoff_seconds double precision;
begin
  select *
  into v_job
  from public.ai_post_turn_jobs
  where id = p_job_id
    and user_id = p_user_id
  for update;

  if v_job.id is null then
    raise exception 'AI post-turn job not found' using errcode = '42501';
  end if;

  if p_succeeded then
    if v_job.memory_applied_at is null
       or v_job.relationship_applied_at is null
       or v_job.summary_applied_at is null then
      raise exception 'AI post-turn job stages are incomplete' using errcode = '55000';
    end if;

    update public.ai_post_turn_jobs
    set
      status = 'succeeded',
      locked_at = null,
      completed_at = now(),
      last_error = null,
      updated_at = now()
    where id = p_job_id
      and user_id = p_user_id;
    return true;
  end if;

  v_backoff_seconds := least(3600.0, 30.0 * power(2.0, greatest(v_job.attempt_count - 1, 0)));

  update public.ai_post_turn_jobs
  set
    status = case when attempt_count >= 5 then 'dead' else 'retry' end,
    available_at = case
      when attempt_count >= 5 then available_at
      else now() + make_interval(secs => v_backoff_seconds)
    end,
    locked_at = null,
    completed_at = case when attempt_count >= 5 then now() else null end,
    last_error = left(coalesce(p_error, 'AI post-turn processing failed'), 2000),
    updated_at = now()
  where id = p_job_id
    and user_id = p_user_id;

  return false;
end;
$$;

revoke all on function public.ai_finish_post_turn_job(uuid, uuid, boolean, text)
from public, anon, authenticated;
grant execute on function public.ai_finish_post_turn_job(uuid, uuid, boolean, text)
to service_role;

comment on function public.ai_match_memories(uuid, uuid, text, integer, double precision) is
  'Server-only exact cosine retrieval for active global/current-character long-term memories.';
comment on function public.ai_apply_memory_changes(uuid, uuid, uuid, jsonb) is
  'Server-only idempotent-per-job transactional lifecycle application for extracted memory changes.';
comment on function public.ai_claim_post_turn_jobs(uuid, uuid, integer) is
  'Server-only bounded durable job claim using FOR UPDATE SKIP LOCKED.';
comment on function public.ai_evolve_relationship_for_job(uuid, uuid, numeric) is
  'Server-only saturating familiarity update, idempotent per durable post-turn job.';
comment on function public.ai_apply_summary_for_job(uuid, uuid, text, bigint, integer) is
  'Server-only summary checkpoint application, idempotent per durable post-turn job.';
comment on function public.ai_finish_post_turn_job(uuid, uuid, boolean, text) is
  'Server-only durable post-turn completion/retry transition with bounded exponential backoff.';

commit;
