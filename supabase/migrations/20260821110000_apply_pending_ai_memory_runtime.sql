BEGIN;

-- These three contracts are present in the application source but were never
-- applied to production. They remain forward-only because the baseline above
-- represents the exact live schema before this migration.
CREATE OR REPLACE FUNCTION public.ai_enqueue_post_turn_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.role <> 'assistant' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.ai_post_turn_jobs (
    user_id,
    conversation_id,
    assistant_message_id,
    kind,
    status
  )
  VALUES (
    NEW.user_id,
    NEW.conversation_id,
    NEW.id,
    'memory-summary',
    'pending'
  )
  ON CONFLICT (assistant_message_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ai_enqueue_post_turn_job() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ai_enqueue_post_turn_job() TO service_role;

DROP TRIGGER IF EXISTS ai_messages_enqueue_post_turn_job ON public.ai_messages;
CREATE TRIGGER ai_messages_enqueue_post_turn_job
AFTER INSERT ON public.ai_messages
FOR EACH ROW
WHEN (NEW.role = 'assistant')
EXECUTE FUNCTION public.ai_enqueue_post_turn_job();

COMMENT ON FUNCTION public.ai_enqueue_post_turn_job() IS
  'Creates one durable post-turn processing job in the same transaction as each persisted assistant message.';

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

REVOKE ALL ON FUNCTION public.ai_forget_memories(uuid, uuid, jsonb)
FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ai_forget_memories(uuid, uuid, jsonb)
TO service_role;

COMMENT ON FUNCTION public.ai_forget_memories(uuid, uuid, jsonb) IS
  'Server-only explicit user forget operation limited to global/current-character active memories.';

REVOKE ALL ON FUNCTION public.ai_apply_memory_changes(uuid, uuid, uuid, jsonb)
FROM public, anon, authenticated, service_role;

ALTER FUNCTION public.ai_apply_memory_changes(uuid, uuid, uuid, jsonb)
RENAME TO ai_apply_memory_changes_unscoped;

REVOKE ALL ON FUNCTION public.ai_apply_memory_changes_unscoped(uuid, uuid, uuid, jsonb)
FROM public, anon, authenticated, service_role;

CREATE FUNCTION public.ai_apply_memory_changes(
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

REVOKE ALL ON FUNCTION public.ai_apply_memory_changes(uuid, uuid, uuid, jsonb)
FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ai_apply_memory_changes(uuid, uuid, uuid, jsonb)
TO service_role;

COMMENT ON FUNCTION public.ai_apply_memory_changes(uuid, uuid, uuid, jsonb) IS
  'Server-only scoped wrapper that rejects cross-character lifecycle target ids before applying the transactional memory change set.';
COMMENT ON FUNCTION public.ai_apply_memory_changes_unscoped(uuid, uuid, uuid, jsonb) IS
  'Internal lifecycle implementation. Direct execution is revoked; callers must use the scoped ai_apply_memory_changes wrapper.';

COMMIT;
