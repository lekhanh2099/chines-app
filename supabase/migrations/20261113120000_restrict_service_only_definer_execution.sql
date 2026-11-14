begin;

-- Supabase's default privileges grant EXECUTE on new public functions directly
-- to anon and authenticated. The captured baseline only revoked PUBLIC, so on
-- any database rebuilt from migrations these service-only SECURITY DEFINER
-- RPCs stay callable through PostgREST with the browser key. The *_as_server
-- wrappers set request.jwt.claim.sub from p_user_id and the ai_* functions
-- filter by p_user_id without checking the caller, so that grant lets one user
-- read or modify another user's data. Every in-app caller uses the service
-- role (verified at the time of writing), which keeps its grant.
-- 20261024124241 applied the same correction to upsert_legacy_vocabulary_cache.

revoke execute on function public.ai_apply_summary_for_job(uuid, uuid, text, bigint, integer)
 from public, anon, authenticated;
grant execute on function public.ai_apply_summary_for_job(uuid, uuid, text, bigint, integer)
 to service_role;

revoke execute on function public.ai_evolve_relationship_for_job(uuid, uuid, numeric)
 from public, anon, authenticated;
grant execute on function public.ai_evolve_relationship_for_job(uuid, uuid, numeric)
 to service_role;

revoke execute on function public.ai_finish_post_turn_job(uuid, uuid, boolean, text)
 from public, anon, authenticated;
grant execute on function public.ai_finish_post_turn_job(uuid, uuid, boolean, text)
 to service_role;

revoke execute on function public.ai_match_memories(uuid, uuid, text, integer, double precision)
 from public, anon, authenticated;
grant execute on function public.ai_match_memories(uuid, uuid, text, integer, double precision)
 to service_role;

revoke execute on function public.ai_set_memory_embedding(uuid, uuid, text, text, integer)
 from public, anon, authenticated;
grant execute on function public.ai_set_memory_embedding(uuid, uuid, text, text, integer)
 to service_role;

revoke execute on function public.hanzihome_create_lesson_text_annotation_as_server(uuid, text, text, text, integer, integer, text, text, text, text)
 from public, anon, authenticated;
grant execute on function public.hanzihome_create_lesson_text_annotation_as_server(uuid, text, text, text, integer, integer, text, text, text, text)
 to service_role;

revoke execute on function public.hanzihome_delete_lesson_text_annotation_as_server(uuid, uuid)
 from public, anon, authenticated;
grant execute on function public.hanzihome_delete_lesson_text_annotation_as_server(uuid, uuid)
 to service_role;

revoke execute on function public.hanzihome_delete_reader_annotation_as_server(uuid, uuid, integer)
 from public, anon, authenticated;
grant execute on function public.hanzihome_delete_reader_annotation_as_server(uuid, uuid, integer)
 to service_role;

revoke execute on function public.hanzihome_delete_reader_pronunciation_override_as_server(uuid, uuid, integer)
 from public, anon, authenticated;
grant execute on function public.hanzihome_delete_reader_pronunciation_override_as_server(uuid, uuid, integer)
 to service_role;

revoke execute on function public.hanzihome_rate_learning_loop_item_as_server(uuid, text, text, integer)
 from public, anon, authenticated;
grant execute on function public.hanzihome_rate_learning_loop_item_as_server(uuid, text, text, integer)
 to service_role;

revoke execute on function public.hanzihome_update_reader_annotation_as_server(uuid, uuid, text, text, integer, integer, text, integer, jsonb, text, text, integer)
 from public, anon, authenticated;
grant execute on function public.hanzihome_update_reader_annotation_as_server(uuid, uuid, text, text, integer, integer, text, integer, jsonb, text, text, integer)
 to service_role;

revoke execute on function public.hanzihome_upsert_daily_reading_state_as_server(uuid, date, jsonb, integer)
 from public, anon, authenticated;
grant execute on function public.hanzihome_upsert_daily_reading_state_as_server(uuid, date, jsonb, integer)
 to service_role;

revoke execute on function public.hanzihome_upsert_personal_learning_state_as_server(uuid, text, jsonb, integer)
 from public, anon, authenticated;
grant execute on function public.hanzihome_upsert_personal_learning_state_as_server(uuid, text, jsonb, integer)
 to service_role;

revoke execute on function public.hanzihome_upsert_reader_pronunciation_override_as_server(uuid, uuid, text, text, text, text[], text, text, integer, integer, integer)
 from public, anon, authenticated;
grant execute on function public.hanzihome_upsert_reader_pronunciation_override_as_server(uuid, uuid, text, text, text, text[], text, text, integer, integer, integer)
 to service_role;

-- Seed maintenance RPCs already reject non-service callers in their bodies;
-- the grants are aligned so the boundary does not depend on that check alone.
revoke execute on function public.hanzihome_import_external_seed_package(jsonb)
 from public, anon, authenticated;
grant execute on function public.hanzihome_import_external_seed_package(jsonb) to service_role;

revoke execute on function public.hanzihome_refresh_external_seed_package(jsonb)
 from public, anon, authenticated;
grant execute on function public.hanzihome_refresh_external_seed_package(jsonb) to service_role;

revoke execute on function public.hanzihome_apply_external_seed_patches(jsonb)
 from public, anon, authenticated;
grant execute on function public.hanzihome_apply_external_seed_patches(jsonb) to service_role;

-- Defense in depth: each function also rejects non-service callers itself, so
-- the boundary does not depend on grants alone (an accidental re-grant or a
-- default-privilege grant would otherwise reopen it). The guard is fail-closed:
-- a missing role claim is rejected too. No pg_cron job, trigger or other
-- function calls these RPCs (verified at the time of writing); every caller is
-- the service-role server client, whose requests carry role = service_role.
-- Bodies are copied verbatim from their latest definition (20260820163000,
-- 20260821110000, 20260828090000) with only the guard added. CREATE OR REPLACE
-- keeps owner and ACL, so the grants above still apply.

CREATE OR REPLACE FUNCTION "public"."ai_apply_summary_for_job"("p_user_id" "uuid", "p_job_id" "uuid", "p_summary" "text" DEFAULT NULL::"text", "p_summary_until_seq" bigint DEFAULT NULL::bigint, "p_expected_summary_version" integer DEFAULT NULL::integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_job public.ai_post_turn_jobs%rowtype;
  v_conversation public.ai_conversations%rowtype;
  v_changed boolean := false;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
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

CREATE OR REPLACE FUNCTION "public"."ai_evolve_relationship_for_job"("p_user_id" "uuid", "p_job_id" "uuid", "p_increment" numeric) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_job public.ai_post_turn_jobs%rowtype;
  v_character_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
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

CREATE OR REPLACE FUNCTION "public"."ai_finish_post_turn_job"("p_user_id" "uuid", "p_job_id" "uuid", "p_succeeded" boolean, "p_error" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_job public.ai_post_turn_jobs%rowtype;
  v_backoff_seconds double precision;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
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

CREATE OR REPLACE FUNCTION "public"."ai_set_memory_embedding"("p_user_id" "uuid", "p_memory_id" "uuid", "p_embedding" "text", "p_embedding_model" "text", "p_embedding_version" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
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

CREATE OR REPLACE FUNCTION "public"."hanzihome_delete_reader_annotation_as_server"("p_user_id" "uuid", "p_annotation_id" "uuid", "p_expected_revision" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_delete_reader_annotation(p_annotation_id, p_expected_revision);
end;
$$;

CREATE OR REPLACE FUNCTION "public"."hanzihome_delete_reader_pronunciation_override_as_server"("p_user_id" "uuid", "p_override_id" "uuid", "p_expected_revision" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_delete_reader_pronunciation_override(p_override_id, p_expected_revision);
end;
$$;

CREATE OR REPLACE FUNCTION "public"."hanzihome_rate_learning_loop_item_as_server"("p_user_id" "uuid", "p_item_id" "text", "p_rating" "text", "p_expected_revision" integer) RETURNS "public"."hanzihome_learning_loop_items"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_rate_learning_loop_item(p_item_id, p_rating, p_expected_revision);
end;
$$;

CREATE OR REPLACE FUNCTION "public"."hanzihome_update_reader_annotation_as_server"("p_user_id" "uuid", "p_annotation_id" "uuid", "p_asset_id" "text", "p_color" "text", "p_end_offset" integer, "p_expected_revision" integer, "p_note_text" "text", "p_page_number" integer, "p_payload" "jsonb", "p_paragraph_id" "text", "p_selected_text" "text", "p_start_offset" integer) RETURNS "public"."hanzihome_reader_annotations"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_update_reader_annotation(p_annotation_id, p_asset_id, p_color, p_end_offset, p_expected_revision, p_note_text, p_page_number, p_payload, p_paragraph_id, p_selected_text, p_start_offset);
end;
$$;

CREATE OR REPLACE FUNCTION "public"."hanzihome_upsert_daily_reading_state_as_server"("p_user_id" "uuid", "p_published_date" "date", "p_state" "jsonb", "p_expected_revision" integer) RETURNS "public"."hanzihome_daily_reading_state"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_upsert_daily_reading_state(p_published_date, p_state, p_expected_revision);
end;
$$;

CREATE OR REPLACE FUNCTION "public"."hanzihome_upsert_personal_learning_state_as_server"("p_user_id" "uuid", "p_node_id" "text", "p_state" "jsonb", "p_expected_revision" integer) RETURNS "public"."hanzihome_personal_learning_state"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_upsert_personal_learning_state(p_node_id, p_state, p_expected_revision);
end;
$$;

CREATE OR REPLACE FUNCTION "public"."hanzihome_upsert_reader_pronunciation_override_as_server"("p_user_id" "uuid", "p_override_id" "uuid", "p_document_id" "text", "p_paragraph_id" "text", "p_text" "text", "p_readings" "text"[], "p_scope" "text", "p_sentence_text" "text", "p_start_offset" integer, "p_end_offset" integer, "p_expected_revision" integer) RETURNS "public"."hanzihome_reader_pronunciation_overrides"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_upsert_reader_pronunciation_override(p_override_id, p_document_id, p_paragraph_id, p_text, p_readings, p_scope, p_sentence_text, p_start_offset, p_end_offset, p_expected_revision);
end;
$$;

CREATE OR REPLACE FUNCTION public.ai_forget_memories(
  p_user_id uuid,
  p_conversation_id uuid,
  p_memory_ids jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_character_id uuid;
  v_deleted integer := 0;
BEGIN
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
  IF jsonb_typeof(p_memory_ids) <> 'array' OR jsonb_array_length(p_memory_ids) > 20 THEN
    RAISE EXCEPTION 'AI memory ids must be a JSON array with at most 20 items' USING ERRCODE = '22023';
  END IF;

  SELECT c.character_id
  INTO v_character_id
  FROM public.ai_conversations c
  WHERE c.id = p_conversation_id
    AND c.user_id = p_user_id
    AND c.archived_at IS NULL;

  IF v_character_id IS NULL THEN
    RAISE EXCEPTION 'AI conversation not found' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.ai_memories m
  WHERE m.user_id = p_user_id
    AND m.status = 'active'
    AND (m.character_id IS NULL OR m.character_id = v_character_id)
    AND m.id IN (
      SELECT value::uuid
      FROM jsonb_array_elements_text(p_memory_ids)
    );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

CREATE OR REPLACE FUNCTION public.ai_apply_memory_changes(
  p_user_id uuid,
  p_job_id uuid,
  p_user_message_id uuid,
  p_changes jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_character_id uuid;
  v_change jsonb;
  v_target_id uuid;
BEGIN
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
  IF jsonb_typeof(p_changes) <> 'array' OR jsonb_array_length(p_changes) > 8 THEN
    RAISE EXCEPTION 'AI memory changes must be a JSON array with at most 8 items' USING ERRCODE = '22023';
  END IF;

  SELECT c.character_id
  INTO v_character_id
  FROM public.ai_post_turn_jobs j
  JOIN public.ai_conversations c
    ON c.id = j.conversation_id
   AND c.user_id = j.user_id
  WHERE j.id = p_job_id
    AND j.user_id = p_user_id
    AND j.status = 'processing';

  IF v_character_id IS NULL THEN
    RAISE EXCEPTION 'AI post-turn job is not owned or processing' USING ERRCODE = '42501';
  END IF;

  FOR v_change IN SELECT value FROM jsonb_array_elements(p_changes)
  LOOP
    IF nullif(v_change ->> 'targetMemoryId', '') IS NULL THEN
      CONTINUE;
    END IF;

    v_target_id := (v_change ->> 'targetMemoryId')::uuid;
    IF NOT EXISTS (
      SELECT 1
      FROM public.ai_memories m
      WHERE m.id = v_target_id
        AND m.user_id = p_user_id
        AND m.status = 'active'
        AND (m.character_id IS NULL OR m.character_id = v_character_id)
    ) THEN
      RAISE EXCEPTION 'AI memory lifecycle target is outside the current character scope'
        USING ERRCODE = '42501';
    END IF;
  END LOOP;

  RETURN public.ai_apply_memory_changes_unscoped(
    p_user_id,
    p_job_id,
    p_user_message_id,
    p_changes
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.ai_claim_post_turn_jobs(
  p_user_id uuid,
  p_conversation_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 2
)
RETURNS SETOF public.ai_post_turn_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
  RETURN QUERY
  WITH candidates AS (
    SELECT job.id
    FROM public.ai_post_turn_jobs AS job
    WHERE job.user_id = p_user_id
      AND (p_conversation_id IS NULL OR job.conversation_id = p_conversation_id)
      AND job.attempt_count < 5
      AND (
        (
          job.status IN ('pending', 'retry')
          AND job.available_at <= now()
        )
        OR (
          job.status = 'processing'
          AND job.locked_at <= now() - interval '15 minutes'
        )
      )
    ORDER BY
      CASE WHEN job.status = 'processing' THEN job.locked_at ELSE job.available_at END ASC,
      job.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT least(greatest(p_limit, 1), 5)
  )
  UPDATE public.ai_post_turn_jobs AS job
  SET
    status = 'processing',
    attempt_count = job.attempt_count + 1,
    locked_at = now(),
    updated_at = now()
  FROM candidates
  WHERE job.id = candidates.id
  RETURNING job.*;
END;
$$;

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
    -- SQL functions cannot raise; browser roles simply get no rows.
    and coalesce((select auth.role()), '') = 'service_role'
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

commit;
