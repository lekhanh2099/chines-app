-- Canonical production schema baseline captured on 2026-08-21.
--
-- Fresh/local databases execute this file. The populated linked production
-- database is aligned by repairing migration history to this version; do not
-- execute this baseline manually against production.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";


COMMENT ON SCHEMA "public" IS 'Application schema. Legacy lesson tables were removed; HanziHome JSON seed uses the hanzihome_* content tables.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "seq" bigint NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "client_message_id" "uuid",
    "reply_to_message_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_messages_content_check" CHECK (("length"("btrim"("content")) > 0)),
    CONSTRAINT "ai_messages_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "ai_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text"]))),
    CONSTRAINT "ai_messages_role_fields_check" CHECK (((("role" = 'user'::"text") AND ("client_message_id" IS NOT NULL) AND ("reply_to_message_id" IS NULL)) OR (("role" = 'assistant'::"text") AND ("client_message_id" IS NULL) AND ("reply_to_message_id" IS NOT NULL)))),
    CONSTRAINT "ai_messages_seq_check" CHECK (("seq" > 0))
);


ALTER TABLE "public"."ai_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_messages" IS 'Authoritative raw AI transcript. Product/system/context-builder instructions are not persisted as transcript messages.';



CREATE OR REPLACE FUNCTION "public"."ai_append_message"("p_user_id" "uuid", "p_conversation_id" "uuid", "p_role" "text", "p_content" "text", "p_client_message_id" "uuid" DEFAULT NULL::"uuid", "p_reply_to_message_id" "uuid" DEFAULT NULL::"uuid", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."ai_messages"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_content text;
  v_existing public.ai_messages%rowtype;
  v_reply_target public.ai_messages%rowtype;
  v_message public.ai_messages%rowtype;
  v_seq bigint;
  v_now timestamptz := now();
begin
  if p_user_id is null or p_conversation_id is null then
    raise exception 'AI message append requires user and conversation identifiers'
      using errcode = '22023';
  end if;

  if p_content is null or length(btrim(p_content)) = 0 then
    raise exception 'AI message content must not be empty'
      using errcode = '22023';
  end if;

  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object' then
    raise exception 'AI message metadata must be a JSON object'
      using errcode = '22023';
  end if;

  if p_role is null or p_role not in ('user', 'assistant') then
    raise exception 'Unsupported AI message role'
      using errcode = '22023';
  end if;

  v_content := btrim(p_content);

  if p_role = 'user' then
    if p_client_message_id is null or p_reply_to_message_id is not null then
      raise exception 'User AI messages require client_message_id and no reply_to_message_id'
        using errcode = '22023';
    end if;

    select message.*
    into v_existing
    from public.ai_messages as message
    where message.user_id = p_user_id
      and message.conversation_id = p_conversation_id
      and message.client_message_id = p_client_message_id
    limit 1;

    if found then
      if v_existing.content <> v_content then
        raise exception 'AI message idempotency conflict'
          using errcode = 'P0001';
      end if;
      return v_existing;
    end if;
  else
    if p_client_message_id is not null or p_reply_to_message_id is null then
      raise exception 'Assistant AI messages require reply_to_message_id and no client_message_id'
        using errcode = '22023';
    end if;
  end if;

  perform 1
  from public.ai_conversations as conversation
  where conversation.id = p_conversation_id
    and conversation.user_id = p_user_id
  for update;

  if not found then
    raise exception 'AI conversation not found for user'
      using errcode = 'P0002';
  end if;

  if p_role = 'user' then
    -- Re-check after the conversation lock so concurrent retries serialize safely.
    select message.*
    into v_existing
    from public.ai_messages as message
    where message.user_id = p_user_id
      and message.conversation_id = p_conversation_id
      and message.client_message_id = p_client_message_id
    limit 1;

    if found then
      if v_existing.content <> v_content then
        raise exception 'AI message idempotency conflict'
          using errcode = 'P0001';
      end if;
      return v_existing;
    end if;
  else
    select message.*
    into v_existing
    from public.ai_messages as message
    where message.user_id = p_user_id
      and message.conversation_id = p_conversation_id
      and message.role = 'assistant'
      and message.reply_to_message_id = p_reply_to_message_id
    limit 1;

    if found then
      if v_existing.content <> v_content then
        raise exception 'AI assistant reply idempotency conflict'
          using errcode = 'P0001';
      end if;
      return v_existing;
    end if;

    select message.*
    into v_reply_target
    from public.ai_messages as message
    where message.id = p_reply_to_message_id
      and message.user_id = p_user_id
      and message.conversation_id = p_conversation_id
      and message.role = 'user'
    limit 1;

    if not found then
      raise exception 'Assistant reply target is not an owned user message'
        using errcode = '22023';
    end if;
  end if;

  update public.ai_conversations as conversation
  set
    last_message_seq = conversation.last_message_seq + 1,
    last_message_at = v_now
  where conversation.id = p_conversation_id
    and conversation.user_id = p_user_id
  returning conversation.last_message_seq into v_seq;

  insert into public.ai_messages (
    user_id,
    conversation_id,
    seq,
    role,
    content,
    client_message_id,
    reply_to_message_id,
    metadata,
    created_at
  )
  values (
    p_user_id,
    p_conversation_id,
    v_seq,
    p_role,
    v_content,
    p_client_message_id,
    p_reply_to_message_id,
    p_metadata,
    v_now
  )
  returning * into v_message;

  return v_message;
end;
$$;


ALTER FUNCTION "public"."ai_append_message"("p_user_id" "uuid", "p_conversation_id" "uuid", "p_role" "text", "p_content" "text", "p_client_message_id" "uuid", "p_reply_to_message_id" "uuid", "p_metadata" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."ai_append_message"("p_user_id" "uuid", "p_conversation_id" "uuid", "p_role" "text", "p_content" "text", "p_client_message_id" "uuid", "p_reply_to_message_id" "uuid", "p_metadata" "jsonb") IS 'Server-only atomic AI transcript append with owned-conversation sequence allocation and retry idempotency.';



CREATE OR REPLACE FUNCTION "public"."ai_apply_memory_changes"("p_user_id" "uuid", "p_job_id" "uuid", "p_user_message_id" "uuid", "p_changes" "jsonb") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."ai_apply_memory_changes"("p_user_id" "uuid", "p_job_id" "uuid", "p_user_message_id" "uuid", "p_changes" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."ai_apply_memory_changes"("p_user_id" "uuid", "p_job_id" "uuid", "p_user_message_id" "uuid", "p_changes" "jsonb") IS 'Server-only idempotent-per-job transactional lifecycle application for extracted memory changes.';



CREATE OR REPLACE FUNCTION "public"."ai_apply_summary_for_job"("p_user_id" "uuid", "p_job_id" "uuid", "p_summary" "text" DEFAULT NULL::"text", "p_summary_until_seq" bigint DEFAULT NULL::bigint, "p_expected_summary_version" integer DEFAULT NULL::integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."ai_apply_summary_for_job"("p_user_id" "uuid", "p_job_id" "uuid", "p_summary" "text", "p_summary_until_seq" bigint, "p_expected_summary_version" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."ai_apply_summary_for_job"("p_user_id" "uuid", "p_job_id" "uuid", "p_summary" "text", "p_summary_until_seq" bigint, "p_expected_summary_version" integer) IS 'Server-only summary checkpoint application, idempotent per durable post-turn job.';



CREATE TABLE IF NOT EXISTS "public"."ai_post_turn_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "assistant_message_id" "uuid" NOT NULL,
    "kind" "text" DEFAULT 'memory-summary'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "available_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "locked_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "last_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "memory_applied_at" timestamp with time zone,
    "relationship_applied_at" timestamp with time zone,
    "summary_applied_at" timestamp with time zone,
    CONSTRAINT "ai_post_turn_jobs_attempt_count_check" CHECK (("attempt_count" >= 0)),
    CONSTRAINT "ai_post_turn_jobs_kind_check" CHECK (("kind" = 'memory-summary'::"text")),
    CONSTRAINT "ai_post_turn_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'retry'::"text", 'succeeded'::"text", 'dead'::"text"])))
);


ALTER TABLE "public"."ai_post_turn_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_post_turn_jobs" IS 'Server-only durable state for post-response memory and summary processing. No prompt or transcript payload is duplicated here.';



CREATE OR REPLACE FUNCTION "public"."ai_claim_post_turn_jobs"("p_user_id" "uuid", "p_conversation_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 2) RETURNS SETOF "public"."ai_post_turn_jobs"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."ai_claim_post_turn_jobs"("p_user_id" "uuid", "p_conversation_id" "uuid", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."ai_claim_post_turn_jobs"("p_user_id" "uuid", "p_conversation_id" "uuid", "p_limit" integer) IS 'Server-only bounded durable job claim using FOR UPDATE SKIP LOCKED.';



CREATE OR REPLACE FUNCTION "public"."ai_evolve_relationship_for_job"("p_user_id" "uuid", "p_job_id" "uuid", "p_increment" numeric) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."ai_evolve_relationship_for_job"("p_user_id" "uuid", "p_job_id" "uuid", "p_increment" numeric) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."ai_evolve_relationship_for_job"("p_user_id" "uuid", "p_job_id" "uuid", "p_increment" numeric) IS 'Server-only saturating familiarity update, idempotent per durable post-turn job.';



CREATE OR REPLACE FUNCTION "public"."ai_finish_post_turn_job"("p_user_id" "uuid", "p_job_id" "uuid", "p_succeeded" boolean, "p_error" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."ai_finish_post_turn_job"("p_user_id" "uuid", "p_job_id" "uuid", "p_succeeded" boolean, "p_error" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."ai_finish_post_turn_job"("p_user_id" "uuid", "p_job_id" "uuid", "p_succeeded" boolean, "p_error" "text") IS 'Server-only durable post-turn completion/retry transition with bounded exponential backoff.';



CREATE OR REPLACE FUNCTION "public"."ai_match_memories"("p_user_id" "uuid", "p_character_id" "uuid", "p_query_embedding" "text", "p_match_count" integer DEFAULT 12, "p_min_similarity" double precision DEFAULT 0.35) RETURNS TABLE("id" "uuid", "character_id" "uuid", "kind" "text", "memory_key" "text", "content" "text", "importance" numeric, "confidence" numeric, "reinforcement_count" integer, "updated_at" timestamp with time zone, "similarity" double precision)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."ai_match_memories"("p_user_id" "uuid", "p_character_id" "uuid", "p_query_embedding" "text", "p_match_count" integer, "p_min_similarity" double precision) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."ai_match_memories"("p_user_id" "uuid", "p_character_id" "uuid", "p_query_embedding" "text", "p_match_count" integer, "p_min_similarity" double precision) IS 'Server-only exact cosine retrieval for active global/current-character long-term memories.';



CREATE OR REPLACE FUNCTION "public"."ai_set_memory_embedding"("p_user_id" "uuid", "p_memory_id" "uuid", "p_embedding" "text", "p_embedding_model" "text", "p_embedding_version" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."ai_set_memory_embedding"("p_user_id" "uuid", "p_memory_id" "uuid", "p_embedding" "text", "p_embedding_model" "text", "p_embedding_version" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ai_touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."ai_touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_edit_hanzihome_content"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.hanzihome_content_roles role_assignment
      where role_assignment.user_id = (select auth.uid())
        and role_assignment.role in ('editor', 'admin')
    );
$$;


ALTER FUNCTION "public"."can_edit_hanzihome_content"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_edit_hanzihome_content"() IS 'Returns true when the current authenticated session has an editor or admin HanziHome content role.';



CREATE OR REPLACE FUNCTION "public"."create_lesson_text_annotation"("p_lesson_id" "text", "p_node_type" "text", "p_node_id" "text", "p_start_offset" integer, "p_end_offset" integer, "p_selected_text" "text", "p_prefix_text" "text" DEFAULT ''::"text", "p_suffix_text" "text" DEFAULT ''::"text", "p_note_text" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  current_user_id uuid := auth.uid();
  created_annotation_id uuid;
  created_note_id uuid;
  normalized_note text := nullif(btrim(p_note_text), '');
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if normalized_note is not null then
    insert into public.notes (user_id, title, tags, category, content)
    values (
      current_user_id,
      left('Ghi chú: ' || btrim(p_selected_text), 120),
      array['annotation'],
      'general',
      jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(
          jsonb_build_object(
            'type', 'paragraph',
            'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', normalized_note))
          )
        )
      )
    )
    returning id into created_note_id;

    insert into public.lesson_note_links (
      user_id,
      note_id,
      target_type,
      target_key,
      relation_type
    )
    values (
      current_user_id,
      created_note_id,
      'hanzihome_lesson',
      p_lesson_id,
      'annotation'
    );
  end if;

  insert into public.lesson_text_annotations (
    user_id,
    lesson_id,
    node_type,
    node_id,
    start_offset,
    end_offset,
    selected_text,
    prefix_text,
    suffix_text,
    note_id
  )
  values (
    current_user_id,
    p_lesson_id,
    p_node_type,
    p_node_id,
    p_start_offset,
    p_end_offset,
    btrim(p_selected_text),
    coalesce(p_prefix_text, ''),
    coalesce(p_suffix_text, ''),
    created_note_id
  )
  returning id into created_annotation_id;

  return created_annotation_id;
end;
$$;


ALTER FUNCTION "public"."create_lesson_text_annotation"("p_lesson_id" "text", "p_node_type" "text", "p_node_id" "text", "p_start_offset" integer, "p_end_offset" integer, "p_selected_text" "text", "p_prefix_text" "text", "p_suffix_text" "text", "p_note_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_lesson_text_annotation"("p_annotation_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  current_user_id uuid := auth.uid();
  target_note_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select note_id into target_note_id
  from public.lesson_text_annotations
  where id = p_annotation_id and user_id = current_user_id
  for update;

  if not found then
    return false;
  end if;

  if target_note_id is not null then
    delete from public.notes where id = target_note_id and user_id = current_user_id;
  else
    delete from public.lesson_text_annotations
    where id = p_annotation_id and user_id = current_user_id;
  end if;

  return true;
end;
$$;


ALTER FUNCTION "public"."delete_lesson_text_annotation"("p_annotation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_note_short_id"() RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;


ALTER FUNCTION "public"."generate_note_short_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_hanzihome_aggregate_grammar"("p_course_id" "text" DEFAULT NULL::"text", "p_book_id" "text" DEFAULT NULL::"text", "p_lesson_id" "text" DEFAULT NULL::"text", "p_q" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 1000) RETURNS TABLE("id" "text", "course_id" "text", "book_id" "text", "lesson_id" "text", "lesson_number" integer, "lesson_order" integer, "lesson_title" "text", "title" "text", "clean_title" "text", "core" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
  select
    g.id,
    g.course_id,
    g.book_id,
    g.lesson_id,
    l.lesson_number,
    l.lesson_order,
    coalesce(l.title_vi, l.title_zh, l.id) as lesson_title,
    g.title,
    g.clean_title,
    g.core
  from public.hanzihome_grammar_points g
  join public.hanzihome_lessons l on l.id = g.lesson_id
  where
    g.source = 'seed'
    and (p_course_id is null or g.course_id = p_course_id)
    and (p_book_id is null or g.book_id = p_book_id)
    and (p_lesson_id is null or g.lesson_id = p_lesson_id)
    and (
      nullif(trim(coalesce(p_q, '')), '') is null
      or g.title ilike '%' || trim(p_q) || '%'
      or g.clean_title ilike '%' || trim(p_q) || '%'
      or g.core ilike '%' || trim(p_q) || '%'
    )
  order by l.lesson_order asc, g.point_order asc, g.clean_title asc
  limit least(greatest(coalesce(p_limit, 1000), 1), 1000);
$$;


ALTER FUNCTION "public"."get_hanzihome_aggregate_grammar"("p_course_id" "text", "p_book_id" "text", "p_lesson_id" "text", "p_q" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_hanzihome_aggregate_vocab"("p_course_id" "text" DEFAULT NULL::"text", "p_book_id" "text" DEFAULT NULL::"text", "p_lesson_id" "text" DEFAULT NULL::"text", "p_q" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 1500) RETURNS TABLE("id" "text", "course_id" "text", "book_id" "text", "lesson_id" "text", "lesson_number" integer, "lesson_order" integer, "lesson_title" "text", "word" "text", "pinyin" "text", "han_viet" "text", "meaning" "text", "category" "text", "level" "text", "pos_vi" "text", "pos_zh" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
  select
    v.id,
    v.course_id,
    v.book_id,
    v.lesson_id,
    l.lesson_number,
    l.lesson_order,
    coalesce(l.title_vi, l.title_zh, l.id) as lesson_title,
    v.word,
    v.pinyin,
    v.han_viet,
    v.meaning,
    v.category,
    v.level,
    v.pos_vi,
    v.pos_zh
  from public.hanzihome_vocab_items v
  join public.hanzihome_lessons l on l.id = v.lesson_id
  where
    v.source = 'seed'
    and (p_course_id is null or v.course_id = p_course_id)
    and (p_book_id is null or v.book_id = p_book_id)
    and (p_lesson_id is null or v.lesson_id = p_lesson_id)
    and (
      nullif(trim(coalesce(p_q, '')), '') is null
      or v.word ilike '%' || trim(p_q) || '%'
      or v.pinyin ilike '%' || trim(p_q) || '%'
      or v.han_viet ilike '%' || trim(p_q) || '%'
      or v.meaning ilike '%' || trim(p_q) || '%'
    )
  order by l.lesson_order asc, v.item_order asc, v.word asc
  limit least(greatest(coalesce(p_limit, 1500), 1), 1500);
$$;


ALTER FUNCTION "public"."get_hanzihome_aggregate_vocab"("p_course_id" "text", "p_book_id" "text", "p_lesson_id" "text", "p_q" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_hanzihome_catalog_stats"() RETURNS TABLE("course_id" "text", "book_count" bigint, "lesson_count" bigint, "vocab_count" bigint, "grammar_count" bigint, "fallback_lesson_id" "text", "last_lesson_id" "text")
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
  with book_stats as (
    select books.course_id, count(*)::bigint as book_count
    from public.hanzihome_course_books as books
    where books.deleted_at is null
    group by books.course_id
  ),
  lesson_stats as (
    select
      lessons.course_id,
      count(*)::bigint as lesson_count,
      (array_agg(lessons.id order by lessons.lesson_order, lessons.id))[1] as fallback_lesson_id,
      (array_agg(lessons.id order by lessons.lesson_order desc, lessons.id desc))[1] as last_lesson_id
    from public.hanzihome_lessons as lessons
    where lessons.deleted_at is null
    group by lessons.course_id
  ),
  vocab_stats as (
    select vocab.course_id, count(*)::bigint as vocab_count
    from public.hanzihome_vocab_items as vocab
    where vocab.deleted_at is null
    group by vocab.course_id
  ),
  grammar_stats as (
    select grammar.course_id, count(*)::bigint as grammar_count
    from public.hanzihome_grammar_points as grammar
    where grammar.deleted_at is null
    group by grammar.course_id
  )
  select
    courses.id as course_id,
    coalesce(book_stats.book_count, 0) as book_count,
    coalesce(lesson_stats.lesson_count, 0) as lesson_count,
    coalesce(vocab_stats.vocab_count, 0) as vocab_count,
    coalesce(grammar_stats.grammar_count, 0) as grammar_count,
    lesson_stats.fallback_lesson_id,
    lesson_stats.last_lesson_id
  from public.hanzihome_courses as courses
  left join book_stats on book_stats.course_id = courses.id
  left join lesson_stats on lesson_stats.course_id = courses.id
  left join vocab_stats on vocab_stats.course_id = courses.id
  left join grammar_stats on grammar_stats.course_id = courses.id
  where courses.deleted_at is null
  order by courses.course_order, courses.id;
$$;


ALTER FUNCTION "public"."get_hanzihome_catalog_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.users (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_apply_external_seed_patches"("p_patches" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_group jsonb;
  v_patch jsonb;
  v_collection text;
  v_id text;
  v_path text[];
  v_value jsonb;
  v_updated integer := 0;
begin
  if auth.role() <> 'service_role' and session_user <> 'postgres' then
    raise exception 'service_role or postgres is required';
  end if;

  if jsonb_typeof(p_patches) <> 'array' then
    raise exception 'p_patches must be a JSON array';
  end if;

  for v_group in select value from jsonb_array_elements(p_patches)
  loop
    v_collection := v_group ->> 'collection';
    v_id := v_group ->> 'id';

    if v_collection not in ('lessonSections', 'lessonTexts', 'vocabItems') or v_id is null then
      raise exception 'Unsupported patch target: %/%', v_collection, v_id;
    end if;

    for v_patch in select value from jsonb_array_elements(v_group -> 'patches')
    loop
      select array_agg(value order by ordinality)
      into v_path
      from jsonb_array_elements_text(v_patch -> 'path') with ordinality;
      v_value := v_patch -> 'value';

      if v_collection = 'lessonSections' then
        if v_path[1] <> 'payload' or coalesce(array_length(v_path, 1), 0) < 2 then
          raise exception 'Unsupported lesson section path: %', v_path;
        end if;
        update public.hanzihome_lesson_sections
        set payload = jsonb_set(payload, v_path[2:array_length(v_path, 1)], v_value, true), updated_at = now()
        where id = v_id::uuid and source = 'seed';
      elsif v_collection = 'lessonTexts' then
        if v_path = array['content'] then
          update public.hanzihome_lesson_texts set content = v_value #>> '{}', updated_at = now() where id = v_id and source = 'seed';
        elsif v_path = array['title'] then
          update public.hanzihome_lesson_texts set title = v_value #>> '{}', updated_at = now() where id = v_id and source = 'seed';
        else
          raise exception 'Unsupported lesson text path: %', v_path;
        end if;
      elsif v_collection = 'vocabItems' then
        case v_path[1]
          when 'han_viet' then update public.hanzihome_vocab_items set han_viet = v_value #>> '{}', updated_at = now() where id = v_id and source = 'seed';
          when 'pinyin' then update public.hanzihome_vocab_items set pinyin = v_value #>> '{}', updated_at = now() where id = v_id and source = 'seed';
          when 'meaning' then update public.hanzihome_vocab_items set meaning = v_value #>> '{}', updated_at = now() where id = v_id and source = 'seed';
          when 'word' then update public.hanzihome_vocab_items set word = v_value #>> '{}', updated_at = now() where id = v_id and source = 'seed';
          when 'pos_vi' then update public.hanzihome_vocab_items set pos_vi = v_value #>> '{}', updated_at = now() where id = v_id and source = 'seed';
          when 'pos_zh' then update public.hanzihome_vocab_items set pos_zh = v_value #>> '{}', updated_at = now() where id = v_id and source = 'seed';
          when 'tags' then update public.hanzihome_vocab_items set tags = array(select jsonb_array_elements_text(v_value)), updated_at = now() where id = v_id and source = 'seed';
          else raise exception 'Unsupported vocab item path: %', v_path;
        end case;
      end if;

      if not found then
        raise exception 'Seed row not found for patch target: %/%', v_collection, v_id;
      end if;
      v_updated := v_updated + 1;
    end loop;
  end loop;

  return jsonb_build_object('patchedFields', v_updated);
end;
$$;


ALTER FUNCTION "public"."hanzihome_apply_external_seed_patches"("p_patches" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_create_lesson_text_annotation_as_server"("p_user_id" "uuid", "p_lesson_id" "text", "p_node_type" "text", "p_node_id" "text", "p_start_offset" integer, "p_end_offset" integer, "p_selected_text" "text", "p_prefix_text" "text" DEFAULT ''::"text", "p_suffix_text" "text" DEFAULT ''::"text", "p_note_text" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  created_annotation_id uuid;
  created_note_id uuid;
  normalized_note text := nullif(btrim(p_note_text), '');
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role is required';
  end if;

  if p_user_id is null then
    raise exception 'User is required';
  end if;

  if normalized_note is not null then
    insert into public.notes (user_id, title, tags, category, content)
    values (
      p_user_id,
      left('Ghi chú: ' || btrim(p_selected_text), 120),
      array['annotation'],
      'general',
      jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(
          jsonb_build_object(
            'type', 'paragraph',
            'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', normalized_note))
          )
        )
      )
    )
    returning id into created_note_id;

    insert into public.lesson_note_links (
      user_id,
      note_id,
      target_type,
      target_key,
      relation_type
    )
    values (
      p_user_id,
      created_note_id,
      'hanzihome_lesson',
      p_lesson_id,
      'annotation'
    );
  end if;

  insert into public.lesson_text_annotations (
    user_id,
    lesson_id,
    node_type,
    node_id,
    start_offset,
    end_offset,
    selected_text,
    prefix_text,
    suffix_text,
    note_id
  )
  values (
    p_user_id,
    p_lesson_id,
    p_node_type,
    p_node_id,
    p_start_offset,
    p_end_offset,
    btrim(p_selected_text),
    coalesce(p_prefix_text, ''),
    coalesce(p_suffix_text, ''),
    created_note_id
  )
  returning id into created_annotation_id;

  return created_annotation_id;
end;
$$;


ALTER FUNCTION "public"."hanzihome_create_lesson_text_annotation_as_server"("p_user_id" "uuid", "p_lesson_id" "text", "p_node_type" "text", "p_node_id" "text", "p_start_offset" integer, "p_end_offset" integer, "p_selected_text" "text", "p_prefix_text" "text", "p_suffix_text" "text", "p_note_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_delete_lesson_text_annotation_as_server"("p_user_id" "uuid", "p_annotation_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  target_note_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role is required';
  end if;

  if p_user_id is null then
    raise exception 'User is required';
  end if;

  select note_id into target_note_id
  from public.lesson_text_annotations
  where id = p_annotation_id and user_id = p_user_id
  for update;

  if not found then
    return false;
  end if;

  if target_note_id is not null then
    delete from public.notes where id = target_note_id and user_id = p_user_id;
  else
    delete from public.lesson_text_annotations
    where id = p_annotation_id and user_id = p_user_id;
  end if;

  return true;
end;
$$;


ALTER FUNCTION "public"."hanzihome_delete_lesson_text_annotation_as_server"("p_user_id" "uuid", "p_annotation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_delete_reader_annotation"("p_annotation_id" "uuid", "p_expected_revision" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  current_row public.hanzihome_reader_annotations;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  select * into current_row
  from public.hanzihome_reader_annotations
  where id = p_annotation_id and user_id = auth.uid() and deleted_at is null
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Reader annotation not found';
  end if;
  if current_row.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Reader annotation changed since it was loaded';
  end if;
  update public.hanzihome_reader_annotations
  set deleted_at = now(), revision = current_row.revision + 1
  where id = p_annotation_id and user_id = auth.uid();
  return true;
end;
$$;


ALTER FUNCTION "public"."hanzihome_delete_reader_annotation"("p_annotation_id" "uuid", "p_expected_revision" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_delete_reader_annotation_as_server"("p_user_id" "uuid", "p_annotation_id" "uuid", "p_expected_revision" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_delete_reader_annotation(p_annotation_id, p_expected_revision);
end;
$$;


ALTER FUNCTION "public"."hanzihome_delete_reader_annotation_as_server"("p_user_id" "uuid", "p_annotation_id" "uuid", "p_expected_revision" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_delete_reader_pronunciation_override"("p_override_id" "uuid", "p_expected_revision" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  current_row public.hanzihome_reader_pronunciation_overrides;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  select * into current_row
  from public.hanzihome_reader_pronunciation_overrides
  where id = p_override_id and user_id = auth.uid()
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Reader pronunciation override not found';
  end if;
  if current_row.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Reader pronunciation override changed since it was loaded';
  end if;
  delete from public.hanzihome_reader_pronunciation_overrides
  where id = p_override_id and user_id = auth.uid();
  return true;
end;
$$;


ALTER FUNCTION "public"."hanzihome_delete_reader_pronunciation_override"("p_override_id" "uuid", "p_expected_revision" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_delete_reader_pronunciation_override_as_server"("p_user_id" "uuid", "p_override_id" "uuid", "p_expected_revision" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_delete_reader_pronunciation_override(p_override_id, p_expected_revision);
end;
$$;


ALTER FUNCTION "public"."hanzihome_delete_reader_pronunciation_override_as_server"("p_user_id" "uuid", "p_override_id" "uuid", "p_expected_revision" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_import_external_seed_package"("p_seed" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_collision text;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;

  if jsonb_typeof(p_seed) <> 'object' then
    raise exception using errcode = '22023', message = 'Seed package must be a JSON object';
  end if;

  select collision into v_collision
  from (
    select 'hanzihome_courses:' || (value->>'id') as collision
    from jsonb_array_elements(coalesce(p_seed->'courses', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_courses row where row.id = value->>'id')
    union all
    select 'hanzihome_course_books:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'books', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_course_books row where row.id = value->>'id')
    union all
    select 'hanzihome_lessons:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'lessons', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_lessons row where row.id = value->>'id')
    union all
    select 'hanzihome_lesson_sections:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'lessonSections', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_lesson_sections row where row.id = (value->>'id')::uuid)
    union all
    select 'hanzihome_lesson_texts:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'lessonTexts', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_lesson_texts row where row.id = value->>'id')
    union all
    select 'hanzihome_vocab_items:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'vocabItems', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_vocab_items row where row.id = value->>'id')
    union all
    select 'hanzihome_vocab_examples:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'vocabExamples', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_vocab_examples row where row.id = value->>'id')
    union all
    select 'hanzihome_vocab_detail_sections:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'vocabDetailSections', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_vocab_detail_sections row where row.id = value->>'id')
    union all
    select 'hanzihome_grammar_points:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'grammarPoints', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_grammar_points row where row.id = value->>'id')
    union all
    select 'hanzihome_grammar_examples:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'grammarExamples', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_grammar_examples row where row.id = value->>'id')
    union all
    select 'hanzihome_grammar_detail_sections:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'grammarDetailSections', '[]'::jsonb)) value
    where exists (select 1 from public.hanzihome_grammar_detail_sections row where row.id = value->>'id')
  ) collisions
  limit 1;

  if v_collision is not null then
    raise exception using errcode = '23505', message = 'Seed ID already exists: ' || v_collision;
  end if;

  insert into public.hanzihome_courses
    (id, user_id, slug, title, subtitle, type, course_order, source, imported_at)
  select id, user_id, slug, title, subtitle, type, course_order, source, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'courses', '[]'::jsonb)) as row(
    id text, user_id uuid, slug text, title text, subtitle text, type text,
    course_order integer, source text, imported_at timestamptz
  );

  insert into public.hanzihome_course_books
    (id, user_id, course_id, title, short_title, book_order, source, imported_at)
  select id, user_id, course_id, title, short_title, book_order, source, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'books', '[]'::jsonb)) as row(
    id text, user_id uuid, course_id text, title text, short_title text,
    book_order integer, source text, imported_at timestamptz
  );

  insert into public.hanzihome_lessons
    (id, course_id, book_id, owner_id, source, lesson_number, lesson_order,
     title_zh, title_vi, source_file, imported_at, title_pinyin, title_en, tags)
  select id, course_id, book_id, owner_id, source, lesson_number, lesson_order,
    title_zh, title_vi, source_file, imported_at, title_pinyin, title_en, tags
  from jsonb_to_recordset(coalesce(p_seed->'lessons', '[]'::jsonb)) as row(
    id text, course_id text, book_id text, owner_id uuid, source text,
    lesson_number integer, lesson_order integer, title_zh text, title_vi text,
    source_file text, imported_at timestamptz, title_pinyin text, title_en text, tags text[]
  );

  insert into public.hanzihome_lesson_sections
    (id, lesson_id, owner_id, source, source_section_id, section_key, section_type,
     title, title_vi, section_order, payload, source_file, imported_at)
  select id, lesson_id, owner_id, source, source_section_id, section_key, section_type,
    title, title_vi, section_order, payload, source_file, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'lessonSections', '[]'::jsonb)) as row(
    id uuid, lesson_id text, owner_id uuid, source text, source_section_id text,
    section_key text, section_type text, title text, title_vi text,
    section_order integer, payload jsonb, source_file text, imported_at timestamptz
  );

  insert into public.hanzihome_lesson_texts
    (id, lesson_id, owner_id, source, text_key, title, content, content_format, imported_at)
  select id, lesson_id, owner_id, source, text_key, title, content, content_format, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'lessonTexts', '[]'::jsonb)) as row(
    id text, lesson_id text, owner_id uuid, source text, text_key text, title text,
    content text, content_format text, imported_at timestamptz
  );

  insert into public.hanzihome_vocab_items
    (id, lesson_id, course_id, book_id, owner_id, source, item_order, word, pinyin,
     han_viet, meaning, category, level, pos_vi, pos_zh, tone, source_file,
     imported_at, meaning_en, tags)
  select id, lesson_id, course_id, book_id, owner_id, source, item_order, word, pinyin,
    han_viet, meaning, category, level, pos_vi, pos_zh, tone, source_file,
    imported_at, meaning_en, tags
  from jsonb_to_recordset(coalesce(p_seed->'vocabItems', '[]'::jsonb)) as row(
    id text, lesson_id text, course_id text, book_id text, owner_id uuid, source text,
    item_order integer, word text, pinyin text, han_viet text, meaning text,
    category text, level text, pos_vi text, pos_zh text, tone text, source_file text,
    imported_at timestamptz, meaning_en text, tags text[]
  );

  insert into public.hanzihome_vocab_examples
    (id, vocab_item_id, lesson_id, owner_id, source, example_order, zh, pinyin, vi, note, imported_at)
  select id, vocab_item_id, lesson_id, owner_id, source, example_order, zh, pinyin, vi, note, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'vocabExamples', '[]'::jsonb)) as row(
    id text, vocab_item_id text, lesson_id text, owner_id uuid, source text,
    example_order integer, zh text, pinyin text, vi text, note text, imported_at timestamptz
  );

  insert into public.hanzihome_vocab_detail_sections
    (id, vocab_item_id, lesson_id, owner_id, source, section_key, title, lines, section_order, imported_at)
  select id, vocab_item_id, lesson_id, owner_id, source, section_key, title, lines, section_order, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'vocabDetailSections', '[]'::jsonb)) as row(
    id text, vocab_item_id text, lesson_id text, owner_id uuid, source text,
    section_key text, title text, lines text[], section_order integer, imported_at timestamptz
  );

  insert into public.hanzihome_grammar_points
    (id, lesson_id, course_id, book_id, owner_id, source, point_order, title,
     clean_title, core, content_md, structures_view, notes, imported_at, title_vi, level, tags)
  select id, lesson_id, course_id, book_id, owner_id, source, point_order, title,
    clean_title, core, content_md, structures_view, notes, imported_at, title_vi, level, tags
  from jsonb_to_recordset(coalesce(p_seed->'grammarPoints', '[]'::jsonb)) as row(
    id text, lesson_id text, course_id text, book_id text, owner_id uuid, source text,
    point_order integer, title text, clean_title text, core text, content_md text,
    structures_view text[], notes text[], imported_at timestamptz, title_vi text, level text, tags text[]
  );

  insert into public.hanzihome_grammar_examples
    (id, grammar_point_id, lesson_id, owner_id, source, example_order, zh, pinyin, vi, note, imported_at)
  select id, grammar_point_id, lesson_id, owner_id, source, example_order, zh, pinyin, vi, note, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'grammarExamples', '[]'::jsonb)) as row(
    id text, grammar_point_id text, lesson_id text, owner_id uuid, source text,
    example_order integer, zh text, pinyin text, vi text, note text, imported_at timestamptz
  );

  insert into public.hanzihome_grammar_detail_sections
    (id, grammar_point_id, lesson_id, owner_id, source, section_key, title, lines, section_order, imported_at)
  select id, grammar_point_id, lesson_id, owner_id, source, section_key, title, lines, section_order, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'grammarDetailSections', '[]'::jsonb)) as row(
    id text, grammar_point_id text, lesson_id text, owner_id uuid, source text,
    section_key text, title text, lines text[], section_order integer, imported_at timestamptz
  );

  return jsonb_build_object(
    'courses', jsonb_array_length(coalesce(p_seed->'courses', '[]'::jsonb)),
    'books', jsonb_array_length(coalesce(p_seed->'books', '[]'::jsonb)),
    'lessons', jsonb_array_length(coalesce(p_seed->'lessons', '[]'::jsonb)),
    'lessonSections', jsonb_array_length(coalesce(p_seed->'lessonSections', '[]'::jsonb)),
    'lessonTexts', jsonb_array_length(coalesce(p_seed->'lessonTexts', '[]'::jsonb)),
    'vocabItems', jsonb_array_length(coalesce(p_seed->'vocabItems', '[]'::jsonb)),
    'vocabExamples', jsonb_array_length(coalesce(p_seed->'vocabExamples', '[]'::jsonb)),
    'vocabDetailSections', jsonb_array_length(coalesce(p_seed->'vocabDetailSections', '[]'::jsonb)),
    'grammarPoints', jsonb_array_length(coalesce(p_seed->'grammarPoints', '[]'::jsonb)),
    'grammarExamples', jsonb_array_length(coalesce(p_seed->'grammarExamples', '[]'::jsonb)),
    'grammarDetailSections', jsonb_array_length(coalesce(p_seed->'grammarDetailSections', '[]'::jsonb))
  );
end;
$$;


ALTER FUNCTION "public"."hanzihome_import_external_seed_package"("p_seed" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_learning_loop_touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."hanzihome_learning_loop_touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_list_vocab_children"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_deleted" boolean DEFAULT false, "p_section_keys" "text"[] DEFAULT NULL::"text"[], "p_query" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 25) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_actor uuid := auth.uid();
  v_offset integer;
  v_result jsonb;
begin
  if v_actor is null or not exists (
    select 1 from public.hanzihome_content_editors where user_id = v_actor
  ) then
    raise exception using errcode = '42501', message = 'HanziHome content editor access required';
  end if;
  if p_page < 1 or p_page_size < 1 or p_page_size > 100 then
    raise exception using errcode = '22023', message = 'Invalid vocabulary child page';
  end if;

  v_offset := (p_page - 1) * p_page_size;
  with candidates as materialized (
    select * from public.hanzihome_vocab_child_candidates(
      p_entity_type, p_scope_type, p_scope_id, p_deleted, p_section_keys, null, p_query
    )
  ), page_rows as (
    select id, vocab_item_id as "vocabItemId", lesson_id as "lessonId", word, label,
      section_key as "sectionKey", owner_id as "ownerId", source, deleted_at as "deletedAt"
    from candidates
    order by word, label, id
    offset v_offset limit p_page_size
  )
  select pg_catalog.jsonb_build_object(
    'page', p_page,
    'pageSize', p_page_size,
    'total', (select pg_catalog.count(*) from candidates),
    'rows', coalesce((select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(page_row)) from page_rows page_row), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;


ALTER FUNCTION "public"."hanzihome_list_vocab_children"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_deleted" boolean, "p_section_keys" "text"[], "p_query" "text", "p_page" integer, "p_page_size" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_mutate_content"("p_actor_id" "uuid", "p_operation" "text", "p_entity_type" "text", "p_entity_id" "text" DEFAULT NULL::"text", "p_expected_updated_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_changes" "jsonb" DEFAULT '{}'::"jsonb", "p_reason" "text" DEFAULT NULL::"text", "p_audit_operation" "text" DEFAULT NULL::"text", "p_audit_entity_type" "text" DEFAULT NULL::"text", "p_audit_entity_id" "text" DEFAULT NULL::"text", "p_audit_parent_entity_type" "text" DEFAULT NULL::"text", "p_audit_parent_entity_id" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
  select private.hanzihome_mutate_content(
    p_actor_id,
    p_operation,
    p_entity_type,
    p_entity_id,
    p_expected_updated_at,
    p_changes,
    p_reason,
    p_audit_operation,
    p_audit_entity_type,
    p_audit_entity_id,
    p_audit_parent_entity_type,
    p_audit_parent_entity_id
  );
$$;


ALTER FUNCTION "public"."hanzihome_mutate_content"("p_actor_id" "uuid", "p_operation" "text", "p_entity_type" "text", "p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text", "p_audit_operation" "text", "p_audit_entity_type" "text", "p_audit_entity_id" "text", "p_audit_parent_entity_type" "text", "p_audit_parent_entity_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hanzihome_mutate_content"("p_actor_id" "uuid", "p_operation" "text", "p_entity_type" "text", "p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text", "p_audit_operation" "text", "p_audit_entity_type" "text", "p_audit_entity_id" "text", "p_audit_parent_entity_type" "text", "p_audit_parent_entity_id" "text") IS 'Service-role RPC wrapper for the private HanziHome canonical CRUD transaction.';



CREATE OR REPLACE FUNCTION "public"."hanzihome_mutate_content_as_user"("p_operation" "text", "p_entity_type" "text", "p_entity_id" "text" DEFAULT NULL::"text", "p_expected_updated_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_changes" "jsonb" DEFAULT '{}'::"jsonb", "p_reason" "text" DEFAULT NULL::"text", "p_audit_operation" "text" DEFAULT NULL::"text", "p_audit_entity_type" "text" DEFAULT NULL::"text", "p_audit_entity_id" "text" DEFAULT NULL::"text", "p_audit_parent_entity_type" "text" DEFAULT NULL::"text", "p_audit_parent_entity_id" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_actor_id uuid := (select auth.uid());
begin
  if v_actor_id is null then
    raise exception using errcode = '28000', message = 'Authenticated actor is required';
  end if;

  if not (select public.can_edit_hanzihome_content()) then
    raise exception using errcode = '42501', message = 'HanziHome editor role is required';
  end if;

  return private.hanzihome_mutate_content(
    v_actor_id,
    p_operation,
    p_entity_type,
    p_entity_id,
    p_expected_updated_at,
    p_changes,
    p_reason,
    p_audit_operation,
    p_audit_entity_type,
    p_audit_entity_id,
    p_audit_parent_entity_type,
    p_audit_parent_entity_id
  );
end;
$$;


ALTER FUNCTION "public"."hanzihome_mutate_content_as_user"("p_operation" "text", "p_entity_type" "text", "p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text", "p_audit_operation" "text", "p_audit_entity_type" "text", "p_audit_entity_id" "text", "p_audit_parent_entity_type" "text", "p_audit_parent_entity_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hanzihome_mutate_content_as_user"("p_operation" "text", "p_entity_type" "text", "p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text", "p_audit_operation" "text", "p_audit_entity_type" "text", "p_audit_entity_id" "text", "p_audit_parent_entity_type" "text", "p_audit_parent_entity_id" "text") IS 'Session-authenticated HanziHome CRUD boundary. Resolves auth.uid(), requires an editor/admin role, and delegates to the atomic mutation and audit transaction.';



CREATE OR REPLACE FUNCTION "public"."hanzihome_mutate_vocab_child_bulk"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_operation" "text", "p_expected_count" bigint, "p_expected_fingerprint" "text", "p_reason" "text", "p_section_keys" "text"[] DEFAULT NULL::"text"[], "p_ids" "text"[] DEFAULT NULL::"text"[], "p_query" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_actor uuid := auth.uid();
  v_deleted boolean := p_operation in ('restore', 'purge');
  v_target_ids text[] := array[]::text[];
  v_actual_count bigint;
  v_actual_fingerprint text;
  v_has_forbidden_personal boolean;
  v_changed bigint;
begin
  if v_actor is null or not exists (
    select 1 from public.hanzihome_content_editors where user_id = v_actor
  ) then
    raise exception using errcode = '42501', message = 'HanziHome content editor access required';
  end if;
  if p_operation not in ('soft_delete', 'restore', 'purge') then
    raise exception using errcode = '22023', message = 'Unsupported vocabulary bulk operation';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception using errcode = '22023', message = 'A reason is required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hanzihome-vocab-bulk:' || p_entity_type || ':' || p_scope_type || ':' || p_scope_id, 0));

  select
    coalesce(array_agg(candidate.id order by candidate.id), array[]::text[]),
    count(*),
    md5(coalesce(string_agg(candidate.id || ':' || candidate.updated_at::text || ':' || coalesce(candidate.deleted_at::text, ''), '|' order by candidate.id), '')),
    coalesce(bool_or(
      candidate.owner_id is not null
      and not (p_scope_type = 'lesson' and p_ids is not null and candidate.owner_id = v_actor)
    ), false)
  into v_target_ids, v_actual_count, v_actual_fingerprint, v_has_forbidden_personal
  from public.hanzihome_vocab_child_candidates(
    p_entity_type, p_scope_type, p_scope_id, v_deleted, p_section_keys, p_ids, p_query
  ) candidate;

  if v_actual_count <> p_expected_count or v_actual_fingerprint is distinct from p_expected_fingerprint then
    raise exception using errcode = '40001', message = 'Vocabulary bulk selection changed after preview';
  end if;
  if v_has_forbidden_personal then
    raise exception using errcode = '42501', message = 'Personal vocabulary rows require explicit IDs in the current lesson';
  end if;

  if p_entity_type = 'vocab_detail_section' then
    if p_operation = 'soft_delete' then
      update public.hanzihome_vocab_detail_sections
      set deleted_at = now(), deleted_by = v_actor, updated_at = now()
      where id = any(v_target_ids);
    elsif p_operation = 'restore' then
      update public.hanzihome_vocab_detail_sections
      set deleted_at = null, deleted_by = null, updated_at = now()
      where id = any(v_target_ids) and deleted_at is not null;
    else
      delete from public.hanzihome_vocab_detail_sections
      where id = any(v_target_ids) and deleted_at is not null;
    end if;
  else
    if p_operation = 'soft_delete' then
      update public.hanzihome_vocab_examples
      set deleted_at = now(), deleted_by = v_actor, updated_at = now()
      where id = any(v_target_ids);
    elsif p_operation = 'restore' then
      update public.hanzihome_vocab_examples
      set deleted_at = null, deleted_by = null, updated_at = now()
      where id = any(v_target_ids) and deleted_at is not null;
    else
      delete from public.hanzihome_vocab_examples
      where id = any(v_target_ids) and deleted_at is not null;
    end if;
  end if;

  get diagnostics v_changed = row_count;
  if v_changed <> p_expected_count then
    raise exception using errcode = '40001', message = 'Vocabulary bulk mutation count changed';
  end if;

  insert into public.hanzihome_content_audit_log (
    actor_id, operation, entity_type, entity_id, parent_entity_type, parent_entity_id, before_data, after_data, reason
  ) values (
    v_actor,
    case when p_operation = 'restore' then 'restore' else 'delete' end,
    p_entity_type || '_bulk',
    p_scope_type || ':' || p_scope_id,
    p_scope_type,
    p_scope_id,
    jsonb_build_object('count', p_expected_count, 'fingerprint', p_expected_fingerprint, 'filter', jsonb_build_object('sectionKeys', p_section_keys, 'ids', p_ids, 'query', p_query)),
    jsonb_build_object('operation', p_operation, 'count', v_changed),
    trim(p_reason)
  );

  return jsonb_build_object('operation', p_operation, 'changedCount', v_changed);
end;
$$;


ALTER FUNCTION "public"."hanzihome_mutate_vocab_child_bulk"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_operation" "text", "p_expected_count" bigint, "p_expected_fingerprint" "text", "p_reason" "text", "p_section_keys" "text"[], "p_ids" "text"[], "p_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_preview_vocab_child_bulk"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_deleted" boolean DEFAULT false, "p_section_keys" "text"[] DEFAULT NULL::"text"[], "p_ids" "text"[] DEFAULT NULL::"text"[], "p_query" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_actor uuid := auth.uid();
  v_result jsonb;
begin
  if v_actor is null or not exists (
    select 1 from public.hanzihome_content_editors where user_id = v_actor
  ) then
    raise exception using errcode = '42501', message = 'HanziHome content editor access required';
  end if;

  with candidates as (
    select * from public.hanzihome_vocab_child_candidates(
      p_entity_type, p_scope_type, p_scope_id, p_deleted, p_section_keys, p_ids, p_query
    )
  ), summary as (
    select count(*)::bigint as row_count,
      count(distinct vocab_item_id)::bigint as word_count,
      md5(coalesce(string_agg(id || ':' || updated_at::text || ':' || coalesce(deleted_at::text, ''), '|' order by id), '')) as fingerprint
    from candidates
  )
  select jsonb_build_object(
    'entityType', p_entity_type,
    'scopeType', p_scope_type,
    'scopeId', p_scope_id,
    'deleted', p_deleted,
    'rowCount', summary.row_count,
    'wordCount', summary.word_count,
    'fingerprint', summary.fingerprint,
    'ownership', coalesce((select jsonb_object_agg(key, value) from (
      select case when owner_id is null then 'shared' else 'personal' end as key, count(*) as value
      from candidates group by 1
    ) ownership_rows), '{}'::jsonb),
    'breakdown', coalesce((select jsonb_object_agg(key, value) from (
      select coalesce(section_key, 'example') as key, count(*) as value
      from candidates group by 1
    ) breakdown_rows), '{}'::jsonb),
    'sample', coalesce((select jsonb_agg(sample_row) from (
      select id, vocab_item_id as "vocabItemId", lesson_id as "lessonId", label, section_key as "sectionKey", source
      from candidates order by id limit 12
    ) sample_row), '[]'::jsonb)
  ) into v_result
  from summary;

  return v_result;
end;
$$;


ALTER FUNCTION "public"."hanzihome_preview_vocab_child_bulk"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_deleted" boolean, "p_section_keys" "text"[], "p_ids" "text"[], "p_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_purge_deleted_content_as_user"("p_entity_type" "text", "p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_reason" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
declare
  v_actor_id uuid := (select auth.uid());
  v_table_name text;
  v_parent_entity_type text;
  v_parent_entity_id text;
  v_before jsonb;
  v_deleted jsonb;
  v_current_updated_at timestamptz;
begin
  if v_actor_id is null then
    raise exception using errcode = '28000', message = 'Authenticated actor is required';
  end if;

  if not (select public.can_edit_hanzihome_content()) then
    raise exception using errcode = '42501', message = 'HanziHome editor role is required';
  end if;

  if p_entity_id is null or length(trim(p_entity_id)) = 0 then
    raise exception using errcode = '22023', message = 'Entity id is required';
  end if;

  if p_expected_updated_at is null then
    raise exception using errcode = '22023', message = 'Expected updated_at is required';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception using errcode = '22023', message = 'Purge reason is required';
  end if;

  case p_entity_type
    when 'course' then
      v_table_name := 'hanzihome_courses';
    when 'book' then
      v_table_name := 'hanzihome_course_books';
      v_parent_entity_type := 'course';
    when 'lesson' then
      v_table_name := 'hanzihome_lessons';
      v_parent_entity_type := 'book';
    else
      raise exception using errcode = '22023', message = 'Only deleted courses, books, and lessons can be purged';
  end case;

  execute format(
    'select to_jsonb(target), target.updated_at from public.%I target where target.id::text = $1 for update',
    v_table_name
  )
  using p_entity_id
  into v_before, v_current_updated_at;

  if v_before is null then
    raise exception using errcode = 'P0002', message = 'HanziHome entity not found';
  end if;

  if v_before ->> 'deleted_at' is null then
    raise exception using errcode = '22023', message = 'Only soft-deleted content can be purged';
  end if;

  if v_current_updated_at <> p_expected_updated_at then
    raise exception using errcode = '40001', message = 'HanziHome entity changed since it was loaded';
  end if;

  v_parent_entity_id := case p_entity_type
    when 'book' then v_before ->> 'course_id'
    when 'lesson' then v_before ->> 'book_id'
    else null
  end;

  execute format(
    'delete from public.%I where id::text = $1 and deleted_at is not null returning to_jsonb(%I.*)',
    v_table_name,
    v_table_name
  )
  using p_entity_id
  into v_deleted;

  if v_deleted is null then
    raise exception using errcode = '40001', message = 'HanziHome entity changed before it could be purged';
  end if;

  insert into public.hanzihome_content_audit_log (
    actor_id,
    operation,
    entity_type,
    entity_id,
    parent_entity_type,
    parent_entity_id,
    before_data,
    after_data,
    reason
  ) values (
    v_actor_id,
    'delete',
    p_entity_type,
    p_entity_id,
    v_parent_entity_type,
    v_parent_entity_id,
    v_before,
    null,
    'Xóa vĩnh viễn: ' || trim(p_reason)
  );

  return jsonb_build_object(
    'purged', jsonb_build_object(
      'entityType', p_entity_type,
      'entityId', p_entity_id
    )
  );
end;
$_$;


ALTER FUNCTION "public"."hanzihome_purge_deleted_content_as_user"("p_entity_type" "text", "p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hanzihome_purge_deleted_content_as_user"("p_entity_type" "text", "p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_reason" "text") IS 'Permanently deletes one soft-deleted HanziHome course, book, or lesson. Parent foreign keys cascade its canonical subtree. Requires editor/admin role and optimistic concurrency.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_learning_loop_items" (
    "user_id" "uuid" NOT NULL,
    "id" "text" NOT NULL,
    "stable_key" "text" NOT NULL,
    "kind" "text" NOT NULL,
    "source_id" "text" NOT NULL,
    "source_href" "text" NOT NULL,
    "title_zh" "text" DEFAULT ''::"text" NOT NULL,
    "title_vi" "text" DEFAULT ''::"text" NOT NULL,
    "prompt_zh" "text" NOT NULL,
    "pinyin" "text" DEFAULT ''::"text" NOT NULL,
    "meaning_vi" "text" DEFAULT ''::"text" NOT NULL,
    "user_answer" "text" DEFAULT ''::"text" NOT NULL,
    "error_key" "text" DEFAULT ''::"text" NOT NULL,
    "state" "text" NOT NULL,
    "due_at" timestamp with time zone NOT NULL,
    "interval_days" integer DEFAULT 0 NOT NULL,
    "correct_streak" integer DEFAULT 0 NOT NULL,
    "lapse_count" integer DEFAULT 0 NOT NULL,
    "revision" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hanzihome_learning_loop_items_correct_streak_check" CHECK (("correct_streak" >= 0)),
    CONSTRAINT "hanzihome_learning_loop_items_interval_days_check" CHECK (("interval_days" >= 0)),
    CONSTRAINT "hanzihome_learning_loop_items_lapse_count_check" CHECK (("lapse_count" >= 0)),
    CONSTRAINT "hanzihome_learning_loop_items_revision_check" CHECK (("revision" >= 0)),
    CONSTRAINT "hanzihome_learning_loop_items_state_check" CHECK (("state" = ANY (ARRAY['new'::"text", 'learning'::"text", 'stable'::"text"])))
);


ALTER TABLE "public"."hanzihome_learning_loop_items" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_rate_learning_loop_item"("p_item_id" "text", "p_rating" "text", "p_expected_revision" integer) RETURNS "public"."hanzihome_learning_loop_items"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."hanzihome_rate_learning_loop_item"("p_item_id" "text", "p_rating" "text", "p_expected_revision" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_rate_learning_loop_item_as_server"("p_user_id" "uuid", "p_item_id" "text", "p_rating" "text", "p_expected_revision" integer) RETURNS "public"."hanzihome_learning_loop_items"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_rate_learning_loop_item(p_item_id, p_rating, p_expected_revision);
end;
$$;


ALTER FUNCTION "public"."hanzihome_rate_learning_loop_item_as_server"("p_user_id" "uuid", "p_item_id" "text", "p_rating" "text", "p_expected_revision" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_refresh_external_seed_package"("p_seed" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_unsafe_row text;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;

  if jsonb_typeof(p_seed) <> 'object' then
    raise exception using errcode = '22023', message = 'Seed package must be a JSON object';
  end if;

  select collection || ':' || coalesce(value->>'id', '<missing>')
  into v_unsafe_row
  from (
    select 'courses' collection, value from jsonb_array_elements(coalesce(p_seed->'courses', '[]'::jsonb)) value
    union all select 'books', value from jsonb_array_elements(coalesce(p_seed->'books', '[]'::jsonb)) value
    union all select 'lessons', value from jsonb_array_elements(coalesce(p_seed->'lessons', '[]'::jsonb)) value
    union all select 'lessonSections', value from jsonb_array_elements(coalesce(p_seed->'lessonSections', '[]'::jsonb)) value
    union all select 'lessonTexts', value from jsonb_array_elements(coalesce(p_seed->'lessonTexts', '[]'::jsonb)) value
    union all select 'vocabItems', value from jsonb_array_elements(coalesce(p_seed->'vocabItems', '[]'::jsonb)) value
    union all select 'vocabExamples', value from jsonb_array_elements(coalesce(p_seed->'vocabExamples', '[]'::jsonb)) value
    union all select 'vocabDetailSections', value from jsonb_array_elements(coalesce(p_seed->'vocabDetailSections', '[]'::jsonb)) value
    union all select 'grammarPoints', value from jsonb_array_elements(coalesce(p_seed->'grammarPoints', '[]'::jsonb)) value
    union all select 'grammarExamples', value from jsonb_array_elements(coalesce(p_seed->'grammarExamples', '[]'::jsonb)) value
    union all select 'grammarDetailSections', value from jsonb_array_elements(coalesce(p_seed->'grammarDetailSections', '[]'::jsonb)) value
  ) package_rows
  where value->>'source' is distinct from 'seed'
  limit 1;

  if v_unsafe_row is not null then
    raise exception using errcode = '22023', message = 'Refresh accepts seed rows only: ' || v_unsafe_row;
  end if;

  select collision into v_unsafe_row
  from (
    select 'hanzihome_courses:' || (value->>'id') as collision
    from jsonb_array_elements(coalesce(p_seed->'courses', '[]'::jsonb)) value
    join public.hanzihome_courses row on row.id = value->>'id'
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_course_books:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'books', '[]'::jsonb)) value
    join public.hanzihome_course_books row on row.id = value->>'id'
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_lessons:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'lessons', '[]'::jsonb)) value
    join public.hanzihome_lessons row on row.id = value->>'id'
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_lesson_sections:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'lessonSections', '[]'::jsonb)) value
    join public.hanzihome_lesson_sections row on row.id = (value->>'id')::uuid
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_lesson_texts:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'lessonTexts', '[]'::jsonb)) value
    join public.hanzihome_lesson_texts row on row.id = value->>'id'
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_vocab_items:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'vocabItems', '[]'::jsonb)) value
    join public.hanzihome_vocab_items row on row.id = value->>'id'
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_vocab_examples:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'vocabExamples', '[]'::jsonb)) value
    join public.hanzihome_vocab_examples row on row.id = value->>'id'
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_vocab_detail_sections:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'vocabDetailSections', '[]'::jsonb)) value
    join public.hanzihome_vocab_detail_sections row on row.id = value->>'id'
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_grammar_points:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'grammarPoints', '[]'::jsonb)) value
    join public.hanzihome_grammar_points row on row.id = value->>'id'
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_grammar_examples:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'grammarExamples', '[]'::jsonb)) value
    join public.hanzihome_grammar_examples row on row.id = value->>'id'
    where row.source is distinct from 'seed'
    union all
    select 'hanzihome_grammar_detail_sections:' || (value->>'id')
    from jsonb_array_elements(coalesce(p_seed->'grammarDetailSections', '[]'::jsonb)) value
    join public.hanzihome_grammar_detail_sections row on row.id = value->>'id'
    where row.source is distinct from 'seed'
  ) unsafe_collisions
  limit 1;

  if v_unsafe_row is not null then
    raise exception using errcode = '23505', message = 'Cannot replace non-seed row: ' || v_unsafe_row;
  end if;

  insert into public.hanzihome_courses
    (id, user_id, slug, title, subtitle, type, course_order, source, imported_at)
  select id, user_id, slug, title, subtitle, type, course_order, source, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'courses', '[]'::jsonb)) as row(
    id text, user_id uuid, slug text, title text, subtitle text, type text,
    course_order integer, source text, imported_at timestamptz
  )
  on conflict (id) do update set
    slug = excluded.slug, title = excluded.title, subtitle = excluded.subtitle,
    type = excluded.type, course_order = excluded.course_order, imported_at = excluded.imported_at;

  insert into public.hanzihome_course_books
    (id, user_id, course_id, title, short_title, book_order, source, imported_at)
  select id, user_id, course_id, title, short_title, book_order, source, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'books', '[]'::jsonb)) as row(
    id text, user_id uuid, course_id text, title text, short_title text,
    book_order integer, source text, imported_at timestamptz
  )
  on conflict (id) do update set
    course_id = excluded.course_id, title = excluded.title, short_title = excluded.short_title,
    book_order = excluded.book_order, imported_at = excluded.imported_at;

  insert into public.hanzihome_lessons
    (id, course_id, book_id, owner_id, source, lesson_number, lesson_order,
     title_zh, title_vi, source_file, imported_at, title_pinyin, title_en, tags)
  select id, course_id, book_id, owner_id, source, lesson_number, lesson_order,
    title_zh, title_vi, source_file, imported_at, title_pinyin, title_en, tags
  from jsonb_to_recordset(coalesce(p_seed->'lessons', '[]'::jsonb)) as row(
    id text, course_id text, book_id text, owner_id uuid, source text,
    lesson_number integer, lesson_order integer, title_zh text, title_vi text,
    source_file text, imported_at timestamptz, title_pinyin text, title_en text, tags text[]
  )
  on conflict (id) do update set
    course_id = excluded.course_id, book_id = excluded.book_id,
    lesson_number = excluded.lesson_number, lesson_order = excluded.lesson_order,
    title_zh = excluded.title_zh, title_vi = excluded.title_vi,
    source_file = excluded.source_file, imported_at = excluded.imported_at,
    title_pinyin = excluded.title_pinyin, title_en = excluded.title_en, tags = excluded.tags;

  insert into public.hanzihome_lesson_sections
    (id, lesson_id, owner_id, source, source_section_id, section_key, section_type,
     title, title_vi, section_order, payload, source_file, imported_at)
  select id, lesson_id, owner_id, source, source_section_id, section_key, section_type,
    title, title_vi, section_order, payload, source_file, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'lessonSections', '[]'::jsonb)) as row(
    id uuid, lesson_id text, owner_id uuid, source text, source_section_id text,
    section_key text, section_type text, title text, title_vi text,
    section_order integer, payload jsonb, source_file text, imported_at timestamptz
  )
  on conflict (id) do update set
    lesson_id = excluded.lesson_id, source_section_id = excluded.source_section_id,
    section_key = excluded.section_key, section_type = excluded.section_type,
    title = excluded.title, title_vi = excluded.title_vi,
    section_order = excluded.section_order, payload = excluded.payload,
    source_file = excluded.source_file, imported_at = excluded.imported_at;

  insert into public.hanzihome_lesson_texts
    (id, lesson_id, owner_id, source, text_key, title, content, content_format, imported_at)
  select id, lesson_id, owner_id, source, text_key, title, content, content_format, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'lessonTexts', '[]'::jsonb)) as row(
    id text, lesson_id text, owner_id uuid, source text, text_key text, title text,
    content text, content_format text, imported_at timestamptz
  )
  on conflict (id) do update set
    lesson_id = excluded.lesson_id, text_key = excluded.text_key, title = excluded.title,
    content = excluded.content, content_format = excluded.content_format,
    imported_at = excluded.imported_at;

  insert into public.hanzihome_vocab_items
    (id, lesson_id, course_id, book_id, owner_id, source, item_order, word, pinyin,
     han_viet, meaning, category, level, pos_vi, pos_zh, tone, source_file,
     imported_at, meaning_en, tags)
  select id, lesson_id, course_id, book_id, owner_id, source, item_order, word, pinyin,
    han_viet, meaning, category, level, pos_vi, pos_zh, tone, source_file,
    imported_at, meaning_en, tags
  from jsonb_to_recordset(coalesce(p_seed->'vocabItems', '[]'::jsonb)) as row(
    id text, lesson_id text, course_id text, book_id text, owner_id uuid, source text,
    item_order integer, word text, pinyin text, han_viet text, meaning text,
    category text, level text, pos_vi text, pos_zh text, tone text, source_file text,
    imported_at timestamptz, meaning_en text, tags text[]
  )
  on conflict (id) do update set
    lesson_id = excluded.lesson_id, course_id = excluded.course_id, book_id = excluded.book_id,
    item_order = excluded.item_order, word = excluded.word, pinyin = excluded.pinyin,
    han_viet = excluded.han_viet, meaning = excluded.meaning, category = excluded.category,
    level = excluded.level, pos_vi = excluded.pos_vi, pos_zh = excluded.pos_zh,
    tone = excluded.tone, source_file = excluded.source_file,
    imported_at = excluded.imported_at, meaning_en = excluded.meaning_en, tags = excluded.tags;

  insert into public.hanzihome_vocab_examples
    (id, vocab_item_id, lesson_id, owner_id, source, example_order, zh, pinyin, vi, note, imported_at)
  select id, vocab_item_id, lesson_id, owner_id, source, example_order, zh, pinyin, vi, note, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'vocabExamples', '[]'::jsonb)) as row(
    id text, vocab_item_id text, lesson_id text, owner_id uuid, source text,
    example_order integer, zh text, pinyin text, vi text, note text, imported_at timestamptz
  )
  on conflict (id) do update set
    vocab_item_id = excluded.vocab_item_id, lesson_id = excluded.lesson_id,
    example_order = excluded.example_order, zh = excluded.zh, pinyin = excluded.pinyin,
    vi = excluded.vi, note = excluded.note, imported_at = excluded.imported_at;

  insert into public.hanzihome_vocab_detail_sections
    (id, vocab_item_id, lesson_id, owner_id, source, section_key, title, lines, section_order, imported_at)
  select id, vocab_item_id, lesson_id, owner_id, source, section_key, title, lines, section_order, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'vocabDetailSections', '[]'::jsonb)) as row(
    id text, vocab_item_id text, lesson_id text, owner_id uuid, source text,
    section_key text, title text, lines text[], section_order integer, imported_at timestamptz
  )
  on conflict (id) do update set
    vocab_item_id = excluded.vocab_item_id, lesson_id = excluded.lesson_id,
    section_key = excluded.section_key, title = excluded.title, lines = excluded.lines,
    section_order = excluded.section_order, imported_at = excluded.imported_at;

  insert into public.hanzihome_grammar_points
    (id, lesson_id, course_id, book_id, owner_id, source, point_order, title,
     clean_title, core, content_md, structures_view, notes, imported_at, title_vi, level, tags)
  select id, lesson_id, course_id, book_id, owner_id, source, point_order, title,
    clean_title, core, content_md, structures_view, notes, imported_at, title_vi, level, tags
  from jsonb_to_recordset(coalesce(p_seed->'grammarPoints', '[]'::jsonb)) as row(
    id text, lesson_id text, course_id text, book_id text, owner_id uuid, source text,
    point_order integer, title text, clean_title text, core text, content_md text,
    structures_view text[], notes text[], imported_at timestamptz, title_vi text, level text, tags text[]
  )
  on conflict (id) do update set
    lesson_id = excluded.lesson_id, course_id = excluded.course_id, book_id = excluded.book_id,
    point_order = excluded.point_order, title = excluded.title, clean_title = excluded.clean_title,
    core = excluded.core, content_md = excluded.content_md,
    structures_view = excluded.structures_view, notes = excluded.notes,
    imported_at = excluded.imported_at, title_vi = excluded.title_vi,
    level = excluded.level, tags = excluded.tags;

  insert into public.hanzihome_grammar_examples
    (id, grammar_point_id, lesson_id, owner_id, source, example_order, zh, pinyin, vi, note, imported_at)
  select id, grammar_point_id, lesson_id, owner_id, source, example_order, zh, pinyin, vi, note, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'grammarExamples', '[]'::jsonb)) as row(
    id text, grammar_point_id text, lesson_id text, owner_id uuid, source text,
    example_order integer, zh text, pinyin text, vi text, note text, imported_at timestamptz
  )
  on conflict (id) do update set
    grammar_point_id = excluded.grammar_point_id, lesson_id = excluded.lesson_id,
    example_order = excluded.example_order, zh = excluded.zh, pinyin = excluded.pinyin,
    vi = excluded.vi, note = excluded.note, imported_at = excluded.imported_at;

  insert into public.hanzihome_grammar_detail_sections
    (id, grammar_point_id, lesson_id, owner_id, source, section_key, title, lines, section_order, imported_at)
  select id, grammar_point_id, lesson_id, owner_id, source, section_key, title, lines, section_order, imported_at
  from jsonb_to_recordset(coalesce(p_seed->'grammarDetailSections', '[]'::jsonb)) as row(
    id text, grammar_point_id text, lesson_id text, owner_id uuid, source text,
    section_key text, title text, lines text[], section_order integer, imported_at timestamptz
  )
  on conflict (id) do update set
    grammar_point_id = excluded.grammar_point_id, lesson_id = excluded.lesson_id,
    section_key = excluded.section_key, title = excluded.title, lines = excluded.lines,
    section_order = excluded.section_order, imported_at = excluded.imported_at;

  return jsonb_build_object(
    'courses', jsonb_array_length(coalesce(p_seed->'courses', '[]'::jsonb)),
    'books', jsonb_array_length(coalesce(p_seed->'books', '[]'::jsonb)),
    'lessons', jsonb_array_length(coalesce(p_seed->'lessons', '[]'::jsonb)),
    'lessonSections', jsonb_array_length(coalesce(p_seed->'lessonSections', '[]'::jsonb)),
    'lessonTexts', jsonb_array_length(coalesce(p_seed->'lessonTexts', '[]'::jsonb)),
    'vocabItems', jsonb_array_length(coalesce(p_seed->'vocabItems', '[]'::jsonb)),
    'vocabExamples', jsonb_array_length(coalesce(p_seed->'vocabExamples', '[]'::jsonb)),
    'vocabDetailSections', jsonb_array_length(coalesce(p_seed->'vocabDetailSections', '[]'::jsonb)),
    'grammarPoints', jsonb_array_length(coalesce(p_seed->'grammarPoints', '[]'::jsonb)),
    'grammarExamples', jsonb_array_length(coalesce(p_seed->'grammarExamples', '[]'::jsonb)),
    'grammarDetailSections', jsonb_array_length(coalesce(p_seed->'grammarDetailSections', '[]'::jsonb))
  );
end;
$$;


ALTER FUNCTION "public"."hanzihome_refresh_external_seed_package"("p_seed" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_studio_touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."hanzihome_studio_touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."hanzihome_touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_tts_clip_folder_owner_check"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  if new.folder_id is not null and not exists (
    select 1
    from public.hanzihome_tts_folders folder
    where folder.id = new.folder_id
      and folder.user_id = new.user_id
  ) then
    raise exception 'TTS clip folder does not belong to the clip owner';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."hanzihome_tts_clip_folder_owner_check"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_update_lesson_text_annotation_note_as_server"("p_user_id" "uuid", "p_annotation_id" "uuid", "p_note_text" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  target_annotation public.lesson_text_annotations%rowtype;
  target_note_id uuid;
  normalized_note text := nullif(btrim(p_note_text), '');
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role is required';
  end if;

  if p_user_id is null then
    raise exception 'User is required';
  end if;

  if normalized_note is null then
    raise exception 'Note text is required';
  end if;

  select * into target_annotation
  from public.lesson_text_annotations
  where id = p_annotation_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'Annotation not found';
  end if;

  if target_annotation.note_id is null then
    insert into public.notes (user_id, title, tags, category, content)
    values (
      p_user_id,
      left('Ghi chú: ' || target_annotation.selected_text, 120),
      array['annotation'],
      'general',
      jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(
          jsonb_build_object(
            'type', 'paragraph',
            'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', normalized_note))
          )
        )
      )
    )
    returning id into target_note_id;

    insert into public.lesson_note_links (
      user_id,
      note_id,
      target_type,
      target_key,
      relation_type
    )
    values (
      p_user_id,
      target_note_id,
      'hanzihome_lesson',
      target_annotation.lesson_id,
      'annotation'
    );

    update public.lesson_text_annotations
    set note_id = target_note_id, updated_at = now()
    where id = target_annotation.id;
  else
    target_note_id := target_annotation.note_id;
    update public.notes
    set
      content = jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(
          jsonb_build_object(
            'type', 'paragraph',
            'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', normalized_note))
          )
        )
      ),
      updated_at = now()
    where id = target_note_id and user_id = p_user_id;
  end if;

  return target_note_id;
end;
$$;


ALTER FUNCTION "public"."hanzihome_update_lesson_text_annotation_note_as_server"("p_user_id" "uuid", "p_annotation_id" "uuid", "p_note_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_update_listening_item_as_user"("p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_actor_id uuid := (select auth.uid());
  v_before jsonb;
  v_after jsonb;
  v_invalid_keys text[];
begin
  if v_actor_id is null then
    raise exception using errcode = '28000', message = 'Authenticated actor is required';
  end if;

  if not (select public.can_edit_hanzihome_content()) then
    raise exception using errcode = '42501', message = 'HanziHome editor role is required';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception using errcode = '22023', message = 'Mutation reason is required';
  end if;

  if p_expected_updated_at is null then
    raise exception using errcode = '22023', message = 'expectedUpdatedAt is required';
  end if;

  if jsonb_typeof(coalesce(p_changes, '{}'::jsonb)) <> 'object'
     or p_changes = '{}'::jsonb then
    raise exception using errcode = '22023', message = 'Listening item changes must be a non-empty object';
  end if;

  select array_agg(change_key)
  into v_invalid_keys
  from jsonb_object_keys(p_changes) as change_key
  where not (change_key = any(array[
    'prompt_zh',
    'transcript',
    'options',
    'answer',
    'explanation_vi',
    'metadata'
  ]));

  if coalesce(array_length(v_invalid_keys, 1), 0) > 0 then
    raise exception using
      errcode = '22023',
      message = format('Unsupported listening item fields: %s', array_to_string(v_invalid_keys, ', '));
  end if;

  select to_jsonb(item)
  into v_before
  from public.hanzihome_listening_items item
  where item.id = p_entity_id
    and item.deleted_at is null
  for update;

  if v_before is null then
    raise exception using errcode = 'P0002', message = 'Listening item not found';
  end if;

  if (v_before ->> 'updated_at')::timestamptz is distinct from p_expected_updated_at then
    raise exception using errcode = '40001', message = 'Listening item changed since it was loaded';
  end if;

  update public.hanzihome_listening_items item
  set
    prompt_zh = case
      when p_changes ? 'prompt_zh' then p_changes ->> 'prompt_zh'
      else item.prompt_zh
    end,
    transcript = case
      when p_changes ? 'transcript' then nullif(p_changes -> 'transcript', 'null'::jsonb)
      else item.transcript
    end,
    options = case
      when p_changes ? 'options' then p_changes -> 'options'
      else item.options
    end,
    answer = case
      when p_changes ? 'answer' then nullif(p_changes -> 'answer', 'null'::jsonb)
      else item.answer
    end,
    explanation_vi = case
      when p_changes ? 'explanation_vi' then p_changes ->> 'explanation_vi'
      else item.explanation_vi
    end,
    metadata = case
      when p_changes ? 'metadata' then p_changes -> 'metadata'
      else item.metadata
    end
  where item.id = p_entity_id
  returning to_jsonb(item) into v_after;

  insert into public.hanzihome_content_audit_log (
    actor_id,
    operation,
    entity_type,
    entity_id,
    parent_entity_type,
    parent_entity_id,
    before_data,
    after_data,
    reason
  )
  values (
    v_actor_id,
    'update',
    'listening_item',
    p_entity_id,
    'lesson',
    v_before ->> 'lesson_id',
    v_before,
    v_after,
    p_reason
  );

  return jsonb_build_object('item', v_after);
end;
$$;


ALTER FUNCTION "public"."hanzihome_update_listening_item_as_user"("p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hanzihome_update_listening_item_as_user"("p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text") IS 'Atomically updates one listening item for an editor/admin session and records a HanziHome content audit row.';



CREATE OR REPLACE FUNCTION "public"."hanzihome_update_radical_as_user"("p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb" DEFAULT '{}'::"jsonb", "p_reason" "text" DEFAULT 'Cập nhật bộ thủ HanziHome'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
declare
  v_actor_id uuid := (select auth.uid());
  v_allowed_columns text[] := array[
    'radical',
    'name_vi',
    'strokes',
    'core_meaning',
    'variants',
    'related_components',
    'recognition',
    'distinguish',
    'groups'
  ];
  v_change_key text;
  v_set_clause text;
  v_before jsonb;
  v_after jsonb;
  v_current_updated_at timestamptz;
begin
  if v_actor_id is null then
    raise exception using errcode = '28000', message = 'Authenticated actor is required';
  end if;

  if not (select public.can_edit_hanzihome_content()) then
    raise exception using errcode = '42501', message = 'HanziHome editor role is required';
  end if;

  if p_entity_id is null or length(trim(p_entity_id)) = 0 then
    raise exception using errcode = '22023', message = 'Entity id is required';
  end if;

  if p_expected_updated_at is null then
    raise exception using errcode = '22023', message = 'expectedUpdatedAt is required';
  end if;

  if p_changes is null or p_changes = '{}'::jsonb then
    raise exception using errcode = '22023', message = 'Update requires at least one changed field';
  end if;

  for v_change_key in select jsonb_object_keys(p_changes)
  loop
    if not (v_change_key = any(v_allowed_columns)) then
      raise exception using errcode = '22023', message = format('Field %s is not editable for radical', v_change_key);
    end if;
  end loop;

  select to_jsonb(radical_row), radical_row.updated_at
  into v_before, v_current_updated_at
  from public.hanzihome_radicals radical_row
  where radical_row.id = p_entity_id
  for update;

  if v_before is null then
    raise exception using errcode = 'P0002', message = 'HanziHome radical not found';
  end if;

  if v_before ->> 'deleted_at' is not null then
    raise exception using errcode = '22023', message = 'Deleted content must be restored before it can be changed';
  end if;

  if v_current_updated_at <> p_expected_updated_at then
    raise exception using errcode = '40001', message = 'HanziHome radical changed since it was loaded';
  end if;

  select string_agg(
    format('%1$I = patch.%1$I', attribute.attname),
    ', '
  )
  into v_set_clause
  from pg_attribute attribute
  where attribute.attrelid = 'public.hanzihome_radicals'::regclass
    and attribute.attnum > 0
    and not attribute.attisdropped
    and attribute.attname in (select jsonb_object_keys(p_changes));

  if v_set_clause is null then
    raise exception using errcode = '22023', message = 'No editable changes were provided';
  end if;

  execute format(
    'update public.hanzihome_radicals target set %s from jsonb_populate_record(null::public.hanzihome_radicals, $1) patch where target.id = $2 returning to_jsonb(target.*)',
    v_set_clause
  )
  using p_changes, p_entity_id
  into v_after;

  insert into public.hanzihome_content_audit_log (
    actor_id,
    operation,
    entity_type,
    entity_id,
    before_data,
    after_data,
    reason
  ) values (
    v_actor_id,
    'update',
    'radical',
    p_entity_id,
    v_before,
    v_after,
    trim(p_reason)
  );

  return jsonb_build_object('item', v_after);
end;
$_$;


ALTER FUNCTION "public"."hanzihome_update_radical_as_user"("p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hanzihome_update_radical_as_user"("p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text") IS 'Session-authenticated single-row update path for HanziHome radical seed rows. Requires editor/admin role, optimistic concurrency, and writes audit in the same transaction.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_reader_annotations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "document_id" "text" NOT NULL,
    "paragraph_id" "text",
    "asset_id" "text",
    "annotation_type" "text" NOT NULL,
    "page_number" integer,
    "start_offset" integer,
    "end_offset" integer,
    "selected_text" "text" DEFAULT ''::"text" NOT NULL,
    "note_text" "text" DEFAULT ''::"text" NOT NULL,
    "color" "text" DEFAULT 'yellow'::"text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "revision" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "hanzihome_reader_annotations_annotation_type_check" CHECK (("annotation_type" = ANY (ARRAY['highlight'::"text", 'underline'::"text", 'note'::"text", 'ink'::"text"]))),
    CONSTRAINT "hanzihome_reader_annotations_check" CHECK ((("end_offset" IS NULL) OR ("end_offset" > "start_offset"))),
    CONSTRAINT "hanzihome_reader_annotations_color_check" CHECK (("color" = ANY (ARRAY['yellow'::"text", 'green'::"text", 'blue'::"text", 'pink'::"text"]))),
    CONSTRAINT "hanzihome_reader_annotations_page_check" CHECK ((("asset_id" IS NOT NULL) OR ("page_number" IS NULL))),
    CONSTRAINT "hanzihome_reader_annotations_page_number_check" CHECK ((("page_number" IS NULL) OR ("page_number" > 0))),
    CONSTRAINT "hanzihome_reader_annotations_payload_check" CHECK (("jsonb_typeof"("payload") = 'object'::"text")),
    CONSTRAINT "hanzihome_reader_annotations_range_check" CHECK (((("start_offset" IS NULL) AND ("end_offset" IS NULL)) OR (("start_offset" IS NOT NULL) AND ("end_offset" IS NOT NULL) AND ("end_offset" > "start_offset")))),
    CONSTRAINT "hanzihome_reader_annotations_revision_check" CHECK (("revision" >= 0)),
    CONSTRAINT "hanzihome_reader_annotations_start_offset_check" CHECK ((("start_offset" IS NULL) OR ("start_offset" >= 0))),
    CONSTRAINT "hanzihome_reader_annotations_target_check" CHECK ((((("paragraph_id" IS NOT NULL))::integer + (("asset_id" IS NOT NULL))::integer) = 1))
);


ALTER TABLE "public"."hanzihome_reader_annotations" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_reader_annotations" IS 'HanziHome-owned Reader annotations keyed by static document, paragraph, or asset IDs; no Studio annotations are imported.';



CREATE OR REPLACE FUNCTION "public"."hanzihome_update_reader_annotation"("p_annotation_id" "uuid", "p_asset_id" "text", "p_color" "text", "p_end_offset" integer, "p_expected_revision" integer, "p_note_text" "text", "p_page_number" integer, "p_payload" "jsonb", "p_paragraph_id" "text", "p_selected_text" "text", "p_start_offset" integer) RETURNS "public"."hanzihome_reader_annotations"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  current_row public.hanzihome_reader_annotations;
  next_row public.hanzihome_reader_annotations;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception using errcode = '22023', message = 'Expected revision cannot be negative';
  end if;
  select * into current_row
  from public.hanzihome_reader_annotations
  where id = p_annotation_id and user_id = auth.uid() and deleted_at is null
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Reader annotation not found';
  end if;
  if current_row.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Reader annotation changed since it was loaded';
  end if;

  update public.hanzihome_reader_annotations
  set paragraph_id = p_paragraph_id,
      asset_id = p_asset_id,
      page_number = p_page_number,
      start_offset = p_start_offset,
      end_offset = p_end_offset,
      selected_text = p_selected_text,
      note_text = p_note_text,
      color = p_color,
      payload = p_payload,
      revision = current_row.revision + 1
  where id = p_annotation_id and user_id = auth.uid()
  returning * into next_row;
  return next_row;
end;
$$;


ALTER FUNCTION "public"."hanzihome_update_reader_annotation"("p_annotation_id" "uuid", "p_asset_id" "text", "p_color" "text", "p_end_offset" integer, "p_expected_revision" integer, "p_note_text" "text", "p_page_number" integer, "p_payload" "jsonb", "p_paragraph_id" "text", "p_selected_text" "text", "p_start_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_update_reader_annotation_as_server"("p_user_id" "uuid", "p_annotation_id" "uuid", "p_asset_id" "text", "p_color" "text", "p_end_offset" integer, "p_expected_revision" integer, "p_note_text" "text", "p_page_number" integer, "p_payload" "jsonb", "p_paragraph_id" "text", "p_selected_text" "text", "p_start_offset" integer) RETURNS "public"."hanzihome_reader_annotations"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_update_reader_annotation(p_annotation_id, p_asset_id, p_color, p_end_offset, p_expected_revision, p_note_text, p_page_number, p_payload, p_paragraph_id, p_selected_text, p_start_offset);
end;
$$;


ALTER FUNCTION "public"."hanzihome_update_reader_annotation_as_server"("p_user_id" "uuid", "p_annotation_id" "uuid", "p_asset_id" "text", "p_color" "text", "p_end_offset" integer, "p_expected_revision" integer, "p_note_text" "text", "p_page_number" integer, "p_payload" "jsonb", "p_paragraph_id" "text", "p_selected_text" "text", "p_start_offset" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hanzihome_daily_reading_state" (
    "user_id" "uuid" NOT NULL,
    "published_date" "date" NOT NULL,
    "state" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "revision" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hanzihome_daily_reading_state_revision_check" CHECK (("revision" >= 0)),
    CONSTRAINT "hanzihome_daily_reading_state_state_check" CHECK (("jsonb_typeof"("state") = 'object'::"text"))
);


ALTER TABLE "public"."hanzihome_daily_reading_state" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_upsert_daily_reading_state"("p_published_date" "date", "p_state" "jsonb", "p_expected_revision" integer) RETURNS "public"."hanzihome_daily_reading_state"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  current_row public.hanzihome_daily_reading_state;
  next_row public.hanzihome_daily_reading_state;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_published_date is null then
    raise exception using errcode = '22023', message = 'Published date is required';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception using errcode = '22023', message = 'Expected revision cannot be negative';
  end if;
  if p_state is null or jsonb_typeof(p_state) <> 'object' then
    raise exception using errcode = '22023', message = 'Daily reading state must be an object';
  end if;

  select *
  into current_row
  from public.hanzihome_daily_reading_state
  where user_id = auth.uid()
    and published_date = p_published_date
  for update;

  if not found then
    if p_expected_revision <> 0 then
      raise exception using errcode = '40001', message = 'Daily reading state changed before it was created';
    end if;

    insert into public.hanzihome_daily_reading_state (user_id, published_date, state, revision)
    values (auth.uid(), p_published_date, p_state, 0)
    returning * into next_row;
    return next_row;
  end if;

  if current_row.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Daily reading state changed since it was loaded';
  end if;

  update public.hanzihome_daily_reading_state
  set state = p_state,
      revision = current_row.revision + 1
  where user_id = auth.uid()
    and published_date = p_published_date
  returning * into next_row;

  return next_row;
end;
$$;


ALTER FUNCTION "public"."hanzihome_upsert_daily_reading_state"("p_published_date" "date", "p_state" "jsonb", "p_expected_revision" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_upsert_daily_reading_state_as_server"("p_user_id" "uuid", "p_published_date" "date", "p_state" "jsonb", "p_expected_revision" integer) RETURNS "public"."hanzihome_daily_reading_state"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_upsert_daily_reading_state(p_published_date, p_state, p_expected_revision);
end;
$$;


ALTER FUNCTION "public"."hanzihome_upsert_daily_reading_state_as_server"("p_user_id" "uuid", "p_published_date" "date", "p_state" "jsonb", "p_expected_revision" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hanzihome_pdf_annotations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "asset_id" "text" NOT NULL,
    "page_number" integer NOT NULL,
    "payload" "jsonb" DEFAULT '{"strokes": []}'::"jsonb" NOT NULL,
    "revision" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hanzihome_pdf_annotations_page_number_check" CHECK (("page_number" > 0)),
    CONSTRAINT "hanzihome_pdf_annotations_payload_check" CHECK ((("jsonb_typeof"("payload") = 'object'::"text") AND ("jsonb_typeof"(("payload" -> 'strokes'::"text")) = 'array'::"text"))),
    CONSTRAINT "hanzihome_pdf_annotations_revision_check" CHECK (("revision" >= 0))
);


ALTER TABLE "public"."hanzihome_pdf_annotations" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_pdf_annotations" IS 'HanziHome-owned PDF annotations keyed by static asset ID; no Studio PDF annotation state is imported.';



CREATE OR REPLACE FUNCTION "public"."hanzihome_upsert_pdf_annotation"("p_asset_id" "text", "p_page_number" integer, "p_payload" "jsonb", "p_expected_revision" integer) RETURNS "public"."hanzihome_pdf_annotations"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  current_row public.hanzihome_pdf_annotations;
  next_row public.hanzihome_pdf_annotations;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_asset_id is null or length(btrim(p_asset_id)) = 0 then
    raise exception using errcode = '22023', message = 'PDF asset is required';
  end if;
  if p_page_number is null or p_page_number <= 0 then
    raise exception using errcode = '22023', message = 'PDF page must be positive';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception using errcode = '22023', message = 'Expected revision cannot be negative';
  end if;
  if p_payload is null
    or jsonb_typeof(p_payload) <> 'object'
    or jsonb_typeof(p_payload->'strokes') <> 'array' then
    raise exception using errcode = '22023', message = 'PDF annotation payload is invalid';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    p_asset_id || ':' || p_page_number::text || ':' || auth.uid()::text,
    0
  ));

  select *
  into current_row
  from public.hanzihome_pdf_annotations
  where user_id = auth.uid()
    and asset_id = p_asset_id
    and page_number = p_page_number
  for update;

  if not found then
    if p_expected_revision <> 0 then
      raise exception using errcode = '40001', message = 'PDF annotation changed before it was created';
    end if;
    insert into public.hanzihome_pdf_annotations (
      user_id, asset_id, page_number, payload, revision
    )
    values (auth.uid(), p_asset_id, p_page_number, p_payload, 0)
    returning * into next_row;
    return next_row;
  end if;

  if current_row.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'PDF annotation revision conflict';
  end if;

  update public.hanzihome_pdf_annotations
  set payload = p_payload,
      revision = current_row.revision + 1
  where id = current_row.id
  returning * into next_row;
  return next_row;
end;
$$;


ALTER FUNCTION "public"."hanzihome_upsert_pdf_annotation"("p_asset_id" "text", "p_page_number" integer, "p_payload" "jsonb", "p_expected_revision" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hanzihome_personal_learning_state" (
    "user_id" "uuid" NOT NULL,
    "node_id" "text" NOT NULL,
    "state" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "revision" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hanzihome_personal_learning_state_revision_check" CHECK (("revision" >= 0)),
    CONSTRAINT "hanzihome_personal_learning_state_state_check" CHECK (("jsonb_typeof"("state") = 'object'::"text"))
);


ALTER TABLE "public"."hanzihome_personal_learning_state" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_upsert_personal_learning_state"("p_node_id" "text", "p_state" "jsonb", "p_expected_revision" integer) RETURNS "public"."hanzihome_personal_learning_state"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  current_row public.hanzihome_personal_learning_state;
  next_row public.hanzihome_personal_learning_state;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_node_id is null or length(btrim(p_node_id)) = 0 then
    raise exception using errcode = '22023', message = 'Personal learning node is required';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception using errcode = '22023', message = 'Expected revision cannot be negative';
  end if;
  if p_state is null or jsonb_typeof(p_state) <> 'object' then
    raise exception using errcode = '22023', message = 'Personal learning state must be an object';
  end if;

  select *
  into current_row
  from public.hanzihome_personal_learning_state
  where user_id = auth.uid()
    and node_id = p_node_id
  for update;

  if not found then
    if p_expected_revision <> 0 then
      raise exception using errcode = '40001', message = 'Personal learning state changed before it was created';
    end if;

    insert into public.hanzihome_personal_learning_state (user_id, node_id, state, revision)
    values (auth.uid(), p_node_id, p_state, 0)
    returning * into next_row;
    return next_row;
  end if;

  if current_row.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Personal learning state changed since it was loaded';
  end if;

  update public.hanzihome_personal_learning_state
  set state = p_state,
      revision = current_row.revision + 1
  where user_id = auth.uid()
    and node_id = p_node_id
  returning * into next_row;

  return next_row;
end;
$$;


ALTER FUNCTION "public"."hanzihome_upsert_personal_learning_state"("p_node_id" "text", "p_state" "jsonb", "p_expected_revision" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_upsert_personal_learning_state_as_server"("p_user_id" "uuid", "p_node_id" "text", "p_state" "jsonb", "p_expected_revision" integer) RETURNS "public"."hanzihome_personal_learning_state"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_upsert_personal_learning_state(p_node_id, p_state, p_expected_revision);
end;
$$;


ALTER FUNCTION "public"."hanzihome_upsert_personal_learning_state_as_server"("p_user_id" "uuid", "p_node_id" "text", "p_state" "jsonb", "p_expected_revision" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hanzihome_reader_progress" (
    "user_id" "uuid" NOT NULL,
    "document_id" "text" NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "answers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "revision" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hanzihome_reader_progress_answers_check" CHECK (("jsonb_typeof"("answers") = 'object'::"text")),
    CONSTRAINT "hanzihome_reader_progress_revision_check" CHECK (("revision" >= 0))
);


ALTER TABLE "public"."hanzihome_reader_progress" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_reader_progress" IS 'User-owned Reader progress: explicit completion plus exercise answers and optimistic revision. Reading display preferences belong to user_learning_state.settings.';



CREATE OR REPLACE FUNCTION "public"."hanzihome_upsert_reader_progress"("p_document_id" "text", "p_show_pinyin" boolean, "p_show_meaning" boolean, "p_completed" boolean, "p_summary_text" "text", "p_answers" "jsonb", "p_expected_revision" integer) RETURNS "public"."hanzihome_reader_progress"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  current_row public.hanzihome_reader_progress;
  next_row public.hanzihome_reader_progress;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_document_id is null or length(btrim(p_document_id)) = 0 then
    raise exception using errcode = '22023', message = 'Reader document is required';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception using errcode = '22023', message = 'Expected revision cannot be negative';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception using errcode = '22023', message = 'Reader answers must be an object';
  end if;

  -- Deprecated parameters are intentionally ignored. They remain only so an
  -- already-deployed pre-cutover client cannot rewrite global reading prefs.
  perform p_show_pinyin, p_show_meaning, p_summary_text;

  select *
  into current_row
  from public.hanzihome_reader_progress
  where user_id = auth.uid()
    and document_id = p_document_id
  for update;

  if not found then
    if p_expected_revision <> 0 then
      raise exception using errcode = '40001', message = 'Reader progress changed before it was created';
    end if;

    insert into public.hanzihome_reader_progress (
      user_id,
      document_id,
      completed,
      answers,
      revision
    ) values (
      auth.uid(),
      p_document_id,
      p_completed,
      p_answers,
      0
    )
    returning * into next_row;
    return next_row;
  end if;

  if current_row.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Reader progress changed since it was loaded';
  end if;

  update public.hanzihome_reader_progress
  set completed = p_completed,
      answers = p_answers,
      revision = current_row.revision + 1
  where user_id = auth.uid()
    and document_id = p_document_id
  returning * into next_row;

  return next_row;
end;
$$;


ALTER FUNCTION "public"."hanzihome_upsert_reader_progress"("p_document_id" "text", "p_show_pinyin" boolean, "p_show_meaning" boolean, "p_completed" boolean, "p_summary_text" "text", "p_answers" "jsonb", "p_expected_revision" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."hanzihome_upsert_reader_progress"("p_document_id" "text", "p_show_pinyin" boolean, "p_show_meaning" boolean, "p_completed" boolean, "p_summary_text" "text", "p_answers" "jsonb", "p_expected_revision" integer) IS 'Deprecated compatibility adapter for pre-cutover Reader clients. Display and summary parameters are ignored; active Reader writes use only completed, answers, and revision.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_reader_pronunciation_overrides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "document_id" "text" NOT NULL,
    "paragraph_id" "text" NOT NULL,
    "text" "text" NOT NULL,
    "readings" "text"[] NOT NULL,
    "scope" "text" NOT NULL,
    "sentence_text" "text",
    "start_offset" integer,
    "end_offset" integer,
    "revision" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hanzihome_reader_pronunciation_override_document_check" CHECK (("paragraph_id" IS NOT NULL)),
    CONSTRAINT "hanzihome_reader_pronunciation_override_parent_check" CHECK ((("sentence_text" IS NOT NULL) OR (("start_offset" IS NULL) AND ("end_offset" IS NULL)))),
    CONSTRAINT "hanzihome_reader_pronunciation_overrides_check" CHECK ((("end_offset" IS NULL) OR ("end_offset" > "start_offset"))),
    CONSTRAINT "hanzihome_reader_pronunciation_overrides_readings_check" CHECK (("cardinality"("readings") > 0)),
    CONSTRAINT "hanzihome_reader_pronunciation_overrides_revision_check" CHECK (("revision" >= 0)),
    CONSTRAINT "hanzihome_reader_pronunciation_overrides_scope_check" CHECK (("scope" = ANY (ARRAY['character-global'::"text", 'phrase'::"text", 'sentence-instance'::"text"]))),
    CONSTRAINT "hanzihome_reader_pronunciation_overrides_start_offset_check" CHECK ((("start_offset" IS NULL) OR ("start_offset" >= 0))),
    CONSTRAINT "hanzihome_reader_pronunciation_overrides_text_check" CHECK (("length"("btrim"("text")) > 0))
);


ALTER TABLE "public"."hanzihome_reader_pronunciation_overrides" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_reader_pronunciation_overrides" IS 'HanziHome-owned contextual pronunciation overrides keyed by static Reader IDs; no Studio pronunciation state is imported.';



CREATE OR REPLACE FUNCTION "public"."hanzihome_upsert_reader_pronunciation_override"("p_override_id" "uuid", "p_document_id" "text", "p_paragraph_id" "text", "p_text" "text", "p_readings" "text"[], "p_scope" "text", "p_sentence_text" "text", "p_start_offset" integer, "p_end_offset" integer, "p_expected_revision" integer) RETURNS "public"."hanzihome_reader_pronunciation_overrides"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  current_row public.hanzihome_reader_pronunciation_overrides;
  next_row public.hanzihome_reader_pronunciation_overrides;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_override_id is null or p_document_id is null or p_paragraph_id is null
    or p_text is null or length(btrim(p_text)) = 0
    or p_readings is null or cardinality(p_readings) = 0
    or p_scope not in ('character-global', 'phrase', 'sentence-instance') then
    raise exception using errcode = '22023', message = 'Reader pronunciation override is invalid';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception using errcode = '22023', message = 'Expected revision cannot be negative';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_override_id::text, 0));
  select * into current_row
  from public.hanzihome_reader_pronunciation_overrides
  where id = p_override_id and user_id = auth.uid()
  for update;

  if not found then
    if p_expected_revision <> 0 then
      raise exception using errcode = '40001', message = 'Reader pronunciation override changed before it was created';
    end if;
    insert into public.hanzihome_reader_pronunciation_overrides (
      id, user_id, document_id, paragraph_id, text, readings, scope,
      sentence_text, start_offset, end_offset, revision
    ) values (
      p_override_id, auth.uid(), p_document_id, p_paragraph_id, p_text, p_readings, p_scope,
      p_sentence_text, p_start_offset, p_end_offset, 0
    ) returning * into next_row;
    return next_row;
  end if;

  if current_row.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Reader pronunciation override changed since it was loaded';
  end if;

  update public.hanzihome_reader_pronunciation_overrides
  set document_id = p_document_id,
      paragraph_id = p_paragraph_id,
      text = p_text,
      readings = p_readings,
      scope = p_scope,
      sentence_text = p_sentence_text,
      start_offset = p_start_offset,
      end_offset = p_end_offset,
      revision = current_row.revision + 1
  where id = p_override_id and user_id = auth.uid()
  returning * into next_row;
  return next_row;
end;
$$;


ALTER FUNCTION "public"."hanzihome_upsert_reader_pronunciation_override"("p_override_id" "uuid", "p_document_id" "text", "p_paragraph_id" "text", "p_text" "text", "p_readings" "text"[], "p_scope" "text", "p_sentence_text" "text", "p_start_offset" integer, "p_end_offset" integer, "p_expected_revision" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_upsert_reader_pronunciation_override_as_server"("p_user_id" "uuid", "p_override_id" "uuid", "p_document_id" "text", "p_paragraph_id" "text", "p_text" "text", "p_readings" "text"[], "p_scope" "text", "p_sentence_text" "text", "p_start_offset" integer, "p_end_offset" integer, "p_expected_revision" integer) RETURNS "public"."hanzihome_reader_pronunciation_overrides"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_upsert_reader_pronunciation_override(p_override_id, p_document_id, p_paragraph_id, p_text, p_readings, p_scope, p_sentence_text, p_start_offset, p_end_offset, p_expected_revision);
end;
$$;


ALTER FUNCTION "public"."hanzihome_upsert_reader_pronunciation_override_as_server"("p_user_id" "uuid", "p_override_id" "uuid", "p_document_id" "text", "p_paragraph_id" "text", "p_text" "text", "p_readings" "text"[], "p_scope" "text", "p_sentence_text" "text", "p_start_offset" integer, "p_end_offset" integer, "p_expected_revision" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hanzihome_vocab_child_candidates"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_deleted" boolean DEFAULT false, "p_section_keys" "text"[] DEFAULT NULL::"text"[], "p_ids" "text"[] DEFAULT NULL::"text"[], "p_query" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "text", "vocab_item_id" "text", "lesson_id" "text", "course_id" "text", "book_id" "text", "owner_id" "uuid", "source" "text", "word" "text", "label" "text", "section_key" "text", "updated_at" timestamp with time zone, "deleted_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if p_entity_type not in ('vocab_detail_section', 'vocab_example') then
    raise exception using errcode = '22023', message = 'Unsupported vocabulary child entity';
  end if;
  if p_scope_type not in ('lesson', 'book', 'course') then
    raise exception using errcode = '22023', message = 'Unsupported vocabulary bulk scope';
  end if;

  if p_entity_type = 'vocab_detail_section' then
    return query
    select d.id, d.vocab_item_id, d.lesson_id, v.course_id, v.book_id, d.owner_id, d.source, v.word,
      coalesce(nullif(d.title, ''), d.section_key), d.section_key, d.updated_at, d.deleted_at
    from public.hanzihome_vocab_detail_sections d
    join public.hanzihome_vocab_items v on v.id = d.vocab_item_id and v.deleted_at is null
    where (d.deleted_at is not null) = p_deleted
      and case p_scope_type
        when 'lesson' then d.lesson_id = p_scope_id
        when 'book' then v.book_id = p_scope_id
        else v.course_id = p_scope_id
      end
      and (
        p_section_keys is null
        or d.section_key = any(p_section_keys)
        or ('custom:' = any(p_section_keys) and d.section_key like 'custom:%')
      )
      and (p_ids is null or d.id = any(p_ids))
      and (coalesce(trim(p_query), '') = '' or concat_ws(' ', d.title, d.section_key, array_to_string(d.lines, ' ')) ilike '%' || trim(p_query) || '%')
      and (d.owner_id is null or (p_scope_type = 'lesson' and p_ids is not null and d.owner_id = auth.uid()));
  else
    return query
    select e.id, e.vocab_item_id, e.lesson_id, v.course_id, v.book_id, e.owner_id, e.source, v.word,
      e.zh, null::text, e.updated_at, e.deleted_at
    from public.hanzihome_vocab_examples e
    join public.hanzihome_vocab_items v on v.id = e.vocab_item_id and v.deleted_at is null
    where (e.deleted_at is not null) = p_deleted
      and case p_scope_type
        when 'lesson' then e.lesson_id = p_scope_id
        when 'book' then v.book_id = p_scope_id
        else v.course_id = p_scope_id
      end
      and (p_ids is null or e.id = any(p_ids))
      and (coalesce(trim(p_query), '') = '' or concat_ws(' ', e.zh, e.pinyin, e.vi, e.note) ilike '%' || trim(p_query) || '%')
      and (e.owner_id is null or (p_scope_type = 'lesson' and p_ids is not null and e.owner_id = auth.uid()));
  end if;
end;
$$;


ALTER FUNCTION "public"."hanzihome_vocab_child_candidates"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_deleted" boolean, "p_section_keys" "text"[], "p_ids" "text"[], "p_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_hanzihome_content_editor"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.hanzihome_content_editors editor
    where editor.user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_hanzihome_content_editor"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_hanzihome_html_artifact_folders_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_hanzihome_html_artifact_folders_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_hanzihome_html_artifact_runtime_states_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_hanzihome_html_artifact_runtime_states_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_hanzihome_html_artifacts_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_hanzihome_html_artifacts_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_hanzihome_memory_tips_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_hanzihome_memory_tips_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_hanzihome_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_hanzihome_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_note_short_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  new_short_id text;
  collision boolean;
begin
  if new.short_id is null then
    collision := true;
    while collision loop
      new_short_id := public.generate_note_short_id();
      collision := exists(
        select 1
        from public.notes
        where short_id = new_short_id
      );
    end loop;
    new.short_id := new_short_id;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_note_short_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_note_short_id"() IS 'Assigns collision-safe note short IDs inside authenticated note inserts.';



CREATE OR REPLACE FUNCTION "public"."touch_note_folder_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."touch_note_folder_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lesson_text_annotation_note"("p_annotation_id" "uuid", "p_note_text" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  current_user_id uuid := auth.uid();
  target_annotation public.lesson_text_annotations%rowtype;
  target_note_id uuid;
  normalized_note text := nullif(btrim(p_note_text), '');
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if normalized_note is null then
    raise exception 'Note text is required';
  end if;

  select * into target_annotation
  from public.lesson_text_annotations
  where id = p_annotation_id and user_id = current_user_id
  for update;

  if not found then
    raise exception 'Annotation not found';
  end if;

  if target_annotation.note_id is null then
    insert into public.notes (user_id, title, tags, category, content)
    values (
      current_user_id,
      left('Ghi chú: ' || target_annotation.selected_text, 120),
      array['annotation'],
      'general',
      jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(
          jsonb_build_object(
            'type', 'paragraph',
            'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', normalized_note))
          )
        )
      )
    )
    returning id into target_note_id;

    insert into public.lesson_note_links (
      user_id,
      note_id,
      target_type,
      target_key,
      relation_type
    )
    values (
      current_user_id,
      target_note_id,
      'hanzihome_lesson',
      target_annotation.lesson_id,
      'annotation'
    );

    update public.lesson_text_annotations
    set note_id = target_note_id, updated_at = now()
    where id = target_annotation.id;
  else
    target_note_id := target_annotation.note_id;
    update public.notes
    set
      content = jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(
          jsonb_build_object(
            'type', 'paragraph',
            'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', normalized_note))
          )
        )
      ),
      updated_at = now()
    where id = target_note_id and user_id = current_user_id;
  end if;

  return target_note_id;
end;
$$;


ALTER FUNCTION "public"."update_lesson_text_annotation_note"("p_annotation_id" "uuid", "p_note_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_legacy_vocabulary_cache"("p_hanzi" "text", "p_pinyin" "text" DEFAULT NULL::"text", "p_sino_vietnamese" "text" DEFAULT NULL::"text", "p_meaning" "text" DEFAULT NULL::"text", "p_analysis" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  normalized_hanzi text := btrim(p_hanzi);
  vocabulary_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if normalized_hanzi = '' or char_length(normalized_hanzi) > 32 then
    raise exception 'Invalid Hanzi cache key' using errcode = '22023';
  end if;

  if char_length(coalesce(p_pinyin, '')) > 512
    or char_length(coalesce(p_sino_vietnamese, '')) > 512
    or char_length(coalesce(p_meaning, '')) > 4000
    or jsonb_typeof(coalesce(p_analysis, '{}'::jsonb)) <> 'object'
    or pg_column_size(coalesce(p_analysis, '{}'::jsonb)) > 1048576
  then
    raise exception 'Invalid vocabulary cache payload' using errcode = '22023';
  end if;

  insert into public.vocabularies (
    hanzi,
    pinyin,
    sino_vietnamese,
    meaning,
    analysis,
    ai_analysis
  )
  values (
    normalized_hanzi,
    nullif(btrim(p_pinyin), ''),
    nullif(btrim(p_sino_vietnamese), ''),
    nullif(btrim(p_meaning), ''),
    coalesce(p_analysis, '{}'::jsonb),
    coalesce(p_analysis, '{}'::jsonb)
  )
  on conflict (hanzi) do update set
    pinyin = excluded.pinyin,
    sino_vietnamese = excluded.sino_vietnamese,
    meaning = excluded.meaning,
    analysis = excluded.analysis,
    ai_analysis = excluded.ai_analysis
  returning id into vocabulary_id;

  return vocabulary_id;
end;
$$;


ALTER FUNCTION "public"."upsert_legacy_vocabulary_cache"("p_hanzi" "text", "p_pinyin" "text", "p_sino_vietnamese" "text", "p_meaning" "text", "p_analysis" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_note_folder_depth"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  parent_parent_id uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  select folder.parent_id
  into parent_parent_id
  from public.note_folders as folder
  where folder.id = new.parent_id
    and folder.user_id = new.user_id;

  if not found then
    raise exception 'Parent note folder does not exist or is not owned by the current user';
  end if;

  if parent_parent_id is not null then
    raise exception 'Note folders support at most two levels';
  end if;

  if exists (
    select 1
    from public.note_folders as child
    where child.parent_id = new.id
      and child.user_id = new.user_id
  ) then
    raise exception 'A note folder with children cannot be moved below another folder';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."validate_note_folder_depth"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_characters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "city" "text" DEFAULT ''::"text" NOT NULL,
    "age" integer,
    "background" "text" DEFAULT ''::"text" NOT NULL,
    "personality" "text" DEFAULT ''::"text" NOT NULL,
    "speaking_style" "text" DEFAULT ''::"text" NOT NULL,
    "interests" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "identity_notes" "text" DEFAULT ''::"text" NOT NULL,
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_characters_age_check" CHECK ((("age" IS NULL) OR (("age" >= 1) AND ("age" <= 120)))),
    CONSTRAINT "ai_characters_display_name_check" CHECK (("length"("btrim"("display_name")) > 0))
);


ALTER TABLE "public"."ai_characters" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_characters" IS 'User-owned stable AI character identity. Conversation modes are stored separately from character identity.';



CREATE TABLE IF NOT EXISTS "public"."ai_conversation_preferences" (
    "user_id" "uuid" NOT NULL,
    "default_character_id" "uuid",
    "default_mode" "text" DEFAULT 'natural'::"text" NOT NULL,
    "default_correction_style" "text" DEFAULT 'balanced'::"text" NOT NULL,
    "default_reply_mode" "text" DEFAULT 'adaptive'::"text" NOT NULL,
    "learner_level" "text" DEFAULT 'intermediate'::"text" NOT NULL,
    "memory_enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_conversation_preferences_correction_check" CHECK (("default_correction_style" = ANY (ARRAY['light'::"text", 'balanced'::"text", 'strict'::"text"]))),
    CONSTRAINT "ai_conversation_preferences_learner_level_check" CHECK (("learner_level" = ANY (ARRAY['beginner'::"text", 'intermediate'::"text", 'advanced'::"text"]))),
    CONSTRAINT "ai_conversation_preferences_mode_check" CHECK (("default_mode" = ANY (ARRAY['natural'::"text", 'speaking-practice'::"text", 'grammar-coach'::"text", 'hskk-practice'::"text"]))),
    CONSTRAINT "ai_conversation_preferences_reply_mode_check" CHECK (("default_reply_mode" = ANY (ARRAY['adaptive'::"text", 'chinese'::"text", 'bilingual'::"text"])))
);


ALTER TABLE "public"."ai_conversation_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_conversation_preferences" IS 'User defaults for newly created AI conversations. Browser access is denied; application routes own persistence.';



CREATE TABLE IF NOT EXISTS "public"."ai_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "character_id" "uuid" NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "mode" "text" NOT NULL,
    "correction_style" "text" NOT NULL,
    "reply_mode" "text" NOT NULL,
    "memory_policy" "text" DEFAULT 'inherit'::"text" NOT NULL,
    "summary" "text" DEFAULT ''::"text" NOT NULL,
    "summary_until_seq" bigint DEFAULT 0 NOT NULL,
    "summary_version" integer DEFAULT 1 NOT NULL,
    "last_message_seq" bigint DEFAULT 0 NOT NULL,
    "last_message_at" timestamp with time zone,
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_conversations_correction_check" CHECK (("correction_style" = ANY (ARRAY['light'::"text", 'balanced'::"text", 'strict'::"text"]))),
    CONSTRAINT "ai_conversations_last_message_seq_check" CHECK (("last_message_seq" >= 0)),
    CONSTRAINT "ai_conversations_memory_policy_check" CHECK (("memory_policy" = ANY (ARRAY['inherit'::"text", 'enabled'::"text", 'disabled'::"text"]))),
    CONSTRAINT "ai_conversations_mode_check" CHECK (("mode" = ANY (ARRAY['natural'::"text", 'speaking-practice'::"text", 'grammar-coach'::"text", 'hskk-practice'::"text"]))),
    CONSTRAINT "ai_conversations_reply_mode_check" CHECK (("reply_mode" = ANY (ARRAY['adaptive'::"text", 'chinese'::"text", 'bilingual'::"text"]))),
    CONSTRAINT "ai_conversations_summary_coverage_check" CHECK (("summary_until_seq" <= "last_message_seq")),
    CONSTRAINT "ai_conversations_summary_until_seq_check" CHECK (("summary_until_seq" >= 0)),
    CONSTRAINT "ai_conversations_summary_version_check" CHECK (("summary_version" > 0))
);


ALTER TABLE "public"."ai_conversations" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_conversations" IS 'Persisted AI conversation threads with explicit summary coverage and per-thread conversation settings.';



CREATE TABLE IF NOT EXISTS "public"."ai_memories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "character_id" "uuid",
    "kind" "text" NOT NULL,
    "memory_key" "text",
    "content" "text" NOT NULL,
    "importance" numeric(4,3) NOT NULL,
    "confidence" numeric(4,3) NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "reinforcement_count" integer DEFAULT 1 NOT NULL,
    "last_reinforced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "superseded_by_id" "uuid",
    "last_recalled_at" timestamp with time zone,
    "valid_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "embedding" "extensions"."vector"(768),
    "embedding_model" "text",
    "embedding_version" integer,
    CONSTRAINT "ai_memories_confidence_check" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric))),
    CONSTRAINT "ai_memories_content_check" CHECK (("length"("btrim"("content")) > 0)),
    CONSTRAINT "ai_memories_embedding_metadata_check" CHECK (((("embedding" IS NULL) AND ("embedding_model" IS NULL) AND ("embedding_version" IS NULL)) OR (("embedding" IS NOT NULL) AND ("embedding_model" IS NOT NULL) AND ("length"("btrim"("embedding_model")) > 0) AND ("embedding_version" IS NOT NULL) AND ("embedding_version" > 0)))),
    CONSTRAINT "ai_memories_importance_check" CHECK ((("importance" >= (0)::numeric) AND ("importance" <= (1)::numeric))),
    CONSTRAINT "ai_memories_kind_check" CHECK (("kind" = ANY (ARRAY['fact'::"text", 'preference'::"text", 'habit'::"text", 'goal'::"text", 'episode'::"text", 'open_loop'::"text", 'inside_joke'::"text"]))),
    CONSTRAINT "ai_memories_memory_key_check" CHECK ((("memory_key" IS NULL) OR ("length"("btrim"("memory_key")) > 0))),
    CONSTRAINT "ai_memories_reinforcement_count_check" CHECK (("reinforcement_count" > 0)),
    CONSTRAINT "ai_memories_resolved_kind_check" CHECK ((("status" <> 'resolved'::"text") OR ("kind" = 'open_loop'::"text"))),
    CONSTRAINT "ai_memories_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'superseded'::"text", 'resolved'::"text"]))),
    CONSTRAINT "ai_memories_superseded_link_state_check" CHECK ((("status" = 'superseded'::"text") OR ("superseded_by_id" IS NULL))),
    CONSTRAINT "ai_memories_superseded_not_self_check" CHECK ((("superseded_by_id" IS NULL) OR ("superseded_by_id" <> "id")))
);


ALTER TABLE "public"."ai_memories" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_memories" IS 'Long-term AI conversation continuity data. Global scope is represented by character_id IS NULL; FORGET deletes the row.';



CREATE TABLE IF NOT EXISTS "public"."ai_memory_evidence" (
    "memory_id" "uuid" NOT NULL,
    "message_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_memory_evidence_action_check" CHECK (("action" = ANY (ARRAY['created'::"text", 'reinforced'::"text", 'superseded'::"text", 'resolved'::"text"])))
);


ALTER TABLE "public"."ai_memory_evidence" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_memory_evidence" IS 'Many-to-many provenance linking memories to transcript messages that created or changed them.';



CREATE TABLE IF NOT EXISTS "public"."ai_relationship_states" (
    "user_id" "uuid" NOT NULL,
    "character_id" "uuid" NOT NULL,
    "nickname" "text" DEFAULT ''::"text" NOT NULL,
    "familiarity_score" numeric(5,4) DEFAULT 0 NOT NULL,
    "revision" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_relationship_states_familiarity_check" CHECK ((("familiarity_score" >= (0)::numeric) AND ("familiarity_score" <= (1)::numeric))),
    CONSTRAINT "ai_relationship_states_revision_check" CHECK (("revision" >= 0))
);


ALTER TABLE "public"."ai_relationship_states" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_relationship_states" IS 'Compact user-character relationship state. Shared events, plans and inside jokes belong in ai_memories.';



CREATE TABLE IF NOT EXISTS "public"."dictionary_core" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "headword" "text" NOT NULL,
    "lookup_key" "text" NOT NULL,
    "pinyin" "text",
    "sino_vietnamese" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "lookup_count" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."dictionary_core" OWNER TO "postgres";


COMMENT ON TABLE "public"."dictionary_core" IS 'Dictionary lookup cache used by vocabulary lookup and saved vocabulary flows. Not part of HanziHome lesson seed.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_content_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "operation" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "parent_entity_type" "text",
    "parent_entity_id" "text",
    "before_data" "jsonb",
    "after_data" "jsonb",
    "reason" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hanzihome_content_audit_log_operation_check" CHECK (("operation" = ANY (ARRAY['create'::"text", 'update'::"text", 'delete'::"text", 'restore'::"text", 'reorder'::"text"]))),
    CONSTRAINT "hanzihome_content_audit_log_reason_check" CHECK (("length"(TRIM(BOTH FROM "reason")) > 0))
);


ALTER TABLE "public"."hanzihome_content_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hanzihome_content_editors" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."hanzihome_content_editors" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_content_editors" IS 'Allowlist for authenticated users who may edit built-in HanziHome seed vocab and grammar content. Rows are managed manually by a database owner, not by app clients.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_content_roles" (
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hanzihome_content_roles_role_check" CHECK (("role" = ANY (ARRAY['read_only'::"text", 'editor'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."hanzihome_content_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_content_roles" IS 'Future HanziHome content access roles. Role assignment remains server-managed.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_course_books" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "user_id" "uuid",
    "course_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "short_title" "text",
    "book_order" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" "text" DEFAULT 'custom'::"text" NOT NULL,
    "imported_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    CONSTRAINT "hanzihome_course_books_source_check" CHECK (("source" = ANY (ARRAY['seed'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."hanzihome_course_books" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_course_books" IS 'Canonical HanziHome books table. Seed rows are imported by the server-side seed script; custom rows remain user-owned and are used by the existing custom course flow.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_courses" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "user_id" "uuid",
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "type" "text" DEFAULT 'custom'::"text" NOT NULL,
    "course_order" integer DEFAULT 1000 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" "text" DEFAULT 'custom'::"text" NOT NULL,
    "imported_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    CONSTRAINT "hanzihome_courses_source_check" CHECK (("source" = ANY (ARRAY['seed'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."hanzihome_courses" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_courses" IS 'HanziHome courses. Seed rows are imported by the server-side seed script and readable through RLS; custom rows remain user-owned.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_grammar_detail_sections" (
    "id" "text" NOT NULL,
    "grammar_point_id" "text" NOT NULL,
    "lesson_id" "text" NOT NULL,
    "owner_id" "uuid",
    "source" "text" DEFAULT 'seed'::"text" NOT NULL,
    "section_key" "text" NOT NULL,
    "title" "text" NOT NULL,
    "lines" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "section_order" integer NOT NULL,
    "imported_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    CONSTRAINT "hanzihome_grammar_detail_sections_source_check" CHECK (("source" = ANY (ARRAY['seed'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."hanzihome_grammar_detail_sections" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_grammar_detail_sections" IS 'Grammar detail sections kept separate from grammar point metadata.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_grammar_examples" (
    "id" "text" NOT NULL,
    "grammar_point_id" "text" NOT NULL,
    "lesson_id" "text" NOT NULL,
    "owner_id" "uuid",
    "source" "text" DEFAULT 'seed'::"text" NOT NULL,
    "example_order" integer NOT NULL,
    "zh" "text" NOT NULL,
    "pinyin" "text",
    "vi" "text",
    "note" "text",
    "imported_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    CONSTRAINT "hanzihome_grammar_examples_source_check" CHECK (("source" = ANY (ARRAY['seed'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."hanzihome_grammar_examples" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_grammar_examples" IS 'Grammar examples normalized into child rows for editing and review.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_grammar_points" (
    "id" "text" NOT NULL,
    "lesson_id" "text" NOT NULL,
    "course_id" "text" NOT NULL,
    "book_id" "text" NOT NULL,
    "owner_id" "uuid",
    "source" "text" DEFAULT 'seed'::"text" NOT NULL,
    "point_order" integer NOT NULL,
    "title" "text" NOT NULL,
    "clean_title" "text" NOT NULL,
    "core" "text" DEFAULT ''::"text" NOT NULL,
    "content_md" "text",
    "structures_view" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "notes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "imported_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "title_vi" "text",
    "level" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    CONSTRAINT "hanzihome_grammar_points_source_check" CHECK (("source" = ANY (ARRAY['seed'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."hanzihome_grammar_points" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_grammar_points" IS 'Editable grammar points imported from legacy static JSON with normalized structures and notes.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_html_artifact_folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT 'blue'::"text" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "parent_folder_id" "uuid",
    CONSTRAINT "hanzihome_html_artifact_folders_color_check" CHECK (("color" = ANY (ARRAY['blue'::"text", 'purple'::"text", 'green'::"text", 'orange'::"text", 'rose'::"text", 'slate'::"text"]))),
    CONSTRAINT "hanzihome_html_artifact_folders_name_check" CHECK (("char_length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "hanzihome_html_artifact_folders_parent_not_self" CHECK ((("parent_folder_id" IS NULL) OR ("parent_folder_id" <> "id")))
);


ALTER TABLE "public"."hanzihome_html_artifact_folders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hanzihome_html_artifact_runtime_states" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "artifact_id" "uuid" NOT NULL,
    "state" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hanzihome_html_artifact_runtime_states_state_check" CHECK (("jsonb_typeof"("state") = 'object'::"text"))
);


ALTER TABLE "public"."hanzihome_html_artifact_runtime_states" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hanzihome_html_artifacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "artifact_type" "text" DEFAULT 'practice_page'::"text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "html" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "folder_id" "uuid",
    CONSTRAINT "hanzihome_html_artifacts_artifact_type_check" CHECK (("artifact_type" = ANY (ARRAY['practice_page'::"text", 'mock_exam'::"text", 'grammar_drill'::"text", 'reference'::"text", 'other'::"text"]))),
    CONSTRAINT "hanzihome_html_artifacts_html_check" CHECK (("char_length"(TRIM(BOTH FROM "html")) > 0)),
    CONSTRAINT "hanzihome_html_artifacts_title_check" CHECK (("char_length"(TRIM(BOTH FROM "title")) > 0))
);


ALTER TABLE "public"."hanzihome_html_artifacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hanzihome_lesson_sections" (
    "id" "uuid" NOT NULL,
    "lesson_id" "text" NOT NULL,
    "owner_id" "uuid",
    "source" "text" DEFAULT 'seed'::"text" NOT NULL,
    "source_section_id" "text" NOT NULL,
    "section_key" "text" NOT NULL,
    "section_type" "text" NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "title_vi" "text" DEFAULT ''::"text" NOT NULL,
    "section_order" integer NOT NULL,
    "payload" "jsonb" NOT NULL,
    "source_file" "text",
    "imported_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    CONSTRAINT "hanzihome_lesson_sections_payload_check" CHECK (("jsonb_typeof"("payload") = 'object'::"text")),
    CONSTRAINT "hanzihome_lesson_sections_section_order_check" CHECK (("section_order" > 0)),
    CONSTRAINT "hanzihome_lesson_sections_source_check" CHECK (("source" = ANY (ARRAY['seed'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."hanzihome_lesson_sections" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_lesson_sections" IS 'Canonical ordered lesson section payloads. Seed rows preserve the complete materialized lesson structure while normalized vocab and grammar tables provide specialized read models.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_lesson_texts" (
    "id" "text" NOT NULL,
    "lesson_id" "text" NOT NULL,
    "owner_id" "uuid",
    "source" "text" DEFAULT 'seed'::"text" NOT NULL,
    "text_key" "text" DEFAULT 'main'::"text" NOT NULL,
    "title" "text",
    "content" "text" DEFAULT ''::"text" NOT NULL,
    "content_format" "text" DEFAULT 'markdown'::"text" NOT NULL,
    "imported_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    CONSTRAINT "hanzihome_lesson_texts_content_format_check" CHECK (("content_format" = ANY (ARRAY['markdown'::"text", 'plain'::"text"]))),
    CONSTRAINT "hanzihome_lesson_texts_source_check" CHECK (("source" = ANY (ARRAY['seed'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."hanzihome_lesson_texts" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_lesson_texts" IS 'Lesson text blocks separated from lesson metadata so Bài khóa can become editable without rewriting lesson rows.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_lessons" (
    "id" "text" NOT NULL,
    "course_id" "text" NOT NULL,
    "book_id" "text" NOT NULL,
    "owner_id" "uuid",
    "source" "text" DEFAULT 'seed'::"text" NOT NULL,
    "lesson_number" integer NOT NULL,
    "lesson_order" integer NOT NULL,
    "title_zh" "text" NOT NULL,
    "title_vi" "text",
    "source_file" "text",
    "imported_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "title_pinyin" "text",
    "title_en" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    CONSTRAINT "hanzihome_lessons_source_check" CHECK (("source" = ANY (ARRAY['seed'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."hanzihome_lessons" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_lessons" IS 'Editable HanziHome lessons. Seed rows preserve stable lesson IDs from the legacy JSON import source.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_listening_audio" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lesson_id" "text" NOT NULL,
    "item_id" "text",
    "section_id" "uuid",
    "owner_id" "uuid",
    "source" "text" DEFAULT 'seed'::"text" NOT NULL,
    "publication_status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "audio_role" "text" DEFAULT 'source'::"text" NOT NULL,
    "storage_bucket" "text",
    "storage_path" "text",
    "external_url" "text",
    "duration_ms" integer,
    "mime_type" "text",
    "speaker" "text",
    "variant" "text",
    "transcript_zh" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "hanzihome_listening_audio_audio_role_check" CHECK (("audio_role" = ANY (ARRAY['source'::"text", 'prompt'::"text", 'option'::"text", 'shadowing'::"text", 'dictation'::"text"]))),
    CONSTRAINT "hanzihome_listening_audio_duration_ms_check" CHECK ((("duration_ms" IS NULL) OR ("duration_ms" >= 0))),
    CONSTRAINT "hanzihome_listening_audio_location_check" CHECK (((("storage_bucket" IS NOT NULL) AND ("storage_path" IS NOT NULL)) OR ("external_url" IS NOT NULL))),
    CONSTRAINT "hanzihome_listening_audio_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "hanzihome_listening_audio_publication_status_check" CHECK (("publication_status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"]))),
    CONSTRAINT "hanzihome_listening_audio_source_check" CHECK (("source" = ANY (ARRAY['seed'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."hanzihome_listening_audio" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hanzihome_listening_items" (
    "id" "text" NOT NULL,
    "lesson_id" "text" NOT NULL,
    "section_id" "uuid",
    "owner_id" "uuid",
    "source" "text" DEFAULT 'seed'::"text" NOT NULL,
    "publication_status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "source_item_key" "text" NOT NULL,
    "item_order" integer NOT NULL,
    "category" "text" NOT NULL,
    "item_type" "text" NOT NULL,
    "section_title" "text",
    "transcript_zh" "text",
    "prompt_zh" "text",
    "translation_vi" "text",
    "options" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "answer" "jsonb",
    "explanation_vi" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "quality_status" "text" DEFAULT 'needs_review'::"text" NOT NULL,
    "quality_issues" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "check_needed" boolean DEFAULT true NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "source_file" "text",
    "imported_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "transcript" "jsonb",
    CONSTRAINT "hanzihome_listening_items_answer_check" CHECK ((("answer" IS NULL) OR ("jsonb_typeof"("answer") = 'object'::"text"))),
    CONSTRAINT "hanzihome_listening_items_category_check" CHECK (("category" = ANY (ARRAY['listening_comprehension'::"text", 'pronunciation'::"text", 'extra_practice'::"text"]))),
    CONSTRAINT "hanzihome_listening_items_content_check" CHECK ((("transcript_zh" IS NOT NULL) OR ("prompt_zh" IS NOT NULL) OR ("jsonb_array_length"("options") > 0))),
    CONSTRAINT "hanzihome_listening_items_item_order_check" CHECK (("item_order" > 0)),
    CONSTRAINT "hanzihome_listening_items_item_type_check" CHECK (("item_type" = ANY (ARRAY['sentence_mcq'::"text", 'dialogue_mcq'::"text", 'passage_mcq'::"text", 'stress_choice'::"text", 'true_false'::"text", 'matching'::"text", 'fill_blank'::"text", 'open_answer'::"text", 'oral_response'::"text", 'shadowing'::"text", 'dictation'::"text"]))),
    CONSTRAINT "hanzihome_listening_items_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "hanzihome_listening_items_options_check" CHECK (("jsonb_typeof"("options") = 'array'::"text")),
    CONSTRAINT "hanzihome_listening_items_publication_status_check" CHECK (("publication_status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"]))),
    CONSTRAINT "hanzihome_listening_items_quality_status_check" CHECK (("quality_status" = ANY (ARRAY['verified'::"text", 'verified_structure'::"text", 'extracted'::"text", 'needs_review'::"text", 'missing_source'::"text"]))),
    CONSTRAINT "hanzihome_listening_items_source_check" CHECK (("source" = ANY (ARRAY['seed'::"text", 'custom'::"text"]))),
    CONSTRAINT "hanzihome_listening_items_transcript_check" CHECK ((("transcript" IS NULL) OR ("jsonb_typeof"("transcript") = 'object'::"text")))
);


ALTER TABLE "public"."hanzihome_listening_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_listening_items" IS 'Listening exercise rows queried by lesson_id. Clients select explicit columns and never fetch the full course dataset.';



COMMENT ON COLUMN "public"."hanzihome_listening_items"."transcript" IS 'Canonical structured transcript: mode, speakers, ordered zh/pinyin/vi lines, and full text for native Mandarin TTS.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_memory_tips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "scope" "text" DEFAULT 'user'::"text" NOT NULL,
    "tip_type" "text" DEFAULT 'custom'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "formula" "text",
    "example_zh" "text",
    "example_pinyin" "text",
    "example_vi" "text",
    "source_type" "text" DEFAULT 'custom'::"text" NOT NULL,
    "source_lesson_id" "text",
    "source_item_id" "text",
    "source_label" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "weight" integer DEFAULT 1 NOT NULL,
    "is_pinned" boolean DEFAULT false NOT NULL,
    "is_archived" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hanzihome_memory_tips_body_check" CHECK (("char_length"(TRIM(BOTH FROM "body")) > 0)),
    CONSTRAINT "hanzihome_memory_tips_owner_scope_check" CHECK (((("scope" = 'system'::"text") AND ("owner_id" IS NULL)) OR (("scope" = 'user'::"text") AND ("owner_id" IS NOT NULL)))),
    CONSTRAINT "hanzihome_memory_tips_scope_check" CHECK (("scope" = ANY (ARRAY['system'::"text", 'user'::"text"]))),
    CONSTRAINT "hanzihome_memory_tips_source_type_check" CHECK (("source_type" = ANY (ARRAY['grammar'::"text", 'vocab'::"text", 'lesson'::"text", 'custom'::"text", 'system'::"text"]))),
    CONSTRAINT "hanzihome_memory_tips_tip_type_check" CHECK (("tip_type" = ANY (ARRAY['grammar'::"text", 'vocab'::"text", 'formula'::"text", 'custom'::"text"]))),
    CONSTRAINT "hanzihome_memory_tips_title_check" CHECK (("char_length"(TRIM(BOTH FROM "title")) > 0)),
    CONSTRAINT "hanzihome_memory_tips_weight_check" CHECK ((("weight" >= 1) AND ("weight" <= 10)))
);


ALTER TABLE "public"."hanzihome_memory_tips" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hanzihome_practice_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "surface" "text" NOT NULL,
    "content_id" "text" NOT NULL,
    "direction" "text",
    "answer" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "score" numeric(5,4),
    "response_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hanzihome_practice_attempts_answer_check" CHECK (("jsonb_typeof"("answer") = 'object'::"text")),
    CONSTRAINT "hanzihome_practice_attempts_response_ms_check" CHECK ((("response_ms" IS NULL) OR ("response_ms" >= 0))),
    CONSTRAINT "hanzihome_practice_attempts_score_check" CHECK ((("score" IS NULL) OR (("score" >= (0)::numeric) AND ("score" <= (1)::numeric)))),
    CONSTRAINT "hanzihome_practice_attempts_surface_check" CHECK (("surface" = ANY (ARRAY['reader'::"text", 'dictation'::"text", 'translation'::"text", 'listening'::"text", 'personal-learning'::"text", 'shadowing'::"text", 'review'::"text"])))
);


ALTER TABLE "public"."hanzihome_practice_attempts" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_practice_attempts" IS 'Append-only HanziHome practice/review attempt evidence. Current mastery and review scheduling are owned by separate state records.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_radicals" (
    "id" "text" NOT NULL,
    "owner_id" "uuid",
    "source" "text" DEFAULT 'seed'::"text" NOT NULL,
    "radical_index" integer NOT NULL,
    "radical" "text" NOT NULL,
    "name_vi" "text",
    "strokes" integer,
    "core_meaning" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "variants" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "related_components" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "recognition" "text",
    "distinguish" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "groups" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "imported_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hanzihome_radicals_core_meaning_object_check" CHECK (("jsonb_typeof"("core_meaning") = 'object'::"text")),
    CONSTRAINT "hanzihome_radicals_groups_array_check" CHECK (("jsonb_typeof"("groups") = 'array'::"text")),
    CONSTRAINT "hanzihome_radicals_owner_source_check" CHECK (((("source" = 'seed'::"text") AND ("owner_id" IS NULL)) OR (("source" = 'custom'::"text") AND ("owner_id" IS NOT NULL)))),
    CONSTRAINT "hanzihome_radicals_related_components_array_check" CHECK (("jsonb_typeof"("related_components") = 'array'::"text")),
    CONSTRAINT "hanzihome_radicals_source_check" CHECK (("source" = ANY (ARRAY['seed'::"text", 'custom'::"text"]))),
    CONSTRAINT "hanzihome_radicals_strokes_check" CHECK ((("strokes" IS NULL) OR ("strokes" > 0))),
    CONSTRAINT "hanzihome_radicals_variants_array_check" CHECK (("jsonb_typeof"("variants") = 'array'::"text"))
);


ALTER TABLE "public"."hanzihome_radicals" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_radicals" IS 'Standalone HanziHome radical catalog. Seed rows are imported from data/hanzihome-db/radicals.json and read through the catalog endpoint.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_tts_clips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "folder_id" "uuid",
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "text" "text" NOT NULL,
    "voice" "text" NOT NULL,
    "rate" numeric(4,2) NOT NULL,
    "cache_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revision" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "hanzihome_tts_clips_cache_key_check" CHECK (("length"("btrim"("cache_key")) > 0)),
    CONSTRAINT "hanzihome_tts_clips_rate_check" CHECK ((("rate" > (0)::numeric) AND ("rate" <= (3)::numeric))),
    CONSTRAINT "hanzihome_tts_clips_revision_check" CHECK (("revision" >= 0)),
    CONSTRAINT "hanzihome_tts_clips_text_check" CHECK (("length"("btrim"("text")) > 0)),
    CONSTRAINT "hanzihome_tts_clips_voice_check" CHECK (("length"("btrim"("voice")) > 0))
);


ALTER TABLE "public"."hanzihome_tts_clips" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hanzihome_tts_folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revision" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "hanzihome_tts_folders_name_check" CHECK (("length"("btrim"("name")) > 0)),
    CONSTRAINT "hanzihome_tts_folders_revision_check" CHECK (("revision" >= 0))
);


ALTER TABLE "public"."hanzihome_tts_folders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hanzihome_vocab_detail_sections" (
    "id" "text" NOT NULL,
    "vocab_item_id" "text" NOT NULL,
    "lesson_id" "text" NOT NULL,
    "owner_id" "uuid",
    "source" "text" DEFAULT 'seed'::"text" NOT NULL,
    "section_key" "text" NOT NULL,
    "title" "text" NOT NULL,
    "lines" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "section_order" integer NOT NULL,
    "imported_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    CONSTRAINT "hanzihome_vocab_detail_sections_source_check" CHECK (("source" = ANY (ARRAY['seed'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."hanzihome_vocab_detail_sections" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_vocab_detail_sections" IS 'Vocabulary detail sections with stable section keys and ordered text lines.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_vocab_examples" (
    "id" "text" NOT NULL,
    "vocab_item_id" "text" NOT NULL,
    "lesson_id" "text" NOT NULL,
    "owner_id" "uuid",
    "source" "text" DEFAULT 'seed'::"text" NOT NULL,
    "example_order" integer NOT NULL,
    "zh" "text" NOT NULL,
    "pinyin" "text",
    "vi" "text",
    "note" "text",
    "imported_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    CONSTRAINT "hanzihome_vocab_examples_source_check" CHECK (("source" = ANY (ARRAY['seed'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."hanzihome_vocab_examples" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_vocab_examples" IS 'Vocabulary examples normalized from raw example sections for queryable editing.';



CREATE TABLE IF NOT EXISTS "public"."hanzihome_vocab_items" (
    "id" "text" NOT NULL,
    "lesson_id" "text" NOT NULL,
    "course_id" "text" NOT NULL,
    "book_id" "text" NOT NULL,
    "owner_id" "uuid",
    "source" "text" DEFAULT 'seed'::"text" NOT NULL,
    "item_order" integer NOT NULL,
    "word" "text" NOT NULL,
    "pinyin" "text" NOT NULL,
    "han_viet" "text" NOT NULL,
    "meaning" "text" NOT NULL,
    "category" "text" DEFAULT 'Từ vựng'::"text" NOT NULL,
    "level" "text",
    "pos_vi" "text",
    "pos_zh" "text",
    "tone" "text",
    "source_file" "text",
    "imported_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "meaning_en" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    CONSTRAINT "hanzihome_vocab_items_source_check" CHECK (("source" = ANY (ARRAY['seed'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."hanzihome_vocab_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."hanzihome_vocab_items" IS 'Editable vocabulary items imported from legacy static JSON with stable IDs and lesson/course/book relationships.';



CREATE TABLE IF NOT EXISTS "public"."lesson_note_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "note_id" "uuid" NOT NULL,
    "target_type" "text" NOT NULL,
    "target_key" "text" NOT NULL,
    "relation_type" "text" DEFAULT 'main'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "lesson_note_links_relation_type_check" CHECK (("relation_type" = ANY (ARRAY['main'::"text", 'lesson_text'::"text", 'vocab'::"text", 'grammar'::"text", 'annotation'::"text"]))),
    CONSTRAINT "lesson_note_links_target_type_check" CHECK (("target_type" = 'hanzihome_lesson'::"text"))
);


ALTER TABLE "public"."lesson_note_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lesson_text_annotations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "lesson_id" "text" NOT NULL,
    "node_type" "text" NOT NULL,
    "node_id" "text" NOT NULL,
    "start_offset" integer NOT NULL,
    "end_offset" integer NOT NULL,
    "selected_text" "text" NOT NULL,
    "prefix_text" "text" DEFAULT ''::"text" NOT NULL,
    "suffix_text" "text" DEFAULT ''::"text" NOT NULL,
    "tone" "text" DEFAULT 'focus'::"text" NOT NULL,
    "note_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "lesson_text_annotations_check" CHECK (("end_offset" > "start_offset")),
    CONSTRAINT "lesson_text_annotations_selected_text_check" CHECK (("length"("btrim"("selected_text")) > 0)),
    CONSTRAINT "lesson_text_annotations_start_offset_check" CHECK (("start_offset" >= 0)),
    CONSTRAINT "lesson_text_annotations_tone_check" CHECK (("tone" = 'focus'::"text"))
);


ALTER TABLE "public"."lesson_text_annotations" OWNER TO "postgres";


COMMENT ON TABLE "public"."lesson_text_annotations" IS 'User-owned highlights anchored to stable HanziHome lesson text nodes; accessed through the authenticated HanziHome BFF.';



CREATE TABLE IF NOT EXISTS "public"."note_folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "name" "text" NOT NULL,
    "color" "text" DEFAULT 'purple'::"text" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "note_folders_color_check" CHECK (("color" = ANY (ARRAY['purple'::"text", 'blue'::"text", 'green'::"text", 'orange'::"text", 'rose'::"text", 'slate'::"text"]))),
    CONSTRAINT "note_folders_name_check" CHECK ((("char_length"(TRIM(BOTH FROM "name")) >= 1) AND ("char_length"(TRIM(BOTH FROM "name")) <= 80))),
    CONSTRAINT "note_folders_parent_not_self" CHECK ((("parent_id" IS NULL) OR ("parent_id" <> "id"))),
    CONSTRAINT "note_folders_position_check" CHECK (("position" >= 0))
);


ALTER TABLE "public"."note_folders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" DEFAULT 'Untitled'::"text",
    "content" "jsonb" DEFAULT '{}'::"jsonb",
    "tags" "text"[],
    "linked_lesson_id" "uuid",
    "is_published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category" "text" DEFAULT 'general'::"text",
    "status" "text" DEFAULT 'draft'::"text",
    "short_id" "text",
    "reading_content" "jsonb",
    "split_view_enabled" boolean DEFAULT false,
    "folder_id" "uuid",
    "reading_status" "text",
    "source_url" "text",
    "source_host" "text",
    "source_label" "text",
    "source_author" "text",
    "source_published_at" "date",
    "source_captured_at" timestamp with time zone,
    CONSTRAINT "notes_category_check" CHECK (("category" = ANY (ARRAY['grammar'::"text", 'vocabulary'::"text", 'culture'::"text", 'general'::"text"]))),
    CONSTRAINT "notes_reading_status_check" CHECK ((("reading_status" IS NULL) OR ("reading_status" = ANY (ARRAY['inbox'::"text", 'reading'::"text", 'completed'::"text"])))),
    CONSTRAINT "notes_source_url_check" CHECK ((("source_url" IS NULL) OR ("source_url" ~* '^https?://'::"text"))),
    CONSTRAINT "notes_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'reviewed'::"text", 'mastered'::"text"])))
);


ALTER TABLE "public"."notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_ai_prompt_settings" (
    "user_id" "uuid" NOT NULL,
    "word_lookup_prompt" "text" NOT NULL,
    "sentence_lookup_prompt" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "gemini_model" "text" DEFAULT 'models/gemini-2.5-flash'::"text" NOT NULL,
    "deepseek_api_key_encrypted" "text",
    "deepseek_enabled" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."user_ai_prompt_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_api_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "label" "text" NOT NULL,
    "masked_key" "text" NOT NULL,
    "encrypted_key" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "priority" integer DEFAULT 1 NOT NULL,
    "default_model" "text",
    "last_validated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_api_keys_provider_check" CHECK (("provider" = ANY (ARRAY['deepseek'::"text", 'gemini'::"text", 'openai'::"text", 'groq'::"text"])))
);


ALTER TABLE "public"."user_api_keys" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_api_keys" IS 'User-managed AI provider API keys with provider-aware failover order.';



CREATE TABLE IF NOT EXISTS "public"."user_learning_state" (
    "user_id" "uuid" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "progress" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "bookmarks" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "review_history" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_learning_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_vocab_progress" (
    "user_id" "uuid" NOT NULL,
    "vocab_id" "uuid" NOT NULL,
    "proficiency_level" integer DEFAULT 0,
    "next_review_at" timestamp with time zone,
    "is_favorited" boolean DEFAULT false,
    "dictionary_id" "uuid",
    "personal_note" "text",
    "personal_note_mode" "text" DEFAULT 'important'::"text",
    "context_sentence" "text",
    "context_translation" "text",
    CONSTRAINT "user_vocab_progress_personal_note_mode_check" CHECK (("personal_note_mode" = ANY (ARRAY['normal'::"text", 'important'::"text"])))
);


ALTER TABLE "public"."user_vocab_progress" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_vocab_progress" IS 'User-specific SRS/progress rows for saved vocabulary. Kept because the app still references this flow.';



CREATE TABLE IF NOT EXISTS "public"."user_vocabularies" (
    "user_id" "uuid" NOT NULL,
    "dictionary_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_vocabularies" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_vocabularies" IS 'User saved vocabulary join table backed by dictionary_core. Not part of HanziHome lesson seed.';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "display_name" "text",
    "avatar_url" "text",
    "role" "text" DEFAULT 'user'::"text",
    "subscription_tier" "text" DEFAULT 'free'::"text",
    "ai_credits" integer DEFAULT 10,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'admin'::"text"]))),
    CONSTRAINT "users_subscription_tier_check" CHECK (("subscription_tier" = ANY (ARRAY['free'::"text", 'pro'::"text", 'lifetime'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vocabularies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "hanzi" "text" NOT NULL,
    "pinyin" "text",
    "meaning" "text",
    "ai_analysis" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "sino_vietnamese" "text",
    "analysis" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."vocabularies" OWNER TO "postgres";


COMMENT ON TABLE "public"."vocabularies" IS 'Legacy vocabulary cache kept for dictionary/SRS flows still referenced by the app. Empty before HanziHome JSON seed.';



ALTER TABLE ONLY "public"."ai_characters"
    ADD CONSTRAINT "ai_characters_id_user_unique" UNIQUE ("id", "user_id");



ALTER TABLE ONLY "public"."ai_characters"
    ADD CONSTRAINT "ai_characters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_conversation_preferences"
    ADD CONSTRAINT "ai_conversation_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_id_user_unique" UNIQUE ("id", "user_id");



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_memories"
    ADD CONSTRAINT "ai_memories_id_user_unique" UNIQUE ("id", "user_id");



ALTER TABLE ONLY "public"."ai_memories"
    ADD CONSTRAINT "ai_memories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_memory_evidence"
    ADD CONSTRAINT "ai_memory_evidence_pkey" PRIMARY KEY ("memory_id", "message_id", "action");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_conversation_seq_unique" UNIQUE ("conversation_id", "seq");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_id_conversation_user_unique" UNIQUE ("id", "conversation_id", "user_id");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_id_user_unique" UNIQUE ("id", "user_id");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_post_turn_jobs"
    ADD CONSTRAINT "ai_post_turn_jobs_assistant_message_unique" UNIQUE ("assistant_message_id");



ALTER TABLE ONLY "public"."ai_post_turn_jobs"
    ADD CONSTRAINT "ai_post_turn_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_relationship_states"
    ADD CONSTRAINT "ai_relationship_states_pkey" PRIMARY KEY ("user_id", "character_id");



ALTER TABLE ONLY "public"."dictionary_core"
    ADD CONSTRAINT "dictionary_core_lookup_key_key" UNIQUE ("lookup_key");



ALTER TABLE ONLY "public"."dictionary_core"
    ADD CONSTRAINT "dictionary_core_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_content_audit_log"
    ADD CONSTRAINT "hanzihome_content_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_content_editors"
    ADD CONSTRAINT "hanzihome_content_editors_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."hanzihome_content_roles"
    ADD CONSTRAINT "hanzihome_content_roles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."hanzihome_course_books"
    ADD CONSTRAINT "hanzihome_course_books_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_courses"
    ADD CONSTRAINT "hanzihome_courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_daily_reading_state"
    ADD CONSTRAINT "hanzihome_daily_reading_state_pkey" PRIMARY KEY ("user_id", "published_date");



ALTER TABLE ONLY "public"."hanzihome_grammar_detail_sections"
    ADD CONSTRAINT "hanzihome_grammar_detail_secti_grammar_point_id_section_key_key" UNIQUE ("grammar_point_id", "section_key");



ALTER TABLE ONLY "public"."hanzihome_grammar_detail_sections"
    ADD CONSTRAINT "hanzihome_grammar_detail_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_grammar_examples"
    ADD CONSTRAINT "hanzihome_grammar_examples_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_grammar_points"
    ADD CONSTRAINT "hanzihome_grammar_points_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_html_artifact_folders"
    ADD CONSTRAINT "hanzihome_html_artifact_folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_html_artifact_runtime_states"
    ADD CONSTRAINT "hanzihome_html_artifact_runtime_states_owner_id_artifact_id_key" UNIQUE ("owner_id", "artifact_id");



ALTER TABLE ONLY "public"."hanzihome_html_artifact_runtime_states"
    ADD CONSTRAINT "hanzihome_html_artifact_runtime_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_html_artifacts"
    ADD CONSTRAINT "hanzihome_html_artifacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_learning_loop_items"
    ADD CONSTRAINT "hanzihome_learning_loop_items_pkey" PRIMARY KEY ("user_id", "id");



ALTER TABLE ONLY "public"."hanzihome_learning_loop_items"
    ADD CONSTRAINT "hanzihome_learning_loop_items_user_id_stable_key_key" UNIQUE ("user_id", "stable_key");



ALTER TABLE ONLY "public"."hanzihome_lesson_sections"
    ADD CONSTRAINT "hanzihome_lesson_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_lesson_texts"
    ADD CONSTRAINT "hanzihome_lesson_texts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_lessons"
    ADD CONSTRAINT "hanzihome_lessons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_listening_audio"
    ADD CONSTRAINT "hanzihome_listening_audio_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_listening_items"
    ADD CONSTRAINT "hanzihome_listening_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_listening_items"
    ADD CONSTRAINT "hanzihome_listening_items_source_key_unique" UNIQUE ("lesson_id", "source_item_key");



ALTER TABLE ONLY "public"."hanzihome_memory_tips"
    ADD CONSTRAINT "hanzihome_memory_tips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_pdf_annotations"
    ADD CONSTRAINT "hanzihome_pdf_annotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_pdf_annotations"
    ADD CONSTRAINT "hanzihome_pdf_annotations_user_id_asset_id_page_number_key" UNIQUE ("user_id", "asset_id", "page_number");



ALTER TABLE ONLY "public"."hanzihome_personal_learning_state"
    ADD CONSTRAINT "hanzihome_personal_learning_state_pkey" PRIMARY KEY ("user_id", "node_id");



ALTER TABLE ONLY "public"."hanzihome_practice_attempts"
    ADD CONSTRAINT "hanzihome_practice_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_radicals"
    ADD CONSTRAINT "hanzihome_radicals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_reader_annotations"
    ADD CONSTRAINT "hanzihome_reader_annotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_reader_progress"
    ADD CONSTRAINT "hanzihome_reader_progress_pkey" PRIMARY KEY ("user_id", "document_id");



ALTER TABLE ONLY "public"."hanzihome_reader_pronunciation_overrides"
    ADD CONSTRAINT "hanzihome_reader_pronunciation_overrides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_tts_clips"
    ADD CONSTRAINT "hanzihome_tts_clips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_tts_clips"
    ADD CONSTRAINT "hanzihome_tts_clips_user_id_cache_key_key" UNIQUE ("user_id", "cache_key");



ALTER TABLE ONLY "public"."hanzihome_tts_folders"
    ADD CONSTRAINT "hanzihome_tts_folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_tts_folders"
    ADD CONSTRAINT "hanzihome_tts_folders_user_id_name_key" UNIQUE ("user_id", "name");



ALTER TABLE ONLY "public"."hanzihome_vocab_detail_sections"
    ADD CONSTRAINT "hanzihome_vocab_detail_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_vocab_examples"
    ADD CONSTRAINT "hanzihome_vocab_examples_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hanzihome_vocab_items"
    ADD CONSTRAINT "hanzihome_vocab_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_note_links"
    ADD CONSTRAINT "lesson_note_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_text_annotations"
    ADD CONSTRAINT "lesson_text_annotations_note_id_key" UNIQUE ("note_id");



ALTER TABLE ONLY "public"."lesson_text_annotations"
    ADD CONSTRAINT "lesson_text_annotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_text_annotations"
    ADD CONSTRAINT "lesson_text_annotations_user_id_lesson_id_node_type_node_id_key" UNIQUE ("user_id", "lesson_id", "node_type", "node_id", "start_offset", "end_offset");



ALTER TABLE ONLY "public"."note_folders"
    ADD CONSTRAINT "note_folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."note_folders"
    ADD CONSTRAINT "note_folders_user_id_id_unique" UNIQUE ("user_id", "id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_ai_prompt_settings"
    ADD CONSTRAINT "user_ai_prompt_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_api_keys"
    ADD CONSTRAINT "user_api_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_learning_state"
    ADD CONSTRAINT "user_learning_state_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_vocab_progress"
    ADD CONSTRAINT "user_vocab_progress_pkey" PRIMARY KEY ("user_id", "vocab_id");



ALTER TABLE ONLY "public"."user_vocabularies"
    ADD CONSTRAINT "user_vocabularies_pkey" PRIMARY KEY ("user_id", "dictionary_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vocabularies"
    ADD CONSTRAINT "vocabularies_hanzi_key" UNIQUE ("hanzi");



ALTER TABLE ONLY "public"."vocabularies"
    ADD CONSTRAINT "vocabularies_pkey" PRIMARY KEY ("id");



CREATE INDEX "ai_characters_user_archive_updated_idx" ON "public"."ai_characters" USING "btree" ("user_id", "archived_at", "updated_at" DESC);



CREATE INDEX "ai_conversation_preferences_default_character_idx" ON "public"."ai_conversation_preferences" USING "btree" ("default_character_id", "user_id") WHERE ("default_character_id" IS NOT NULL);



CREATE INDEX "ai_conversations_user_archive_updated_idx" ON "public"."ai_conversations" USING "btree" ("user_id", "archived_at", "updated_at" DESC);



CREATE INDEX "ai_conversations_user_character_last_message_idx" ON "public"."ai_conversations" USING "btree" ("user_id", "character_id", "last_message_at" DESC);



CREATE UNIQUE INDEX "ai_memories_active_character_key_unique_idx" ON "public"."ai_memories" USING "btree" ("user_id", "character_id", "memory_key") WHERE (("character_id" IS NOT NULL) AND ("memory_key" IS NOT NULL) AND ("status" = 'active'::"text"));



CREATE UNIQUE INDEX "ai_memories_active_global_key_unique_idx" ON "public"."ai_memories" USING "btree" ("user_id", "memory_key") WHERE (("character_id" IS NULL) AND ("memory_key" IS NOT NULL) AND ("status" = 'active'::"text"));



CREATE INDEX "ai_memories_user_character_status_updated_idx" ON "public"."ai_memories" USING "btree" ("user_id", "character_id", "status", "updated_at" DESC);



CREATE INDEX "ai_memories_user_kind_status_idx" ON "public"."ai_memories" USING "btree" ("user_id", "kind", "status");



CREATE INDEX "ai_memories_user_status_updated_idx" ON "public"."ai_memories" USING "btree" ("user_id", "status", "updated_at" DESC);



CREATE INDEX "ai_memory_evidence_message_user_idx" ON "public"."ai_memory_evidence" USING "btree" ("message_id", "user_id");



CREATE UNIQUE INDEX "ai_messages_assistant_reply_unique_idx" ON "public"."ai_messages" USING "btree" ("reply_to_message_id") WHERE (("role" = 'assistant'::"text") AND ("reply_to_message_id" IS NOT NULL));



CREATE UNIQUE INDEX "ai_messages_client_message_unique_idx" ON "public"."ai_messages" USING "btree" ("conversation_id", "client_message_id") WHERE ("client_message_id" IS NOT NULL);



CREATE INDEX "ai_post_turn_jobs_ready_idx" ON "public"."ai_post_turn_jobs" USING "btree" ("status", "available_at", "created_at") WHERE ("status" = ANY (ARRAY['pending'::"text", 'retry'::"text"]));



CREATE INDEX "hanzihome_content_audit_actor_idx" ON "public"."hanzihome_content_audit_log" USING "btree" ("actor_id", "created_at" DESC);



CREATE INDEX "hanzihome_content_audit_entity_idx" ON "public"."hanzihome_content_audit_log" USING "btree" ("entity_type", "entity_id", "created_at" DESC);



CREATE INDEX "hanzihome_course_books_active_idx" ON "public"."hanzihome_course_books" USING "btree" ("deleted_at");



CREATE INDEX "hanzihome_course_books_course_id_idx" ON "public"."hanzihome_course_books" USING "btree" ("course_id");



CREATE INDEX "hanzihome_course_books_course_order_idx" ON "public"."hanzihome_course_books" USING "btree" ("course_id", "book_order");



CREATE UNIQUE INDEX "hanzihome_course_books_seed_course_order_unique_idx" ON "public"."hanzihome_course_books" USING "btree" ("course_id", "book_order") WHERE ("source" = 'seed'::"text");



CREATE UNIQUE INDEX "hanzihome_course_books_seed_course_title_unique_idx" ON "public"."hanzihome_course_books" USING "btree" ("course_id", "title") WHERE ("source" = 'seed'::"text");



CREATE INDEX "hanzihome_course_books_user_id_idx" ON "public"."hanzihome_course_books" USING "btree" ("user_id");



CREATE INDEX "hanzihome_courses_active_idx" ON "public"."hanzihome_courses" USING "btree" ("deleted_at");



CREATE UNIQUE INDEX "hanzihome_courses_seed_slug_unique_idx" ON "public"."hanzihome_courses" USING "btree" ("slug") WHERE ("source" = 'seed'::"text");



CREATE INDEX "hanzihome_courses_user_id_idx" ON "public"."hanzihome_courses" USING "btree" ("user_id");



CREATE INDEX "hanzihome_grammar_detail_sections_active_idx" ON "public"."hanzihome_grammar_detail_sections" USING "btree" ("deleted_at");



CREATE UNIQUE INDEX "hanzihome_grammar_detail_sections_active_key_idx" ON "public"."hanzihome_grammar_detail_sections" USING "btree" ("grammar_point_id", "section_key") WHERE ("deleted_at" IS NULL);



CREATE INDEX "hanzihome_grammar_detail_sections_lesson_id_idx" ON "public"."hanzihome_grammar_detail_sections" USING "btree" ("lesson_id");



CREATE INDEX "hanzihome_grammar_detail_sections_point_order_idx" ON "public"."hanzihome_grammar_detail_sections" USING "btree" ("grammar_point_id", "section_order");



CREATE INDEX "hanzihome_grammar_examples_active_idx" ON "public"."hanzihome_grammar_examples" USING "btree" ("deleted_at");



CREATE UNIQUE INDEX "hanzihome_grammar_examples_active_order_idx" ON "public"."hanzihome_grammar_examples" USING "btree" ("grammar_point_id", "example_order") WHERE ("deleted_at" IS NULL);



CREATE INDEX "hanzihome_grammar_examples_lesson_id_idx" ON "public"."hanzihome_grammar_examples" USING "btree" ("lesson_id");



CREATE INDEX "hanzihome_grammar_examples_point_order_idx" ON "public"."hanzihome_grammar_examples" USING "btree" ("grammar_point_id", "example_order");



CREATE INDEX "hanzihome_grammar_points_active_idx" ON "public"."hanzihome_grammar_points" USING "btree" ("deleted_at");



CREATE UNIQUE INDEX "hanzihome_grammar_points_active_title_idx" ON "public"."hanzihome_grammar_points" USING "btree" ("lesson_id", "title") WHERE ("deleted_at" IS NULL);



CREATE INDEX "hanzihome_grammar_points_book_id_idx" ON "public"."hanzihome_grammar_points" USING "btree" ("book_id");



CREATE INDEX "hanzihome_grammar_points_course_id_idx" ON "public"."hanzihome_grammar_points" USING "btree" ("course_id");



CREATE INDEX "hanzihome_grammar_points_lesson_order_idx" ON "public"."hanzihome_grammar_points" USING "btree" ("lesson_id", "point_order");



CREATE INDEX "hanzihome_grammar_points_lookup_idx" ON "public"."hanzihome_grammar_points" USING "btree" ("clean_title");



CREATE UNIQUE INDEX "hanzihome_html_artifact_folders_owner_id_unique_idx" ON "public"."hanzihome_html_artifact_folders" USING "btree" ("owner_id", "id");



CREATE INDEX "hanzihome_html_artifact_folders_owner_parent_position_idx" ON "public"."hanzihome_html_artifact_folders" USING "btree" ("owner_id", "parent_folder_id", "position", "updated_at" DESC);



CREATE INDEX "hanzihome_html_artifact_folders_owner_position_idx" ON "public"."hanzihome_html_artifact_folders" USING "btree" ("owner_id", "position", "updated_at" DESC);



CREATE INDEX "hanzihome_html_artifact_runtime_states_owner_updated_idx" ON "public"."hanzihome_html_artifact_runtime_states" USING "btree" ("owner_id", "updated_at" DESC);



CREATE INDEX "hanzihome_html_artifacts_owner_folder_updated_idx" ON "public"."hanzihome_html_artifacts" USING "btree" ("owner_id", "folder_id", "updated_at" DESC);



CREATE UNIQUE INDEX "hanzihome_html_artifacts_owner_id_unique_idx" ON "public"."hanzihome_html_artifacts" USING "btree" ("owner_id", "id");



CREATE INDEX "hanzihome_html_artifacts_owner_type_idx" ON "public"."hanzihome_html_artifacts" USING "btree" ("owner_id", "artifact_type", "updated_at" DESC);



CREATE INDEX "hanzihome_html_artifacts_owner_updated_idx" ON "public"."hanzihome_html_artifacts" USING "btree" ("owner_id", "updated_at" DESC);



CREATE INDEX "hanzihome_learning_loop_due_idx" ON "public"."hanzihome_learning_loop_items" USING "btree" ("user_id", "due_at", "state");



CREATE INDEX "hanzihome_lesson_sections_active_idx" ON "public"."hanzihome_lesson_sections" USING "btree" ("deleted_at");



CREATE UNIQUE INDEX "hanzihome_lesson_sections_active_key_idx" ON "public"."hanzihome_lesson_sections" USING "btree" ("lesson_id", "section_key") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "hanzihome_lesson_sections_active_order_idx" ON "public"."hanzihome_lesson_sections" USING "btree" ("lesson_id", "section_order") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "hanzihome_lesson_sections_active_source_idx" ON "public"."hanzihome_lesson_sections" USING "btree" ("lesson_id", "source_section_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "hanzihome_lesson_sections_lesson_order_idx" ON "public"."hanzihome_lesson_sections" USING "btree" ("lesson_id", "section_order");



CREATE INDEX "hanzihome_lesson_sections_owner_idx" ON "public"."hanzihome_lesson_sections" USING "btree" ("owner_id") WHERE ("owner_id" IS NOT NULL);



CREATE INDEX "hanzihome_lesson_sections_source_lesson_idx" ON "public"."hanzihome_lesson_sections" USING "btree" ("source", "lesson_id");



CREATE INDEX "hanzihome_lesson_sections_type_idx" ON "public"."hanzihome_lesson_sections" USING "btree" ("section_type");



CREATE INDEX "hanzihome_lesson_texts_active_idx" ON "public"."hanzihome_lesson_texts" USING "btree" ("deleted_at");



CREATE UNIQUE INDEX "hanzihome_lesson_texts_active_key_idx" ON "public"."hanzihome_lesson_texts" USING "btree" ("lesson_id", "text_key") WHERE ("deleted_at" IS NULL);



CREATE INDEX "hanzihome_lesson_texts_lesson_key_idx" ON "public"."hanzihome_lesson_texts" USING "btree" ("lesson_id", "text_key");



CREATE INDEX "hanzihome_lessons_active_idx" ON "public"."hanzihome_lessons" USING "btree" ("deleted_at");



CREATE UNIQUE INDEX "hanzihome_lessons_active_number_idx" ON "public"."hanzihome_lessons" USING "btree" ("course_id", "book_id", "lesson_number") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "hanzihome_lessons_active_order_idx" ON "public"."hanzihome_lessons" USING "btree" ("course_id", "book_id", "lesson_order") WHERE ("deleted_at" IS NULL);



CREATE INDEX "hanzihome_lessons_course_book_order_idx" ON "public"."hanzihome_lessons" USING "btree" ("course_id", "book_id", "lesson_order");



CREATE INDEX "hanzihome_listening_audio_item_idx" ON "public"."hanzihome_listening_audio" USING "btree" ("item_id", "audio_role") WHERE ("deleted_at" IS NULL);



CREATE INDEX "hanzihome_listening_audio_lesson_idx" ON "public"."hanzihome_listening_audio" USING "btree" ("lesson_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "hanzihome_listening_audio_owner_idx" ON "public"."hanzihome_listening_audio" USING "btree" ("owner_id") WHERE ("owner_id" IS NOT NULL);



CREATE INDEX "hanzihome_listening_audio_section_idx" ON "public"."hanzihome_listening_audio" USING "btree" ("section_id") WHERE ("section_id" IS NOT NULL);



CREATE UNIQUE INDEX "hanzihome_listening_audio_storage_unique_idx" ON "public"."hanzihome_listening_audio" USING "btree" ("storage_bucket", "storage_path") WHERE (("storage_bucket" IS NOT NULL) AND ("storage_path" IS NOT NULL) AND ("deleted_at" IS NULL));



CREATE INDEX "hanzihome_listening_items_deleted_by_idx" ON "public"."hanzihome_listening_items" USING "btree" ("deleted_by") WHERE ("deleted_by" IS NOT NULL);



CREATE INDEX "hanzihome_listening_items_filter_idx" ON "public"."hanzihome_listening_items" USING "btree" ("publication_status", "category", "item_type") WHERE ("deleted_at" IS NULL);



CREATE INDEX "hanzihome_listening_items_lesson_category_type_order_idx" ON "public"."hanzihome_listening_items" USING "btree" ("lesson_id", "category", "item_type", "item_order") WHERE (("deleted_at" IS NULL) AND ("publication_status" = 'published'::"text"));



CREATE INDEX "hanzihome_listening_items_lesson_order_idx" ON "public"."hanzihome_listening_items" USING "btree" ("lesson_id", "item_order") WHERE ("deleted_at" IS NULL);



CREATE INDEX "hanzihome_listening_items_lesson_section_order_idx" ON "public"."hanzihome_listening_items" USING "btree" ("lesson_id", "section_id", "item_order") WHERE (("deleted_at" IS NULL) AND ("publication_status" = 'published'::"text"));



CREATE INDEX "hanzihome_listening_items_lesson_type_order_idx" ON "public"."hanzihome_listening_items" USING "btree" ("lesson_id", "item_type", "item_order") WHERE (("deleted_at" IS NULL) AND ("publication_status" = 'published'::"text"));



CREATE INDEX "hanzihome_listening_items_metadata_gin_idx" ON "public"."hanzihome_listening_items" USING "gin" ("metadata");



CREATE INDEX "hanzihome_listening_items_options_gin_idx" ON "public"."hanzihome_listening_items" USING "gin" ("options");



CREATE INDEX "hanzihome_listening_items_owner_idx" ON "public"."hanzihome_listening_items" USING "btree" ("owner_id") WHERE ("owner_id" IS NOT NULL);



CREATE INDEX "hanzihome_listening_items_quality_idx" ON "public"."hanzihome_listening_items" USING "btree" ("quality_status", "check_needed") WHERE ("deleted_at" IS NULL);



CREATE INDEX "hanzihome_listening_items_section_idx" ON "public"."hanzihome_listening_items" USING "btree" ("section_id") WHERE ("section_id" IS NOT NULL);



CREATE UNIQUE INDEX "hanzihome_listening_items_section_order_unique_idx" ON "public"."hanzihome_listening_items" USING "btree" ("section_id", "item_order") WHERE (("deleted_at" IS NULL) AND ("section_id" IS NOT NULL));



CREATE INDEX "hanzihome_memory_tips_owner_active_idx" ON "public"."hanzihome_memory_tips" USING "btree" ("owner_id", "is_archived", "created_at" DESC);



CREATE INDEX "hanzihome_memory_tips_system_active_idx" ON "public"."hanzihome_memory_tips" USING "btree" ("scope", "is_archived", "created_at" DESC);



CREATE UNIQUE INDEX "hanzihome_memory_tips_unique_user_source_idx" ON "public"."hanzihome_memory_tips" USING "btree" ("owner_id", "source_type", "source_item_id") WHERE (("owner_id" IS NOT NULL) AND ("source_item_id" IS NOT NULL) AND ("is_archived" = false));



CREATE INDEX "hanzihome_pdf_annotations_asset_idx" ON "public"."hanzihome_pdf_annotations" USING "btree" ("user_id", "asset_id", "page_number");



CREATE INDEX "hanzihome_practice_attempts_user_content_idx" ON "public"."hanzihome_practice_attempts" USING "btree" ("user_id", "surface", "content_id", "created_at" DESC);



CREATE INDEX "hanzihome_radicals_active_idx" ON "public"."hanzihome_radicals" USING "btree" ("deleted_at");



CREATE UNIQUE INDEX "hanzihome_radicals_active_index_idx" ON "public"."hanzihome_radicals" USING "btree" ("radical_index") WHERE ("deleted_at" IS NULL);



CREATE INDEX "hanzihome_radicals_seed_radical_idx" ON "public"."hanzihome_radicals" USING "btree" ("radical") WHERE (("source" = 'seed'::"text") AND ("deleted_at" IS NULL));



CREATE INDEX "hanzihome_reader_annotations_document_idx" ON "public"."hanzihome_reader_annotations" USING "btree" ("user_id", "document_id", "paragraph_id", "updated_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "hanzihome_reader_annotations_range_idx" ON "public"."hanzihome_reader_annotations" USING "btree" ("user_id", "document_id", "paragraph_id", "asset_id", "annotation_type", "page_number", "start_offset", "end_offset") WHERE (("deleted_at" IS NULL) AND ("start_offset" IS NOT NULL) AND ("end_offset" IS NOT NULL));



CREATE UNIQUE INDEX "hanzihome_reader_pronunciation_overrides_instance_idx" ON "public"."hanzihome_reader_pronunciation_overrides" USING "btree" ("user_id", "document_id", "paragraph_id", "text", "scope", COALESCE("start_offset", '-1'::integer), COALESCE("end_offset", '-1'::integer));



CREATE INDEX "hanzihome_reader_pronunciation_overrides_lookup_idx" ON "public"."hanzihome_reader_pronunciation_overrides" USING "btree" ("user_id", "document_id", "paragraph_id", "updated_at" DESC);



CREATE INDEX "hanzihome_tts_clips_folder_idx" ON "public"."hanzihome_tts_clips" USING "btree" ("user_id", "folder_id", "created_at" DESC);



CREATE INDEX "hanzihome_vocab_detail_sections_active_idx" ON "public"."hanzihome_vocab_detail_sections" USING "btree" ("deleted_at");



CREATE UNIQUE INDEX "hanzihome_vocab_detail_sections_active_key_idx" ON "public"."hanzihome_vocab_detail_sections" USING "btree" ("vocab_item_id", "section_key") WHERE ("deleted_at" IS NULL);



CREATE INDEX "hanzihome_vocab_detail_sections_item_order_idx" ON "public"."hanzihome_vocab_detail_sections" USING "btree" ("vocab_item_id", "section_order");



CREATE INDEX "hanzihome_vocab_detail_sections_lesson_id_idx" ON "public"."hanzihome_vocab_detail_sections" USING "btree" ("lesson_id");



CREATE INDEX "hanzihome_vocab_examples_active_idx" ON "public"."hanzihome_vocab_examples" USING "btree" ("deleted_at");



CREATE UNIQUE INDEX "hanzihome_vocab_examples_active_order_idx" ON "public"."hanzihome_vocab_examples" USING "btree" ("vocab_item_id", "example_order") WHERE ("deleted_at" IS NULL);



CREATE INDEX "hanzihome_vocab_examples_item_order_idx" ON "public"."hanzihome_vocab_examples" USING "btree" ("vocab_item_id", "example_order");



CREATE INDEX "hanzihome_vocab_examples_lesson_id_idx" ON "public"."hanzihome_vocab_examples" USING "btree" ("lesson_id");



CREATE INDEX "hanzihome_vocab_items_active_idx" ON "public"."hanzihome_vocab_items" USING "btree" ("deleted_at");



CREATE UNIQUE INDEX "hanzihome_vocab_items_active_word_idx" ON "public"."hanzihome_vocab_items" USING "btree" ("lesson_id", "word", "pinyin") WHERE ("deleted_at" IS NULL);



CREATE INDEX "hanzihome_vocab_items_book_id_idx" ON "public"."hanzihome_vocab_items" USING "btree" ("book_id");



CREATE INDEX "hanzihome_vocab_items_category_idx" ON "public"."hanzihome_vocab_items" USING "btree" ("lesson_id", "category");



CREATE INDEX "hanzihome_vocab_items_course_id_idx" ON "public"."hanzihome_vocab_items" USING "btree" ("course_id");



CREATE INDEX "hanzihome_vocab_items_lesson_order_idx" ON "public"."hanzihome_vocab_items" USING "btree" ("lesson_id", "item_order");



CREATE INDEX "hanzihome_vocab_items_lookup_idx" ON "public"."hanzihome_vocab_items" USING "btree" ("word", "pinyin", "han_viet");



CREATE INDEX "idx_dictionary_headword" ON "public"."dictionary_core" USING "btree" ("headword");



CREATE INDEX "idx_dictionary_lookup_key" ON "public"."dictionary_core" USING "btree" ("lookup_key");



CREATE INDEX "idx_notes_category" ON "public"."notes" USING "btree" ("category");



CREATE UNIQUE INDEX "idx_notes_short_id" ON "public"."notes" USING "btree" ("short_id") WHERE ("short_id" IS NOT NULL);



CREATE INDEX "idx_notes_user_category" ON "public"."notes" USING "btree" ("user_id", "category");



CREATE INDEX "idx_user_api_keys_user_priority" ON "public"."user_api_keys" USING "btree" ("user_id", "priority");



CREATE INDEX "idx_user_api_keys_user_provider" ON "public"."user_api_keys" USING "btree" ("user_id", "provider", "is_active");



CREATE INDEX "idx_user_vocab_progress_dictionary_id" ON "public"."user_vocab_progress" USING "btree" ("dictionary_id");



CREATE INDEX "idx_user_vocabularies_user_created" ON "public"."user_vocabularies" USING "btree" ("user_id", "created_at" DESC);



CREATE UNIQUE INDEX "lesson_note_links_main_unique_idx" ON "public"."lesson_note_links" USING "btree" ("user_id", "target_type", "target_key", "relation_type") WHERE ("relation_type" = 'main'::"text");



CREATE INDEX "lesson_note_links_note_id_idx" ON "public"."lesson_note_links" USING "btree" ("note_id");



CREATE INDEX "lesson_note_links_target_idx" ON "public"."lesson_note_links" USING "btree" ("user_id", "target_type", "target_key");



CREATE INDEX "lesson_text_annotations_lesson_id_idx" ON "public"."lesson_text_annotations" USING "btree" ("lesson_id");



CREATE INDEX "lesson_text_annotations_lesson_idx" ON "public"."lesson_text_annotations" USING "btree" ("user_id", "lesson_id", "node_type", "node_id");



CREATE INDEX "note_folders_user_parent_position_idx" ON "public"."note_folders" USING "btree" ("user_id", "parent_id", "position", "updated_at" DESC);



CREATE INDEX "notes_linked_lesson_id_idx" ON "public"."notes" USING "btree" ("linked_lesson_id") WHERE ("linked_lesson_id" IS NOT NULL);



CREATE INDEX "notes_user_folder_updated_idx" ON "public"."notes" USING "btree" ("user_id", "folder_id", "updated_at" DESC);



CREATE UNIQUE INDEX "notes_user_linked_lesson_unique_idx" ON "public"."notes" USING "btree" ("user_id", "linked_lesson_id") WHERE ("linked_lesson_id" IS NOT NULL);



CREATE INDEX "notes_user_reading_status_updated_idx" ON "public"."notes" USING "btree" ("user_id", "reading_status", "updated_at" DESC) WHERE ("reading_status" IS NOT NULL);



CREATE INDEX "notes_user_source_host_updated_idx" ON "public"."notes" USING "btree" ("user_id", "source_host", "updated_at" DESC) WHERE ("source_host" IS NOT NULL);



CREATE INDEX "user_vocab_progress_user_review_idx" ON "public"."user_vocab_progress" USING "btree" ("user_id", "next_review_at");



CREATE INDEX "user_vocab_progress_vocab_id_idx" ON "public"."user_vocab_progress" USING "btree" ("vocab_id");



CREATE INDEX "user_vocabularies_dictionary_id_idx" ON "public"."user_vocabularies" USING "btree" ("dictionary_id");



CREATE INDEX "vocabularies_hanzi_idx" ON "public"."vocabularies" USING "btree" ("hanzi");



CREATE OR REPLACE TRIGGER "ai_characters_updated_at" BEFORE UPDATE ON "public"."ai_characters" FOR EACH ROW EXECUTE FUNCTION "public"."ai_touch_updated_at"();



CREATE OR REPLACE TRIGGER "ai_conversation_preferences_updated_at" BEFORE UPDATE ON "public"."ai_conversation_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."ai_touch_updated_at"();



CREATE OR REPLACE TRIGGER "ai_conversations_updated_at" BEFORE UPDATE ON "public"."ai_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."ai_touch_updated_at"();



CREATE OR REPLACE TRIGGER "ai_memories_updated_at" BEFORE UPDATE ON "public"."ai_memories" FOR EACH ROW EXECUTE FUNCTION "public"."ai_touch_updated_at"();



CREATE OR REPLACE TRIGGER "ai_post_turn_jobs_updated_at" BEFORE UPDATE ON "public"."ai_post_turn_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."ai_touch_updated_at"();



CREATE OR REPLACE TRIGGER "ai_relationship_states_updated_at" BEFORE UPDATE ON "public"."ai_relationship_states" FOR EACH ROW EXECUTE FUNCTION "public"."ai_touch_updated_at"();



CREATE OR REPLACE TRIGGER "hanzihome_daily_reading_state_updated_at" BEFORE UPDATE ON "public"."hanzihome_daily_reading_state" FOR EACH ROW EXECUTE FUNCTION "public"."hanzihome_studio_touch_updated_at"();



CREATE OR REPLACE TRIGGER "hanzihome_learning_loop_items_updated_at" BEFORE UPDATE ON "public"."hanzihome_learning_loop_items" FOR EACH ROW EXECUTE FUNCTION "public"."hanzihome_learning_loop_touch_updated_at"();



CREATE OR REPLACE TRIGGER "hanzihome_listening_audio_touch_updated_at" BEFORE UPDATE ON "public"."hanzihome_listening_audio" FOR EACH ROW EXECUTE FUNCTION "public"."hanzihome_touch_updated_at"();



CREATE OR REPLACE TRIGGER "hanzihome_listening_items_touch_updated_at" BEFORE UPDATE ON "public"."hanzihome_listening_items" FOR EACH ROW EXECUTE FUNCTION "public"."hanzihome_touch_updated_at"();



CREATE OR REPLACE TRIGGER "hanzihome_pdf_annotations_updated_at" BEFORE UPDATE ON "public"."hanzihome_pdf_annotations" FOR EACH ROW EXECUTE FUNCTION "public"."hanzihome_studio_touch_updated_at"();



CREATE OR REPLACE TRIGGER "hanzihome_personal_learning_state_updated_at" BEFORE UPDATE ON "public"."hanzihome_personal_learning_state" FOR EACH ROW EXECUTE FUNCTION "public"."hanzihome_studio_touch_updated_at"();



CREATE OR REPLACE TRIGGER "hanzihome_reader_annotations_updated_at" BEFORE UPDATE ON "public"."hanzihome_reader_annotations" FOR EACH ROW EXECUTE FUNCTION "public"."hanzihome_studio_touch_updated_at"();



CREATE OR REPLACE TRIGGER "hanzihome_reader_progress_updated_at" BEFORE UPDATE ON "public"."hanzihome_reader_progress" FOR EACH ROW EXECUTE FUNCTION "public"."hanzihome_studio_touch_updated_at"();



CREATE OR REPLACE TRIGGER "hanzihome_reader_pronunciation_overrides_updated_at" BEFORE UPDATE ON "public"."hanzihome_reader_pronunciation_overrides" FOR EACH ROW EXECUTE FUNCTION "public"."hanzihome_studio_touch_updated_at"();



CREATE OR REPLACE TRIGGER "hanzihome_tts_clip_folder_owner_check" BEFORE INSERT OR UPDATE ON "public"."hanzihome_tts_clips" FOR EACH ROW EXECUTE FUNCTION "public"."hanzihome_tts_clip_folder_owner_check"();



CREATE OR REPLACE TRIGGER "hanzihome_tts_clips_updated_at" BEFORE UPDATE ON "public"."hanzihome_tts_clips" FOR EACH ROW EXECUTE FUNCTION "public"."hanzihome_studio_touch_updated_at"();



CREATE OR REPLACE TRIGGER "hanzihome_tts_folders_updated_at" BEFORE UPDATE ON "public"."hanzihome_tts_folders" FOR EACH ROW EXECUTE FUNCTION "public"."hanzihome_studio_touch_updated_at"();



CREATE OR REPLACE TRIGGER "set_hanzihome_content_roles_updated_at" BEFORE UPDATE ON "public"."hanzihome_content_roles" FOR EACH ROW EXECUTE FUNCTION "public"."set_hanzihome_updated_at"();



CREATE OR REPLACE TRIGGER "set_hanzihome_course_books_updated_at" BEFORE UPDATE ON "public"."hanzihome_course_books" FOR EACH ROW EXECUTE FUNCTION "public"."set_hanzihome_updated_at"();



CREATE OR REPLACE TRIGGER "set_hanzihome_courses_updated_at" BEFORE UPDATE ON "public"."hanzihome_courses" FOR EACH ROW EXECUTE FUNCTION "public"."set_hanzihome_updated_at"();



CREATE OR REPLACE TRIGGER "set_hanzihome_grammar_detail_sections_updated_at" BEFORE UPDATE ON "public"."hanzihome_grammar_detail_sections" FOR EACH ROW EXECUTE FUNCTION "public"."set_hanzihome_updated_at"();



CREATE OR REPLACE TRIGGER "set_hanzihome_grammar_examples_updated_at" BEFORE UPDATE ON "public"."hanzihome_grammar_examples" FOR EACH ROW EXECUTE FUNCTION "public"."set_hanzihome_updated_at"();



CREATE OR REPLACE TRIGGER "set_hanzihome_grammar_points_updated_at" BEFORE UPDATE ON "public"."hanzihome_grammar_points" FOR EACH ROW EXECUTE FUNCTION "public"."set_hanzihome_updated_at"();



CREATE OR REPLACE TRIGGER "set_hanzihome_html_artifact_folders_updated_at" BEFORE UPDATE ON "public"."hanzihome_html_artifact_folders" FOR EACH ROW EXECUTE FUNCTION "public"."set_hanzihome_html_artifact_folders_updated_at"();



CREATE OR REPLACE TRIGGER "set_hanzihome_html_artifact_runtime_states_updated_at" BEFORE UPDATE ON "public"."hanzihome_html_artifact_runtime_states" FOR EACH ROW EXECUTE FUNCTION "public"."set_hanzihome_html_artifact_runtime_states_updated_at"();



CREATE OR REPLACE TRIGGER "set_hanzihome_html_artifacts_updated_at" BEFORE UPDATE ON "public"."hanzihome_html_artifacts" FOR EACH ROW EXECUTE FUNCTION "public"."set_hanzihome_html_artifacts_updated_at"();



CREATE OR REPLACE TRIGGER "set_hanzihome_lesson_sections_updated_at" BEFORE UPDATE ON "public"."hanzihome_lesson_sections" FOR EACH ROW EXECUTE FUNCTION "public"."set_hanzihome_updated_at"();



CREATE OR REPLACE TRIGGER "set_hanzihome_lesson_texts_updated_at" BEFORE UPDATE ON "public"."hanzihome_lesson_texts" FOR EACH ROW EXECUTE FUNCTION "public"."set_hanzihome_updated_at"();



CREATE OR REPLACE TRIGGER "set_hanzihome_lessons_updated_at" BEFORE UPDATE ON "public"."hanzihome_lessons" FOR EACH ROW EXECUTE FUNCTION "public"."set_hanzihome_updated_at"();



CREATE OR REPLACE TRIGGER "set_hanzihome_memory_tips_updated_at" BEFORE UPDATE ON "public"."hanzihome_memory_tips" FOR EACH ROW EXECUTE FUNCTION "public"."set_hanzihome_memory_tips_updated_at"();



CREATE OR REPLACE TRIGGER "set_hanzihome_radicals_updated_at" BEFORE UPDATE ON "public"."hanzihome_radicals" FOR EACH ROW EXECUTE FUNCTION "public"."set_hanzihome_updated_at"();



CREATE OR REPLACE TRIGGER "set_hanzihome_vocab_detail_sections_updated_at" BEFORE UPDATE ON "public"."hanzihome_vocab_detail_sections" FOR EACH ROW EXECUTE FUNCTION "public"."set_hanzihome_updated_at"();



CREATE OR REPLACE TRIGGER "set_hanzihome_vocab_examples_updated_at" BEFORE UPDATE ON "public"."hanzihome_vocab_examples" FOR EACH ROW EXECUTE FUNCTION "public"."set_hanzihome_updated_at"();



CREATE OR REPLACE TRIGGER "set_hanzihome_vocab_items_updated_at" BEFORE UPDATE ON "public"."hanzihome_vocab_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_hanzihome_updated_at"();



CREATE OR REPLACE TRIGGER "touch_note_folder_updated_at_before_update" BEFORE UPDATE ON "public"."note_folders" FOR EACH ROW EXECUTE FUNCTION "public"."touch_note_folder_updated_at"();



CREATE OR REPLACE TRIGGER "trg_note_short_id" BEFORE INSERT ON "public"."notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_note_short_id"();



CREATE OR REPLACE TRIGGER "validate_note_folder_depth_before_write" BEFORE INSERT OR UPDATE OF "parent_id", "user_id" ON "public"."note_folders" FOR EACH ROW EXECUTE FUNCTION "public"."validate_note_folder_depth"();



ALTER TABLE ONLY "public"."ai_characters"
    ADD CONSTRAINT "ai_characters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_conversation_preferences"
    ADD CONSTRAINT "ai_conversation_preferences_default_character_fk" FOREIGN KEY ("default_character_id", "user_id") REFERENCES "public"."ai_characters"("id", "user_id") ON DELETE SET NULL ("default_character_id");



ALTER TABLE ONLY "public"."ai_conversation_preferences"
    ADD CONSTRAINT "ai_conversation_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_character_fk" FOREIGN KEY ("character_id", "user_id") REFERENCES "public"."ai_characters"("id", "user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_memories"
    ADD CONSTRAINT "ai_memories_character_fk" FOREIGN KEY ("character_id", "user_id") REFERENCES "public"."ai_characters"("id", "user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_memories"
    ADD CONSTRAINT "ai_memories_superseded_by_fk" FOREIGN KEY ("superseded_by_id", "user_id") REFERENCES "public"."ai_memories"("id", "user_id") ON DELETE SET NULL ("superseded_by_id") DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."ai_memories"
    ADD CONSTRAINT "ai_memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_memory_evidence"
    ADD CONSTRAINT "ai_memory_evidence_memory_fk" FOREIGN KEY ("memory_id", "user_id") REFERENCES "public"."ai_memories"("id", "user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_memory_evidence"
    ADD CONSTRAINT "ai_memory_evidence_message_fk" FOREIGN KEY ("message_id", "user_id") REFERENCES "public"."ai_messages"("id", "user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_conversation_fk" FOREIGN KEY ("conversation_id", "user_id") REFERENCES "public"."ai_conversations"("id", "user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_reply_to_fk" FOREIGN KEY ("reply_to_message_id", "conversation_id", "user_id") REFERENCES "public"."ai_messages"("id", "conversation_id", "user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_post_turn_jobs"
    ADD CONSTRAINT "ai_post_turn_jobs_assistant_message_fk" FOREIGN KEY ("assistant_message_id", "conversation_id", "user_id") REFERENCES "public"."ai_messages"("id", "conversation_id", "user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_post_turn_jobs"
    ADD CONSTRAINT "ai_post_turn_jobs_conversation_fk" FOREIGN KEY ("conversation_id", "user_id") REFERENCES "public"."ai_conversations"("id", "user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_relationship_states"
    ADD CONSTRAINT "ai_relationship_states_character_fk" FOREIGN KEY ("character_id", "user_id") REFERENCES "public"."ai_characters"("id", "user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_content_audit_log"
    ADD CONSTRAINT "hanzihome_content_audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."hanzihome_content_editors"
    ADD CONSTRAINT "hanzihome_content_editors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_content_roles"
    ADD CONSTRAINT "hanzihome_content_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_course_books"
    ADD CONSTRAINT "hanzihome_course_books_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hanzihome_course_books"
    ADD CONSTRAINT "hanzihome_course_books_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_courses"
    ADD CONSTRAINT "hanzihome_courses_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hanzihome_courses"
    ADD CONSTRAINT "hanzihome_courses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_daily_reading_state"
    ADD CONSTRAINT "hanzihome_daily_reading_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_grammar_detail_sections"
    ADD CONSTRAINT "hanzihome_grammar_detail_sections_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hanzihome_grammar_detail_sections"
    ADD CONSTRAINT "hanzihome_grammar_detail_sections_grammar_point_id_fkey" FOREIGN KEY ("grammar_point_id") REFERENCES "public"."hanzihome_grammar_points"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_grammar_detail_sections"
    ADD CONSTRAINT "hanzihome_grammar_detail_sections_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."hanzihome_lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_grammar_detail_sections"
    ADD CONSTRAINT "hanzihome_grammar_detail_sections_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_grammar_examples"
    ADD CONSTRAINT "hanzihome_grammar_examples_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hanzihome_grammar_examples"
    ADD CONSTRAINT "hanzihome_grammar_examples_grammar_point_id_fkey" FOREIGN KEY ("grammar_point_id") REFERENCES "public"."hanzihome_grammar_points"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_grammar_examples"
    ADD CONSTRAINT "hanzihome_grammar_examples_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."hanzihome_lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_grammar_examples"
    ADD CONSTRAINT "hanzihome_grammar_examples_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_grammar_points"
    ADD CONSTRAINT "hanzihome_grammar_points_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."hanzihome_course_books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_grammar_points"
    ADD CONSTRAINT "hanzihome_grammar_points_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."hanzihome_courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_grammar_points"
    ADD CONSTRAINT "hanzihome_grammar_points_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hanzihome_grammar_points"
    ADD CONSTRAINT "hanzihome_grammar_points_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."hanzihome_lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_grammar_points"
    ADD CONSTRAINT "hanzihome_grammar_points_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_html_artifact_folders"
    ADD CONSTRAINT "hanzihome_html_artifact_folders_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_html_artifact_folders"
    ADD CONSTRAINT "hanzihome_html_artifact_folders_owner_parent_fk" FOREIGN KEY ("owner_id", "parent_folder_id") REFERENCES "public"."hanzihome_html_artifact_folders"("owner_id", "id") ON DELETE SET NULL ("parent_folder_id");



ALTER TABLE ONLY "public"."hanzihome_html_artifact_folders"
    ADD CONSTRAINT "hanzihome_html_artifact_folders_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."hanzihome_html_artifact_folders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hanzihome_html_artifact_runtime_states"
    ADD CONSTRAINT "hanzihome_html_artifact_runtime_states_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "public"."hanzihome_html_artifacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_html_artifact_runtime_states"
    ADD CONSTRAINT "hanzihome_html_artifact_runtime_states_owner_artifact_fk" FOREIGN KEY ("owner_id", "artifact_id") REFERENCES "public"."hanzihome_html_artifacts"("owner_id", "id") ON DELETE CASCADE DEFERRABLE;



ALTER TABLE ONLY "public"."hanzihome_html_artifact_runtime_states"
    ADD CONSTRAINT "hanzihome_html_artifact_runtime_states_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_html_artifacts"
    ADD CONSTRAINT "hanzihome_html_artifacts_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."hanzihome_html_artifact_folders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hanzihome_html_artifacts"
    ADD CONSTRAINT "hanzihome_html_artifacts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_learning_loop_items"
    ADD CONSTRAINT "hanzihome_learning_loop_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_lesson_sections"
    ADD CONSTRAINT "hanzihome_lesson_sections_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hanzihome_lesson_sections"
    ADD CONSTRAINT "hanzihome_lesson_sections_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."hanzihome_lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_lesson_sections"
    ADD CONSTRAINT "hanzihome_lesson_sections_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_lesson_texts"
    ADD CONSTRAINT "hanzihome_lesson_texts_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hanzihome_lesson_texts"
    ADD CONSTRAINT "hanzihome_lesson_texts_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."hanzihome_lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_lesson_texts"
    ADD CONSTRAINT "hanzihome_lesson_texts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_lessons"
    ADD CONSTRAINT "hanzihome_lessons_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."hanzihome_course_books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_lessons"
    ADD CONSTRAINT "hanzihome_lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."hanzihome_courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_lessons"
    ADD CONSTRAINT "hanzihome_lessons_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hanzihome_lessons"
    ADD CONSTRAINT "hanzihome_lessons_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_listening_audio"
    ADD CONSTRAINT "hanzihome_listening_audio_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."hanzihome_listening_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_listening_audio"
    ADD CONSTRAINT "hanzihome_listening_audio_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."hanzihome_lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_listening_audio"
    ADD CONSTRAINT "hanzihome_listening_audio_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_listening_audio"
    ADD CONSTRAINT "hanzihome_listening_audio_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."hanzihome_lesson_sections"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hanzihome_listening_items"
    ADD CONSTRAINT "hanzihome_listening_items_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."hanzihome_listening_items"
    ADD CONSTRAINT "hanzihome_listening_items_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."hanzihome_lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_listening_items"
    ADD CONSTRAINT "hanzihome_listening_items_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_listening_items"
    ADD CONSTRAINT "hanzihome_listening_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."hanzihome_lesson_sections"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hanzihome_memory_tips"
    ADD CONSTRAINT "hanzihome_memory_tips_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_pdf_annotations"
    ADD CONSTRAINT "hanzihome_pdf_annotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_personal_learning_state"
    ADD CONSTRAINT "hanzihome_personal_learning_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_practice_attempts"
    ADD CONSTRAINT "hanzihome_practice_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_radicals"
    ADD CONSTRAINT "hanzihome_radicals_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hanzihome_radicals"
    ADD CONSTRAINT "hanzihome_radicals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_reader_annotations"
    ADD CONSTRAINT "hanzihome_reader_annotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_reader_progress"
    ADD CONSTRAINT "hanzihome_reader_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_reader_pronunciation_overrides"
    ADD CONSTRAINT "hanzihome_reader_pronunciation_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_tts_clips"
    ADD CONSTRAINT "hanzihome_tts_clips_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."hanzihome_tts_folders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hanzihome_tts_clips"
    ADD CONSTRAINT "hanzihome_tts_clips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_tts_folders"
    ADD CONSTRAINT "hanzihome_tts_folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_vocab_detail_sections"
    ADD CONSTRAINT "hanzihome_vocab_detail_sections_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hanzihome_vocab_detail_sections"
    ADD CONSTRAINT "hanzihome_vocab_detail_sections_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."hanzihome_lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_vocab_detail_sections"
    ADD CONSTRAINT "hanzihome_vocab_detail_sections_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_vocab_detail_sections"
    ADD CONSTRAINT "hanzihome_vocab_detail_sections_vocab_item_id_fkey" FOREIGN KEY ("vocab_item_id") REFERENCES "public"."hanzihome_vocab_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_vocab_examples"
    ADD CONSTRAINT "hanzihome_vocab_examples_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hanzihome_vocab_examples"
    ADD CONSTRAINT "hanzihome_vocab_examples_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."hanzihome_lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_vocab_examples"
    ADD CONSTRAINT "hanzihome_vocab_examples_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_vocab_examples"
    ADD CONSTRAINT "hanzihome_vocab_examples_vocab_item_id_fkey" FOREIGN KEY ("vocab_item_id") REFERENCES "public"."hanzihome_vocab_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_vocab_items"
    ADD CONSTRAINT "hanzihome_vocab_items_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."hanzihome_course_books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_vocab_items"
    ADD CONSTRAINT "hanzihome_vocab_items_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."hanzihome_courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_vocab_items"
    ADD CONSTRAINT "hanzihome_vocab_items_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hanzihome_vocab_items"
    ADD CONSTRAINT "hanzihome_vocab_items_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."hanzihome_lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hanzihome_vocab_items"
    ADD CONSTRAINT "hanzihome_vocab_items_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_note_links"
    ADD CONSTRAINT "lesson_note_links_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_note_links"
    ADD CONSTRAINT "lesson_note_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_text_annotations"
    ADD CONSTRAINT "lesson_text_annotations_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."hanzihome_lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_text_annotations"
    ADD CONSTRAINT "lesson_text_annotations_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_text_annotations"
    ADD CONSTRAINT "lesson_text_annotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."note_folders"
    ADD CONSTRAINT "note_folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."note_folders"
    ADD CONSTRAINT "note_folders_user_parent_fk" FOREIGN KEY ("user_id", "parent_id") REFERENCES "public"."note_folders"("user_id", "id") ON DELETE SET NULL ("parent_id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_user_folder_fk" FOREIGN KEY ("user_id", "folder_id") REFERENCES "public"."note_folders"("user_id", "id") ON DELETE SET NULL ("folder_id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_ai_prompt_settings"
    ADD CONSTRAINT "user_ai_prompt_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_api_keys"
    ADD CONSTRAINT "user_api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_learning_state"
    ADD CONSTRAINT "user_learning_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_vocab_progress"
    ADD CONSTRAINT "user_vocab_progress_dictionary_id_fkey" FOREIGN KEY ("dictionary_id") REFERENCES "public"."dictionary_core"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_vocab_progress"
    ADD CONSTRAINT "user_vocab_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_vocab_progress"
    ADD CONSTRAINT "user_vocab_progress_vocab_id_fkey" FOREIGN KEY ("vocab_id") REFERENCES "public"."vocabularies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_vocabularies"
    ADD CONSTRAINT "user_vocabularies_dictionary_id_fkey" FOREIGN KEY ("dictionary_id") REFERENCES "public"."dictionary_core"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_vocabularies"
    ADD CONSTRAINT "user_vocabularies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated users can read dictionary core" ON "public"."dictionary_core" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Authenticated users can read vocabularies" ON "public"."vocabularies" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Boya listening anonymous published reads" ON "public"."hanzihome_listening_items" FOR SELECT TO "anon" USING ((("deleted_at" IS NULL) AND ("publication_status" = 'published'::"text")));



CREATE POLICY "Boya listening audio anonymous published reads" ON "public"."hanzihome_listening_audio" FOR SELECT TO "anon" USING ((("deleted_at" IS NULL) AND ("publication_status" = 'published'::"text")));



CREATE POLICY "Boya listening audio authenticated deletes" ON "public"."hanzihome_listening_audio" FOR DELETE TO "authenticated" USING ((( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content") OR (("source" = 'custom'::"text") AND ("owner_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Boya listening audio authenticated inserts" ON "public"."hanzihome_listening_audio" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content") OR (("source" = 'custom'::"text") AND ("owner_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Boya listening audio authenticated reads" ON "public"."hanzihome_listening_audio" FOR SELECT TO "authenticated" USING (((("deleted_at" IS NULL) AND ("publication_status" = 'published'::"text")) OR ( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content") OR (("source" = 'custom'::"text") AND ("owner_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Boya listening audio authenticated updates" ON "public"."hanzihome_listening_audio" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content") OR (("source" = 'custom'::"text") AND ("owner_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK ((( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content") OR (("source" = 'custom'::"text") AND ("owner_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Boya listening authenticated deletes" ON "public"."hanzihome_listening_items" FOR DELETE TO "authenticated" USING ((( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content") OR (("source" = 'custom'::"text") AND ("owner_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Boya listening authenticated inserts" ON "public"."hanzihome_listening_items" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content") OR (("source" = 'custom'::"text") AND ("owner_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Boya listening authenticated reads" ON "public"."hanzihome_listening_items" FOR SELECT TO "authenticated" USING (((("deleted_at" IS NULL) AND ("publication_status" = 'published'::"text")) OR ( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content") OR (("source" = 'custom'::"text") AND ("owner_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Boya listening authenticated updates" ON "public"."hanzihome_listening_items" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content") OR (("source" = 'custom'::"text") AND ("owner_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK ((( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content") OR (("source" = 'custom'::"text") AND ("owner_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "HanziHome authenticated reads" ON "public"."hanzihome_course_books" FOR SELECT TO "authenticated" USING (((("deleted_at" IS NULL) AND (("source" = 'seed'::"text") OR (("source" = 'custom'::"text") AND (( SELECT "auth"."uid"() AS "uid") IS NOT NULL))) AND (EXISTS ( SELECT 1
   FROM "public"."hanzihome_courses" "parent"
  WHERE (("parent"."id" = "hanzihome_course_books"."course_id") AND ("parent"."deleted_at" IS NULL))))) OR ( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content")));



CREATE POLICY "HanziHome authenticated reads" ON "public"."hanzihome_courses" FOR SELECT TO "authenticated" USING (((("deleted_at" IS NULL) AND (("source" = 'seed'::"text") OR (("source" = 'custom'::"text") AND (( SELECT "auth"."uid"() AS "uid") IS NOT NULL)))) OR ( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content")));



CREATE POLICY "HanziHome authenticated reads" ON "public"."hanzihome_grammar_detail_sections" FOR SELECT TO "authenticated" USING (((("deleted_at" IS NULL) AND (("source" = 'seed'::"text") OR (("source" = 'custom'::"text") AND (( SELECT "auth"."uid"() AS "uid") IS NOT NULL))) AND (EXISTS ( SELECT 1
   FROM "public"."hanzihome_grammar_points" "parent"
  WHERE (("parent"."id" = "hanzihome_grammar_detail_sections"."grammar_point_id") AND ("parent"."lesson_id" = "hanzihome_grammar_detail_sections"."lesson_id") AND ("parent"."deleted_at" IS NULL))))) OR ( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content")));



CREATE POLICY "HanziHome authenticated reads" ON "public"."hanzihome_grammar_examples" FOR SELECT TO "authenticated" USING (((("deleted_at" IS NULL) AND (("source" = 'seed'::"text") OR (("source" = 'custom'::"text") AND (( SELECT "auth"."uid"() AS "uid") IS NOT NULL))) AND (EXISTS ( SELECT 1
   FROM "public"."hanzihome_grammar_points" "parent"
  WHERE (("parent"."id" = "hanzihome_grammar_examples"."grammar_point_id") AND ("parent"."lesson_id" = "hanzihome_grammar_examples"."lesson_id") AND ("parent"."deleted_at" IS NULL))))) OR ( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content")));



CREATE POLICY "HanziHome authenticated reads" ON "public"."hanzihome_grammar_points" FOR SELECT TO "authenticated" USING (((("deleted_at" IS NULL) AND (("source" = 'seed'::"text") OR (("source" = 'custom'::"text") AND (( SELECT "auth"."uid"() AS "uid") IS NOT NULL))) AND (EXISTS ( SELECT 1
   FROM "public"."hanzihome_lessons" "parent"
  WHERE (("parent"."id" = "hanzihome_grammar_points"."lesson_id") AND ("parent"."course_id" = "hanzihome_grammar_points"."course_id") AND ("parent"."book_id" = "hanzihome_grammar_points"."book_id") AND ("parent"."deleted_at" IS NULL))))) OR ( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content")));



CREATE POLICY "HanziHome authenticated reads" ON "public"."hanzihome_lesson_sections" FOR SELECT TO "authenticated" USING (((("deleted_at" IS NULL) AND (("source" = 'seed'::"text") OR (("source" = 'custom'::"text") AND (( SELECT "auth"."uid"() AS "uid") IS NOT NULL))) AND (EXISTS ( SELECT 1
   FROM "public"."hanzihome_lessons" "parent"
  WHERE (("parent"."id" = "hanzihome_lesson_sections"."lesson_id") AND ("parent"."deleted_at" IS NULL))))) OR ( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content")));



CREATE POLICY "HanziHome authenticated reads" ON "public"."hanzihome_lesson_texts" FOR SELECT TO "authenticated" USING (((("deleted_at" IS NULL) AND (("source" = 'seed'::"text") OR (("source" = 'custom'::"text") AND (( SELECT "auth"."uid"() AS "uid") IS NOT NULL))) AND (EXISTS ( SELECT 1
   FROM "public"."hanzihome_lessons" "parent"
  WHERE (("parent"."id" = "hanzihome_lesson_texts"."lesson_id") AND ("parent"."deleted_at" IS NULL))))) OR ( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content")));



CREATE POLICY "HanziHome authenticated reads" ON "public"."hanzihome_lessons" FOR SELECT TO "authenticated" USING (((("deleted_at" IS NULL) AND (("source" = 'seed'::"text") OR (("source" = 'custom'::"text") AND (( SELECT "auth"."uid"() AS "uid") IS NOT NULL))) AND (EXISTS ( SELECT 1
   FROM "public"."hanzihome_course_books" "parent"
  WHERE (("parent"."id" = "hanzihome_lessons"."book_id") AND ("parent"."course_id" = "hanzihome_lessons"."course_id") AND ("parent"."deleted_at" IS NULL)))) AND (EXISTS ( SELECT 1
   FROM "public"."hanzihome_courses" "parent"
  WHERE (("parent"."id" = "hanzihome_lessons"."course_id") AND ("parent"."deleted_at" IS NULL))))) OR ( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content")));



CREATE POLICY "HanziHome authenticated reads" ON "public"."hanzihome_vocab_detail_sections" FOR SELECT TO "authenticated" USING (((("deleted_at" IS NULL) AND (("source" = 'seed'::"text") OR (("source" = 'custom'::"text") AND (( SELECT "auth"."uid"() AS "uid") IS NOT NULL))) AND (EXISTS ( SELECT 1
   FROM "public"."hanzihome_vocab_items" "parent"
  WHERE (("parent"."id" = "hanzihome_vocab_detail_sections"."vocab_item_id") AND ("parent"."lesson_id" = "hanzihome_vocab_detail_sections"."lesson_id") AND ("parent"."deleted_at" IS NULL))))) OR ( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content")));



CREATE POLICY "HanziHome authenticated reads" ON "public"."hanzihome_vocab_examples" FOR SELECT TO "authenticated" USING (((("deleted_at" IS NULL) AND (("source" = 'seed'::"text") OR (("source" = 'custom'::"text") AND (( SELECT "auth"."uid"() AS "uid") IS NOT NULL))) AND (EXISTS ( SELECT 1
   FROM "public"."hanzihome_vocab_items" "parent"
  WHERE (("parent"."id" = "hanzihome_vocab_examples"."vocab_item_id") AND ("parent"."lesson_id" = "hanzihome_vocab_examples"."lesson_id") AND ("parent"."deleted_at" IS NULL))))) OR ( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content")));



CREATE POLICY "HanziHome authenticated reads" ON "public"."hanzihome_vocab_items" FOR SELECT TO "authenticated" USING (((("deleted_at" IS NULL) AND (("source" = 'seed'::"text") OR (("source" = 'custom'::"text") AND (( SELECT "auth"."uid"() AS "uid") IS NOT NULL))) AND (EXISTS ( SELECT 1
   FROM "public"."hanzihome_lessons" "parent"
  WHERE (("parent"."id" = "hanzihome_vocab_items"."lesson_id") AND ("parent"."course_id" = "hanzihome_vocab_items"."course_id") AND ("parent"."book_id" = "hanzihome_vocab_items"."book_id") AND ("parent"."deleted_at" IS NULL))))) OR ( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content")));



CREATE POLICY "HanziHome editors can read content audit log" ON "public"."hanzihome_content_audit_log" FOR SELECT TO "authenticated" USING (( SELECT "public"."can_edit_hanzihome_content"() AS "can_edit_hanzihome_content"));



CREATE POLICY "HanziHome radical active reads" ON "public"."hanzihome_radicals" FOR SELECT TO "anon", "authenticated" USING ((("deleted_at" IS NULL) AND (("source" = 'seed'::"text") OR (("source" = 'custom'::"text") AND (( SELECT "auth"."uid"() AS "uid") = "owner_id")))));



CREATE POLICY "Seed editors can read own hanzihome editor grant" ON "public"."hanzihome_content_editors" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can access own AI characters" ON "public"."ai_characters" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can access own AI conversation preferences" ON "public"."ai_conversation_preferences" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can access own AI conversations" ON "public"."ai_conversations" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can access own AI memories" ON "public"."ai_memories" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can access own AI memory evidence" ON "public"."ai_memory_evidence" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can access own AI messages" ON "public"."ai_messages" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can access own AI relationship states" ON "public"."ai_relationship_states" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can create own Studio practice attempts" ON "public"."hanzihome_practice_attempts" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own API keys" ON "public"."user_api_keys" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own HanziHome HTML artifact folders" ON "public"."hanzihome_html_artifact_folders" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Users can delete own HanziHome HTML artifact runtime state" ON "public"."hanzihome_html_artifact_runtime_states" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Users can delete own HanziHome HTML artifacts" ON "public"."hanzihome_html_artifacts" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Users can delete own lesson note links" ON "public"."lesson_note_links" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own lesson text annotations" ON "public"."lesson_text_annotations" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own memory tips" ON "public"."hanzihome_memory_tips" FOR DELETE TO "authenticated" USING ((("scope" = 'user'::"text") AND ("owner_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can delete own note folders" ON "public"."note_folders" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own user vocabularies" ON "public"."user_vocabularies" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own vocab progress" ON "public"."user_vocab_progress" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own AI prompt settings" ON "public"."user_ai_prompt_settings" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own API keys" ON "public"."user_api_keys" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own HanziHome HTML artifact folders" ON "public"."hanzihome_html_artifact_folders" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Users can insert own HanziHome HTML artifact runtime state" ON "public"."hanzihome_html_artifact_runtime_states" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Users can insert own HanziHome HTML artifacts" ON "public"."hanzihome_html_artifacts" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Users can insert own lesson note links" ON "public"."lesson_note_links" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own lesson text annotations" ON "public"."lesson_text_annotations" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own memory tips" ON "public"."hanzihome_memory_tips" FOR INSERT TO "authenticated" WITH CHECK ((("scope" = 'user'::"text") AND ("owner_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can insert own note folders" ON "public"."note_folders" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own user vocabularies" ON "public"."user_vocabularies" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own vocab progress" ON "public"."user_vocab_progress" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own HanziHome PDF annotations" ON "public"."hanzihome_pdf_annotations" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own HanziHome TTS clips" ON "public"."hanzihome_tts_clips" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own HanziHome TTS folders" ON "public"."hanzihome_tts_folders" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own HanziHome learning loop items" ON "public"."hanzihome_learning_loop_items" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own Reader pronunciation overrides" ON "public"."hanzihome_reader_pronunciation_overrides" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own Studio daily reading state" ON "public"."hanzihome_daily_reading_state" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own Studio personal learning state" ON "public"."hanzihome_personal_learning_state" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own Studio reader annotations" ON "public"."hanzihome_reader_annotations" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own Studio reader progress" ON "public"."hanzihome_reader_progress" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own learning state" ON "public"."user_learning_state" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own notes" ON "public"."notes" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read own HanziHome HTML artifact folders" ON "public"."hanzihome_html_artifact_folders" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Users can read own HanziHome HTML artifact runtime state" ON "public"."hanzihome_html_artifact_runtime_states" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Users can read own HanziHome HTML artifacts" ON "public"."hanzihome_html_artifacts" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Users can read own HanziHome content role" ON "public"."hanzihome_content_roles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read own Studio practice attempts" ON "public"."hanzihome_practice_attempts" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can read own and system memory tips" ON "public"."hanzihome_memory_tips" FOR SELECT TO "authenticated" USING ((("is_archived" = false) AND (("scope" = 'system'::"text") OR ("owner_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can read own lesson note links" ON "public"."lesson_note_links" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read own note folders" ON "public"."note_folders" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read own vocab progress" ON "public"."user_vocab_progress" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own AI prompt settings" ON "public"."user_ai_prompt_settings" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own API keys" ON "public"."user_api_keys" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own HanziHome HTML artifact folders" ON "public"."hanzihome_html_artifact_folders" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "owner_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Users can update own HanziHome HTML artifact runtime state" ON "public"."hanzihome_html_artifact_runtime_states" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "owner_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Users can update own HanziHome HTML artifacts" ON "public"."hanzihome_html_artifacts" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "owner_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));



CREATE POLICY "Users can update own lesson note links" ON "public"."lesson_note_links" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own lesson text annotations" ON "public"."lesson_text_annotations" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own memory tips" ON "public"."hanzihome_memory_tips" FOR UPDATE TO "authenticated" USING ((("scope" = 'user'::"text") AND ("owner_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK ((("scope" = 'user'::"text") AND ("owner_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can update own note folders" ON "public"."note_folders" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own vocab progress" ON "public"."user_vocab_progress" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own AI prompt settings" ON "public"."user_ai_prompt_settings" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own API keys" ON "public"."user_api_keys" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own lesson text annotations" ON "public"."lesson_text_annotations" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can view own user vocabularies" ON "public"."user_vocabularies" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."ai_characters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_conversation_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_memories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_memory_evidence" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_post_turn_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_relationship_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dictionary_core" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_content_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_content_editors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_content_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_course_books" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_daily_reading_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_grammar_detail_sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_grammar_examples" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_grammar_points" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_html_artifact_folders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_html_artifact_runtime_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_html_artifacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_learning_loop_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_lesson_sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_lesson_texts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_lessons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_listening_audio" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_listening_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_memory_tips" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_pdf_annotations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_personal_learning_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_practice_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_radicals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_reader_annotations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_reader_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_reader_pronunciation_overrides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_tts_clips" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_tts_folders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_vocab_detail_sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_vocab_examples" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hanzihome_vocab_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lesson_note_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lesson_text_annotations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."note_folders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_ai_prompt_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_api_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_learning_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_vocab_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_vocabularies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vocabularies" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



-- A schema dump does not record privilege revocations inherited from the local
-- Supabase bootstrap defaults. Reset those table privileges before recreating
-- the explicit production grants below.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

GRANT ALL ON TABLE "public"."ai_messages" TO "service_role";



REVOKE ALL ON FUNCTION "public"."ai_append_message"("p_user_id" "uuid", "p_conversation_id" "uuid", "p_role" "text", "p_content" "text", "p_client_message_id" "uuid", "p_reply_to_message_id" "uuid", "p_metadata" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ai_append_message"("p_user_id" "uuid", "p_conversation_id" "uuid", "p_role" "text", "p_content" "text", "p_client_message_id" "uuid", "p_reply_to_message_id" "uuid", "p_metadata" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."ai_apply_memory_changes"("p_user_id" "uuid", "p_job_id" "uuid", "p_user_message_id" "uuid", "p_changes" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ai_apply_memory_changes"("p_user_id" "uuid", "p_job_id" "uuid", "p_user_message_id" "uuid", "p_changes" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."ai_apply_summary_for_job"("p_user_id" "uuid", "p_job_id" "uuid", "p_summary" "text", "p_summary_until_seq" bigint, "p_expected_summary_version" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ai_apply_summary_for_job"("p_user_id" "uuid", "p_job_id" "uuid", "p_summary" "text", "p_summary_until_seq" bigint, "p_expected_summary_version" integer) TO "service_role";



GRANT ALL ON TABLE "public"."ai_post_turn_jobs" TO "service_role";



REVOKE ALL ON FUNCTION "public"."ai_claim_post_turn_jobs"("p_user_id" "uuid", "p_conversation_id" "uuid", "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ai_claim_post_turn_jobs"("p_user_id" "uuid", "p_conversation_id" "uuid", "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."ai_evolve_relationship_for_job"("p_user_id" "uuid", "p_job_id" "uuid", "p_increment" numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ai_evolve_relationship_for_job"("p_user_id" "uuid", "p_job_id" "uuid", "p_increment" numeric) TO "service_role";



REVOKE ALL ON FUNCTION "public"."ai_finish_post_turn_job"("p_user_id" "uuid", "p_job_id" "uuid", "p_succeeded" boolean, "p_error" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ai_finish_post_turn_job"("p_user_id" "uuid", "p_job_id" "uuid", "p_succeeded" boolean, "p_error" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."ai_match_memories"("p_user_id" "uuid", "p_character_id" "uuid", "p_query_embedding" "text", "p_match_count" integer, "p_min_similarity" double precision) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ai_match_memories"("p_user_id" "uuid", "p_character_id" "uuid", "p_query_embedding" "text", "p_match_count" integer, "p_min_similarity" double precision) TO "service_role";



REVOKE ALL ON FUNCTION "public"."ai_set_memory_embedding"("p_user_id" "uuid", "p_memory_id" "uuid", "p_embedding" "text", "p_embedding_model" "text", "p_embedding_version" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ai_set_memory_embedding"("p_user_id" "uuid", "p_memory_id" "uuid", "p_embedding" "text", "p_embedding_model" "text", "p_embedding_version" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."ai_touch_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ai_touch_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."can_edit_hanzihome_content"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_edit_hanzihome_content"() TO "service_role";
GRANT ALL ON FUNCTION "public"."can_edit_hanzihome_content"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_lesson_text_annotation"("p_lesson_id" "text", "p_node_type" "text", "p_node_id" "text", "p_start_offset" integer, "p_end_offset" integer, "p_selected_text" "text", "p_prefix_text" "text", "p_suffix_text" "text", "p_note_text" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_lesson_text_annotation"("p_lesson_id" "text", "p_node_type" "text", "p_node_id" "text", "p_start_offset" integer, "p_end_offset" integer, "p_selected_text" "text", "p_prefix_text" "text", "p_suffix_text" "text", "p_note_text" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."delete_lesson_text_annotation"("p_annotation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_lesson_text_annotation"("p_annotation_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."generate_note_short_id"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."generate_note_short_id"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_hanzihome_aggregate_grammar"("p_course_id" "text", "p_book_id" "text", "p_lesson_id" "text", "p_q" "text", "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_hanzihome_aggregate_grammar"("p_course_id" "text", "p_book_id" "text", "p_lesson_id" "text", "p_q" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_hanzihome_aggregate_grammar"("p_course_id" "text", "p_book_id" "text", "p_lesson_id" "text", "p_q" "text", "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_hanzihome_aggregate_vocab"("p_course_id" "text", "p_book_id" "text", "p_lesson_id" "text", "p_q" "text", "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_hanzihome_aggregate_vocab"("p_course_id" "text", "p_book_id" "text", "p_lesson_id" "text", "p_q" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_hanzihome_aggregate_vocab"("p_course_id" "text", "p_book_id" "text", "p_lesson_id" "text", "p_q" "text", "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_hanzihome_catalog_stats"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_hanzihome_catalog_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_hanzihome_catalog_stats"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_apply_external_seed_patches"("p_patches" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_apply_external_seed_patches"("p_patches" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_create_lesson_text_annotation_as_server"("p_user_id" "uuid", "p_lesson_id" "text", "p_node_type" "text", "p_node_id" "text", "p_start_offset" integer, "p_end_offset" integer, "p_selected_text" "text", "p_prefix_text" "text", "p_suffix_text" "text", "p_note_text" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_create_lesson_text_annotation_as_server"("p_user_id" "uuid", "p_lesson_id" "text", "p_node_type" "text", "p_node_id" "text", "p_start_offset" integer, "p_end_offset" integer, "p_selected_text" "text", "p_prefix_text" "text", "p_suffix_text" "text", "p_note_text" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_delete_lesson_text_annotation_as_server"("p_user_id" "uuid", "p_annotation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_delete_lesson_text_annotation_as_server"("p_user_id" "uuid", "p_annotation_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_delete_reader_annotation"("p_annotation_id" "uuid", "p_expected_revision" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_delete_reader_annotation"("p_annotation_id" "uuid", "p_expected_revision" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_delete_reader_annotation_as_server"("p_user_id" "uuid", "p_annotation_id" "uuid", "p_expected_revision" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_delete_reader_annotation_as_server"("p_user_id" "uuid", "p_annotation_id" "uuid", "p_expected_revision" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_delete_reader_pronunciation_override"("p_override_id" "uuid", "p_expected_revision" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_delete_reader_pronunciation_override"("p_override_id" "uuid", "p_expected_revision" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_delete_reader_pronunciation_override_as_server"("p_user_id" "uuid", "p_override_id" "uuid", "p_expected_revision" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_delete_reader_pronunciation_override_as_server"("p_user_id" "uuid", "p_override_id" "uuid", "p_expected_revision" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_import_external_seed_package"("p_seed" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_import_external_seed_package"("p_seed" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."hanzihome_learning_loop_touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."hanzihome_learning_loop_touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hanzihome_learning_loop_touch_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_list_vocab_children"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_deleted" boolean, "p_section_keys" "text"[], "p_query" "text", "p_page" integer, "p_page_size" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_list_vocab_children"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_deleted" boolean, "p_section_keys" "text"[], "p_query" "text", "p_page" integer, "p_page_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hanzihome_list_vocab_children"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_deleted" boolean, "p_section_keys" "text"[], "p_query" "text", "p_page" integer, "p_page_size" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_mutate_content"("p_actor_id" "uuid", "p_operation" "text", "p_entity_type" "text", "p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text", "p_audit_operation" "text", "p_audit_entity_type" "text", "p_audit_entity_id" "text", "p_audit_parent_entity_type" "text", "p_audit_parent_entity_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_mutate_content"("p_actor_id" "uuid", "p_operation" "text", "p_entity_type" "text", "p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text", "p_audit_operation" "text", "p_audit_entity_type" "text", "p_audit_entity_id" "text", "p_audit_parent_entity_type" "text", "p_audit_parent_entity_id" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_mutate_content_as_user"("p_operation" "text", "p_entity_type" "text", "p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text", "p_audit_operation" "text", "p_audit_entity_type" "text", "p_audit_entity_id" "text", "p_audit_parent_entity_type" "text", "p_audit_parent_entity_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_mutate_content_as_user"("p_operation" "text", "p_entity_type" "text", "p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text", "p_audit_operation" "text", "p_audit_entity_type" "text", "p_audit_entity_id" "text", "p_audit_parent_entity_type" "text", "p_audit_parent_entity_id" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."hanzihome_mutate_content_as_user"("p_operation" "text", "p_entity_type" "text", "p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text", "p_audit_operation" "text", "p_audit_entity_type" "text", "p_audit_entity_id" "text", "p_audit_parent_entity_type" "text", "p_audit_parent_entity_id" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."hanzihome_mutate_vocab_child_bulk"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_operation" "text", "p_expected_count" bigint, "p_expected_fingerprint" "text", "p_reason" "text", "p_section_keys" "text"[], "p_ids" "text"[], "p_query" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_mutate_vocab_child_bulk"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_operation" "text", "p_expected_count" bigint, "p_expected_fingerprint" "text", "p_reason" "text", "p_section_keys" "text"[], "p_ids" "text"[], "p_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hanzihome_mutate_vocab_child_bulk"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_operation" "text", "p_expected_count" bigint, "p_expected_fingerprint" "text", "p_reason" "text", "p_section_keys" "text"[], "p_ids" "text"[], "p_query" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_preview_vocab_child_bulk"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_deleted" boolean, "p_section_keys" "text"[], "p_ids" "text"[], "p_query" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_preview_vocab_child_bulk"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_deleted" boolean, "p_section_keys" "text"[], "p_ids" "text"[], "p_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hanzihome_preview_vocab_child_bulk"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_deleted" boolean, "p_section_keys" "text"[], "p_ids" "text"[], "p_query" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_purge_deleted_content_as_user"("p_entity_type" "text", "p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_purge_deleted_content_as_user"("p_entity_type" "text", "p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_reason" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."hanzihome_purge_deleted_content_as_user"("p_entity_type" "text", "p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_reason" "text") TO "authenticated";



GRANT ALL ON TABLE "public"."hanzihome_learning_loop_items" TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_rate_learning_loop_item"("p_item_id" "text", "p_rating" "text", "p_expected_revision" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_rate_learning_loop_item"("p_item_id" "text", "p_rating" "text", "p_expected_revision" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_rate_learning_loop_item_as_server"("p_user_id" "uuid", "p_item_id" "text", "p_rating" "text", "p_expected_revision" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_rate_learning_loop_item_as_server"("p_user_id" "uuid", "p_item_id" "text", "p_rating" "text", "p_expected_revision" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_refresh_external_seed_package"("p_seed" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_refresh_external_seed_package"("p_seed" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."hanzihome_studio_touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."hanzihome_studio_touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hanzihome_studio_touch_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hanzihome_touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."hanzihome_touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hanzihome_touch_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hanzihome_tts_clip_folder_owner_check"() TO "anon";
GRANT ALL ON FUNCTION "public"."hanzihome_tts_clip_folder_owner_check"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hanzihome_tts_clip_folder_owner_check"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_update_lesson_text_annotation_note_as_server"("p_user_id" "uuid", "p_annotation_id" "uuid", "p_note_text" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_update_lesson_text_annotation_note_as_server"("p_user_id" "uuid", "p_annotation_id" "uuid", "p_note_text" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_update_listening_item_as_user"("p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_update_listening_item_as_user"("p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."hanzihome_update_listening_item_as_user"("p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."hanzihome_update_radical_as_user"("p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_update_radical_as_user"("p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."hanzihome_update_radical_as_user"("p_entity_id" "text", "p_expected_updated_at" timestamp with time zone, "p_changes" "jsonb", "p_reason" "text") TO "authenticated";



GRANT ALL ON TABLE "public"."hanzihome_reader_annotations" TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_update_reader_annotation"("p_annotation_id" "uuid", "p_asset_id" "text", "p_color" "text", "p_end_offset" integer, "p_expected_revision" integer, "p_note_text" "text", "p_page_number" integer, "p_payload" "jsonb", "p_paragraph_id" "text", "p_selected_text" "text", "p_start_offset" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_update_reader_annotation"("p_annotation_id" "uuid", "p_asset_id" "text", "p_color" "text", "p_end_offset" integer, "p_expected_revision" integer, "p_note_text" "text", "p_page_number" integer, "p_payload" "jsonb", "p_paragraph_id" "text", "p_selected_text" "text", "p_start_offset" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_update_reader_annotation_as_server"("p_user_id" "uuid", "p_annotation_id" "uuid", "p_asset_id" "text", "p_color" "text", "p_end_offset" integer, "p_expected_revision" integer, "p_note_text" "text", "p_page_number" integer, "p_payload" "jsonb", "p_paragraph_id" "text", "p_selected_text" "text", "p_start_offset" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_update_reader_annotation_as_server"("p_user_id" "uuid", "p_annotation_id" "uuid", "p_asset_id" "text", "p_color" "text", "p_end_offset" integer, "p_expected_revision" integer, "p_note_text" "text", "p_page_number" integer, "p_payload" "jsonb", "p_paragraph_id" "text", "p_selected_text" "text", "p_start_offset" integer) TO "service_role";



GRANT ALL ON TABLE "public"."hanzihome_daily_reading_state" TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_upsert_daily_reading_state"("p_published_date" "date", "p_state" "jsonb", "p_expected_revision" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_upsert_daily_reading_state"("p_published_date" "date", "p_state" "jsonb", "p_expected_revision" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_upsert_daily_reading_state_as_server"("p_user_id" "uuid", "p_published_date" "date", "p_state" "jsonb", "p_expected_revision" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_upsert_daily_reading_state_as_server"("p_user_id" "uuid", "p_published_date" "date", "p_state" "jsonb", "p_expected_revision" integer) TO "service_role";



GRANT ALL ON TABLE "public"."hanzihome_pdf_annotations" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."hanzihome_pdf_annotations" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."hanzihome_upsert_pdf_annotation"("p_asset_id" "text", "p_page_number" integer, "p_payload" "jsonb", "p_expected_revision" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_upsert_pdf_annotation"("p_asset_id" "text", "p_page_number" integer, "p_payload" "jsonb", "p_expected_revision" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hanzihome_upsert_pdf_annotation"("p_asset_id" "text", "p_page_number" integer, "p_payload" "jsonb", "p_expected_revision" integer) TO "service_role";



GRANT ALL ON TABLE "public"."hanzihome_personal_learning_state" TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_upsert_personal_learning_state"("p_node_id" "text", "p_state" "jsonb", "p_expected_revision" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_upsert_personal_learning_state"("p_node_id" "text", "p_state" "jsonb", "p_expected_revision" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_upsert_personal_learning_state_as_server"("p_user_id" "uuid", "p_node_id" "text", "p_state" "jsonb", "p_expected_revision" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_upsert_personal_learning_state_as_server"("p_user_id" "uuid", "p_node_id" "text", "p_state" "jsonb", "p_expected_revision" integer) TO "service_role";



GRANT ALL ON TABLE "public"."hanzihome_reader_progress" TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_upsert_reader_progress"("p_document_id" "text", "p_show_pinyin" boolean, "p_show_meaning" boolean, "p_completed" boolean, "p_summary_text" "text", "p_answers" "jsonb", "p_expected_revision" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_upsert_reader_progress"("p_document_id" "text", "p_show_pinyin" boolean, "p_show_meaning" boolean, "p_completed" boolean, "p_summary_text" "text", "p_answers" "jsonb", "p_expected_revision" integer) TO "service_role";



GRANT ALL ON TABLE "public"."hanzihome_reader_pronunciation_overrides" TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_upsert_reader_pronunciation_override"("p_override_id" "uuid", "p_document_id" "text", "p_paragraph_id" "text", "p_text" "text", "p_readings" "text"[], "p_scope" "text", "p_sentence_text" "text", "p_start_offset" integer, "p_end_offset" integer, "p_expected_revision" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_upsert_reader_pronunciation_override"("p_override_id" "uuid", "p_document_id" "text", "p_paragraph_id" "text", "p_text" "text", "p_readings" "text"[], "p_scope" "text", "p_sentence_text" "text", "p_start_offset" integer, "p_end_offset" integer, "p_expected_revision" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_upsert_reader_pronunciation_override_as_server"("p_user_id" "uuid", "p_override_id" "uuid", "p_document_id" "text", "p_paragraph_id" "text", "p_text" "text", "p_readings" "text"[], "p_scope" "text", "p_sentence_text" "text", "p_start_offset" integer, "p_end_offset" integer, "p_expected_revision" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_upsert_reader_pronunciation_override_as_server"("p_user_id" "uuid", "p_override_id" "uuid", "p_document_id" "text", "p_paragraph_id" "text", "p_text" "text", "p_readings" "text"[], "p_scope" "text", "p_sentence_text" "text", "p_start_offset" integer, "p_end_offset" integer, "p_expected_revision" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."hanzihome_vocab_child_candidates"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_deleted" boolean, "p_section_keys" "text"[], "p_ids" "text"[], "p_query" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hanzihome_vocab_child_candidates"("p_entity_type" "text", "p_scope_type" "text", "p_scope_id" "text", "p_deleted" boolean, "p_section_keys" "text"[], "p_ids" "text"[], "p_query" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_hanzihome_content_editor"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_hanzihome_content_editor"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_hanzihome_content_editor"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_hanzihome_html_artifact_folders_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_hanzihome_html_artifact_folders_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_hanzihome_html_artifact_runtime_states_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_hanzihome_html_artifact_runtime_states_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_hanzihome_html_artifacts_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_hanzihome_html_artifacts_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_hanzihome_memory_tips_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_hanzihome_memory_tips_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_hanzihome_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_hanzihome_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_note_short_id"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_note_short_id"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."touch_note_folder_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."touch_note_folder_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_note_folder_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_note_folder_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_lesson_text_annotation_note"("p_annotation_id" "uuid", "p_note_text" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_lesson_text_annotation_note"("p_annotation_id" "uuid", "p_note_text" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."upsert_legacy_vocabulary_cache"("p_hanzi" "text", "p_pinyin" "text", "p_sino_vietnamese" "text", "p_meaning" "text", "p_analysis" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_legacy_vocabulary_cache"("p_hanzi" "text", "p_pinyin" "text", "p_sino_vietnamese" "text", "p_meaning" "text", "p_analysis" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_note_folder_depth"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_note_folder_depth"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_note_folder_depth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_note_folder_depth"() TO "service_role";



GRANT ALL ON TABLE "public"."ai_characters" TO "service_role";



GRANT ALL ON TABLE "public"."ai_conversation_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."ai_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_memories" TO "service_role";



GRANT ALL ON TABLE "public"."ai_memory_evidence" TO "service_role";



GRANT ALL ON TABLE "public"."ai_relationship_states" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."dictionary_core" TO "authenticated";
GRANT ALL ON TABLE "public"."dictionary_core" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."hanzihome_content_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."hanzihome_content_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."hanzihome_content_editors" TO "service_role";
GRANT SELECT ON TABLE "public"."hanzihome_content_editors" TO "authenticated";



GRANT ALL ON TABLE "public"."hanzihome_content_roles" TO "service_role";
GRANT SELECT ON TABLE "public"."hanzihome_content_roles" TO "authenticated";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."hanzihome_course_books" TO "authenticated";
GRANT ALL ON TABLE "public"."hanzihome_course_books" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."hanzihome_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."hanzihome_courses" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."hanzihome_grammar_detail_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."hanzihome_grammar_detail_sections" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."hanzihome_grammar_examples" TO "authenticated";
GRANT ALL ON TABLE "public"."hanzihome_grammar_examples" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."hanzihome_grammar_points" TO "authenticated";
GRANT ALL ON TABLE "public"."hanzihome_grammar_points" TO "service_role";



GRANT ALL ON TABLE "public"."hanzihome_html_artifact_folders" TO "authenticated";
GRANT ALL ON TABLE "public"."hanzihome_html_artifact_folders" TO "service_role";



GRANT ALL ON TABLE "public"."hanzihome_html_artifact_runtime_states" TO "authenticated";
GRANT ALL ON TABLE "public"."hanzihome_html_artifact_runtime_states" TO "service_role";



GRANT ALL ON TABLE "public"."hanzihome_html_artifacts" TO "authenticated";
GRANT ALL ON TABLE "public"."hanzihome_html_artifacts" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."hanzihome_lesson_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."hanzihome_lesson_sections" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."hanzihome_lesson_texts" TO "authenticated";
GRANT ALL ON TABLE "public"."hanzihome_lesson_texts" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."hanzihome_lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."hanzihome_lessons" TO "service_role";



GRANT ALL ON TABLE "public"."hanzihome_listening_audio" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."hanzihome_listening_audio" TO "authenticated";



GRANT ALL ON TABLE "public"."hanzihome_listening_items" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."hanzihome_listening_items" TO "authenticated";



GRANT ALL ON TABLE "public"."hanzihome_memory_tips" TO "authenticated";
GRANT ALL ON TABLE "public"."hanzihome_memory_tips" TO "service_role";



GRANT ALL ON TABLE "public"."hanzihome_practice_attempts" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."hanzihome_radicals" TO "authenticated";
GRANT ALL ON TABLE "public"."hanzihome_radicals" TO "service_role";



GRANT ALL ON TABLE "public"."hanzihome_tts_clips" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."hanzihome_tts_clips" TO "authenticated";



GRANT ALL ON TABLE "public"."hanzihome_tts_folders" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."hanzihome_tts_folders" TO "authenticated";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."hanzihome_vocab_detail_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."hanzihome_vocab_detail_sections" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."hanzihome_vocab_examples" TO "authenticated";
GRANT ALL ON TABLE "public"."hanzihome_vocab_examples" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."hanzihome_vocab_items" TO "authenticated";
GRANT ALL ON TABLE "public"."hanzihome_vocab_items" TO "service_role";



GRANT ALL ON TABLE "public"."lesson_note_links" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_note_links" TO "service_role";



GRANT ALL ON TABLE "public"."lesson_text_annotations" TO "service_role";



GRANT ALL ON TABLE "public"."note_folders" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."note_folders" TO "authenticated";



GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON TABLE "public"."user_ai_prompt_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_ai_prompt_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."user_api_keys" TO "service_role";



GRANT ALL ON TABLE "public"."user_learning_state" TO "authenticated";
GRANT ALL ON TABLE "public"."user_learning_state" TO "service_role";



GRANT ALL ON TABLE "public"."user_vocab_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_vocab_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_vocabularies" TO "authenticated";
GRANT ALL ON TABLE "public"."user_vocabularies" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vocabularies" TO "service_role";
GRANT SELECT ON TABLE "public"."vocabularies" TO "authenticated";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


-- This application trigger belongs to the public schema function above, while
-- auth.users is owned by Supabase's managed auth schema and therefore absent
-- from the public-schema dump.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Supabase's managed local image provisions pg_net, but the linked production
-- schema does not retain it. The private mutation function is intentionally
-- outside public and was therefore not part of the original public-only dump.
DROP EXTENSION IF EXISTS "pg_net";
CREATE SCHEMA IF NOT EXISTS "private";

CREATE OR REPLACE FUNCTION private.hanzihome_mutate_content(p_actor_id uuid, p_operation text, p_entity_type text, p_entity_id text DEFAULT NULL::text, p_expected_updated_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_changes jsonb DEFAULT '{}'::jsonb, p_reason text DEFAULT NULL::text, p_audit_operation text DEFAULT NULL::text, p_audit_entity_type text DEFAULT NULL::text, p_audit_entity_id text DEFAULT NULL::text, p_audit_parent_entity_type text DEFAULT NULL::text, p_audit_parent_entity_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_table_name text;
  v_owner_column text;
  v_parent_entity_type text;
  v_parent_id_column text;
  v_parent_id text;
  v_order_column text;
  v_allowed_columns text[];
  v_change_key text;
  v_set_clause text;
  v_new_id text;
  v_before jsonb;
  v_after jsonb;
  v_insert_data jsonb;
  v_current_updated_at timestamptz;
  v_current_order integer;
  v_next_order integer;
  v_sibling_id text;
  v_parent_exists boolean;
begin
  if p_actor_id is null then
    raise exception using errcode = '28000', message = 'Authenticated actor is required';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception using errcode = '22023', message = 'Mutation reason is required';
  end if;
  if p_operation not in ('create', 'update', 'delete', 'restore', 'reorder') then
    raise exception using errcode = '22023', message = 'Unsupported HanziHome mutation operation';
  end if;
  if jsonb_typeof(coalesce(p_changes, '{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023', message = 'Mutation changes must be an object';
  end if;

  case p_entity_type
    when 'course' then
      v_table_name := 'hanzihome_courses';
      v_owner_column := 'user_id';
      v_order_column := 'course_order';
      v_allowed_columns := array['slug', 'title', 'subtitle', 'type', 'course_order'];
    when 'book' then
      v_table_name := 'hanzihome_course_books';
      v_owner_column := 'user_id';
      v_parent_entity_type := 'course';
      v_parent_id_column := 'course_id';
      v_order_column := 'book_order';
      v_allowed_columns := array['course_id', 'title', 'short_title', 'book_order'];
    when 'lesson' then
      v_table_name := 'hanzihome_lessons';
      v_owner_column := 'owner_id';
      v_parent_entity_type := 'book';
      v_parent_id_column := 'book_id';
      v_order_column := 'lesson_order';
      v_allowed_columns := array['course_id', 'book_id', 'lesson_number', 'lesson_order', 'title_zh', 'title_pinyin', 'title_vi', 'title_en', 'tags', 'source_file'];
    when 'section' then
      v_table_name := 'hanzihome_lesson_sections';
      v_owner_column := 'owner_id';
      v_parent_entity_type := 'lesson';
      v_parent_id_column := 'lesson_id';
      v_order_column := 'section_order';
      v_allowed_columns := array['lesson_id', 'source_section_id', 'section_key', 'section_type', 'title', 'title_vi', 'section_order', 'payload', 'source_file'];
    when 'lesson_text' then
      v_table_name := 'hanzihome_lesson_texts';
      v_owner_column := 'owner_id';
      v_parent_entity_type := 'lesson';
      v_parent_id_column := 'lesson_id';
      v_allowed_columns := array['lesson_id', 'text_key', 'title', 'content', 'content_format'];
    when 'vocab_item' then
      v_table_name := 'hanzihome_vocab_items';
      v_owner_column := 'owner_id';
      v_parent_entity_type := 'lesson';
      v_parent_id_column := 'lesson_id';
      v_order_column := 'item_order';
      v_allowed_columns := array['lesson_id', 'course_id', 'book_id', 'item_order', 'word', 'pinyin', 'han_viet', 'meaning', 'meaning_en', 'category', 'level', 'pos_vi', 'pos_zh', 'tone', 'tags', 'source_file'];
    when 'vocab_example' then
      v_table_name := 'hanzihome_vocab_examples';
      v_owner_column := 'owner_id';
      v_parent_entity_type := 'vocab_item';
      v_parent_id_column := 'vocab_item_id';
      v_order_column := 'example_order';
      v_allowed_columns := array['vocab_item_id', 'lesson_id', 'example_order', 'zh', 'pinyin', 'vi', 'note'];
    when 'vocab_detail_section' then
      v_table_name := 'hanzihome_vocab_detail_sections';
      v_owner_column := 'owner_id';
      v_parent_entity_type := 'vocab_item';
      v_parent_id_column := 'vocab_item_id';
      v_order_column := 'section_order';
      v_allowed_columns := array['vocab_item_id', 'lesson_id', 'section_key', 'title', 'lines', 'section_order'];
    when 'grammar_point' then
      v_table_name := 'hanzihome_grammar_points';
      v_owner_column := 'owner_id';
      v_parent_entity_type := 'lesson';
      v_parent_id_column := 'lesson_id';
      v_order_column := 'point_order';
      v_allowed_columns := array['lesson_id', 'course_id', 'book_id', 'point_order', 'title', 'title_vi', 'clean_title', 'level', 'core', 'content_md', 'structures_view', 'notes', 'tags'];
    when 'grammar_example' then
      v_table_name := 'hanzihome_grammar_examples';
      v_owner_column := 'owner_id';
      v_parent_entity_type := 'grammar_point';
      v_parent_id_column := 'grammar_point_id';
      v_order_column := 'example_order';
      v_allowed_columns := array['grammar_point_id', 'lesson_id', 'example_order', 'zh', 'pinyin', 'vi', 'note'];
    when 'grammar_detail_section' then
      v_table_name := 'hanzihome_grammar_detail_sections';
      v_owner_column := 'owner_id';
      v_parent_entity_type := 'grammar_point';
      v_parent_id_column := 'grammar_point_id';
      v_order_column := 'section_order';
      v_allowed_columns := array['grammar_point_id', 'lesson_id', 'section_key', 'title', 'lines', 'section_order'];
    else
      raise exception using errcode = '22023', message = 'Unsupported HanziHome entity type';
  end case;

  for v_change_key in select jsonb_object_keys(coalesce(p_changes, '{}'::jsonb))
  loop
    if not (v_change_key = any(v_allowed_columns)) then
      raise exception using errcode = '22023', message = format('Field %s is not editable for %s', v_change_key, p_entity_type);
    end if;
    if p_operation <> 'create' and v_change_key = any(array['course_id', 'book_id', 'lesson_id', 'vocab_item_id', 'grammar_point_id']) then
      raise exception using errcode = '22023', message = 'Parent relationships cannot be changed by update';
    end if;
  end loop;

  if p_operation = 'create' then
    v_new_id := coalesce(nullif(p_entity_id, ''), gen_random_uuid()::text);
    v_insert_data := coalesce(p_changes, '{}'::jsonb)
      || jsonb_build_object('id', v_new_id, 'source', 'custom', v_owner_column, p_actor_id, 'created_at', now(), 'updated_at', now());

    if v_order_column is not null and not (v_insert_data ? v_order_column) then
      if v_parent_id_column is null then
        execute format('select coalesce(max(%I), 0) + 1 from public.%I where deleted_at is null', v_order_column, v_table_name)
          into v_next_order;
      else
        v_parent_id := v_insert_data ->> v_parent_id_column;
        execute format('select coalesce(max(%I), 0) + 1 from public.%I where %I = $1 and deleted_at is null', v_order_column, v_table_name, v_parent_id_column)
          using v_parent_id into v_next_order;
      end if;
      v_insert_data := v_insert_data || jsonb_build_object(v_order_column, v_next_order);
    end if;

    if v_parent_id_column is not null then
      v_parent_id := nullif(v_insert_data ->> v_parent_id_column, '');
      if v_parent_id is null then
        raise exception using errcode = '23503', message = format('%s is required', v_parent_id_column);
      end if;

      case v_parent_entity_type
        when 'course' then execute 'select exists(select 1 from public.hanzihome_courses where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
        when 'book' then execute 'select exists(select 1 from public.hanzihome_course_books where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
        when 'lesson' then execute 'select exists(select 1 from public.hanzihome_lessons where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
        when 'vocab_item' then execute 'select exists(select 1 from public.hanzihome_vocab_items where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
        when 'grammar_point' then execute 'select exists(select 1 from public.hanzihome_grammar_points where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
      end case;
      if not coalesce(v_parent_exists, false) then
        raise exception using errcode = '23503', message = 'Active parent entity was not found';
      end if;
    end if;

    if p_entity_type = 'lesson' and not exists (
      select 1
      from public.hanzihome_course_books book
      where book.id = v_insert_data ->> 'book_id'
        and book.course_id = v_insert_data ->> 'course_id'
        and book.deleted_at is null
    ) then
      raise exception using errcode = '23503', message = 'Book does not belong to the requested course';
    end if;

    if p_entity_type in ('vocab_item', 'grammar_point') and not exists (
      select 1
      from public.hanzihome_lessons lesson
      where lesson.id = v_insert_data ->> 'lesson_id'
        and lesson.course_id = v_insert_data ->> 'course_id'
        and lesson.book_id = v_insert_data ->> 'book_id'
        and lesson.deleted_at is null
    ) then
      raise exception using errcode = '23503', message = 'Lesson hierarchy does not match course and book';
    end if;

    if p_entity_type in ('vocab_example', 'vocab_detail_section') and not exists (
      select 1
      from public.hanzihome_vocab_items item
      where item.id = v_insert_data ->> 'vocab_item_id'
        and item.lesson_id = v_insert_data ->> 'lesson_id'
        and item.deleted_at is null
    ) then
      raise exception using errcode = '23503', message = 'Vocabulary child does not belong to the requested lesson';
    end if;

    if p_entity_type in ('grammar_example', 'grammar_detail_section') and not exists (
      select 1
      from public.hanzihome_grammar_points point
      where point.id = v_insert_data ->> 'grammar_point_id'
        and point.lesson_id = v_insert_data ->> 'lesson_id'
        and point.deleted_at is null
    ) then
      raise exception using errcode = '23503', message = 'Grammar child does not belong to the requested lesson';
    end if;

    execute format(
      'insert into public.%1$I as inserted select (jsonb_populate_record(null::public.%1$I, $1)).* returning to_jsonb(inserted.*)',
      v_table_name
    ) using v_insert_data into v_after;
  else
    if p_entity_id is null or length(trim(p_entity_id)) = 0 then
      raise exception using errcode = '22023', message = 'Entity id is required';
    end if;
    execute format('select to_jsonb(t), t.updated_at from public.%I t where t.id::text = $1 for update', v_table_name)
      using p_entity_id into v_before, v_current_updated_at;
    if v_before is null then
      raise exception using errcode = 'P0002', message = 'HanziHome entity not found';
    end if;
    if p_expected_updated_at is null or v_current_updated_at <> p_expected_updated_at then
      raise exception using errcode = '40001', message = 'HanziHome entity changed since it was loaded';
    end if;
    if p_operation <> 'restore' and v_before ->> 'deleted_at' is not null then
      raise exception using errcode = '22023', message = 'Deleted content must be restored before it can be changed';
    end if;

    v_parent_id := case when v_parent_id_column is null then null else v_before ->> v_parent_id_column end;

    if p_operation <> 'restore' and v_parent_entity_type is not null then
      case v_parent_entity_type
        when 'course' then execute 'select exists(select 1 from public.hanzihome_courses where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
        when 'book' then execute 'select exists(select 1 from public.hanzihome_course_books where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
        when 'lesson' then execute 'select exists(select 1 from public.hanzihome_lessons where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
        when 'vocab_item' then execute 'select exists(select 1 from public.hanzihome_vocab_items where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
        when 'grammar_point' then execute 'select exists(select 1 from public.hanzihome_grammar_points where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
      end case;
      if not coalesce(v_parent_exists, false) then
        raise exception using errcode = '23503', message = 'Active parent entity was not found';
      end if;
    end if;

    if p_operation = 'update' then
      if p_changes = '{}'::jsonb then
        raise exception using errcode = '22023', message = 'Update requires at least one changed field';
      end if;

      select string_agg(
        format('%1$I = patch.%1$I', attribute.attname),
        ', '
      )
      into v_set_clause
      from pg_attribute attribute
      where attribute.attrelid = format('public.%s', v_table_name)::regclass
        and attribute.attnum > 0
        and not attribute.attisdropped
        and attribute.attname in (select jsonb_object_keys(p_changes));

      if v_set_clause is null then
        raise exception using errcode = '22023', message = 'No editable changes were provided';
      end if;

      execute format(
        'update public.%1$I target set %2$s from jsonb_populate_record(null::public.%1$I, $1) patch where target.id::text = $2 returning to_jsonb(target.*)',
        v_table_name,
        v_set_clause
      ) using p_changes, p_entity_id into v_after;
    elsif p_operation = 'reorder' then
      if v_order_column is null or not (p_changes ? v_order_column) then
        raise exception using errcode = '22023', message = 'Reorder requires the owned order field';
      end if;
      if (select count(*) from jsonb_object_keys(p_changes)) <> 1 then
        raise exception using errcode = '22023', message = 'Reorder only accepts the owned order field';
      end if;

      v_current_order := (v_before ->> v_order_column)::integer;
      v_next_order := (p_changes ->> v_order_column)::integer;
      if v_next_order < 1 then
        raise exception using errcode = '22023', message = 'Order must be a positive integer';
      end if;

      if v_next_order = v_current_order then
        v_after := v_before;
      else
        if v_parent_id_column is null then
          execute format(
            'select id::text from public.%I where %I = $1 and deleted_at is null and id::text <> $2 limit 1 for update',
            v_table_name,
            v_order_column
          ) using v_next_order, p_entity_id into v_sibling_id;
        else
          execute format(
            'select id::text from public.%I where %I = $1 and %I = $2 and deleted_at is null and id::text <> $3 limit 1 for update',
            v_table_name,
            v_order_column,
            v_parent_id_column
          ) using v_next_order, v_parent_id, p_entity_id into v_sibling_id;
        end if;

        if v_sibling_id is not null then
          execute format(
            'update public.%I set %I = $1 where id::text = $2',
            v_table_name,
            v_order_column
          ) using -2147483648, p_entity_id;
          execute format(
            'update public.%I set %I = $1 where id::text = $2',
            v_table_name,
            v_order_column
          ) using v_current_order, v_sibling_id;
        end if;

        execute format(
          'update public.%I set %I = $1 where id::text = $2 returning to_jsonb(%I.*)',
          v_table_name,
          v_order_column,
          v_table_name
        ) using v_next_order, p_entity_id into v_after;
      end if;
    elsif p_operation = 'delete' then
      if v_before ->> 'deleted_at' is not null then
        raise exception using errcode = '22023', message = 'Entity is already deleted';
      end if;
      execute format('update public.%I set deleted_at = now(), deleted_by = $1 where id::text = $2 returning to_jsonb(%I.*)', v_table_name, v_table_name)
        using p_actor_id, p_entity_id into v_after;
    elsif p_operation = 'restore' then
      if v_before ->> 'deleted_at' is null then
        raise exception using errcode = '22023', message = 'Entity is not deleted';
      end if;
      execute format('update public.%I set deleted_at = null, deleted_by = null where id::text = $1 returning to_jsonb(%I.*)', v_table_name, v_table_name)
        using p_entity_id into v_after;
    end if;
  end if;

  insert into public.hanzihome_content_audit_log (
    actor_id,
    operation,
    entity_type,
    entity_id,
    parent_entity_type,
    parent_entity_id,
    before_data,
    after_data,
    reason
  ) values (
    p_actor_id,
    coalesce(p_audit_operation, p_operation),
    coalesce(p_audit_entity_type, p_entity_type),
    coalesce(p_audit_entity_id, p_entity_id, v_new_id),
    coalesce(p_audit_parent_entity_type, v_parent_entity_type),
    coalesce(p_audit_parent_entity_id, v_parent_id),
    v_before,
    v_after,
    trim(p_reason)
  );

  return jsonb_build_object('item', v_after);
end;
$function$
;

REVOKE ALL ON SCHEMA "private" FROM PUBLIC;
GRANT USAGE ON SCHEMA "private" TO "service_role";

REVOKE ALL ON FUNCTION private.hanzihome_mutate_content(uuid, text, text, text, timestamp with time zone, jsonb, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.hanzihome_mutate_content(uuid, text, text, text, timestamp with time zone, jsonb, text, text, text, text, text, text) TO "service_role";

COMMENT ON FUNCTION private.hanzihome_mutate_content(uuid, text, text, text, timestamp with time zone, jsonb, text, text, text, text, text, text) IS
  'Server-only canonical HanziHome CRUD boundary. Applies optimistic concurrency and writes the audit record in the same transaction.';
