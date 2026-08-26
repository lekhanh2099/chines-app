BEGIN;

ALTER TABLE public.user_api_keys
  ADD CONSTRAINT user_api_keys_user_id_id_key UNIQUE (user_id, id);

CREATE TABLE public.user_ai_task_assignments (
  user_id uuid NOT NULL,
  task_id text NOT NULL,
  mode text NOT NULL DEFAULT 'auto',
  api_key_id uuid,
  model text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_ai_task_assignments_pkey PRIMARY KEY (user_id, task_id),
  CONSTRAINT user_ai_task_assignments_task_id_check CHECK (
    task_id IN (
      'conversation.reply',
      'lookup.quick',
      'lookup.deep',
      'daily-reading.translation',
      'daily-reading.vocabulary',
      'daily-reading.grammar',
      'daily-reading.questions',
      'conversation.summary',
      'conversation.memory-extraction',
      'conversation.semantic-memory'
    )
  ),
  CONSTRAINT user_ai_task_assignments_mode_check CHECK (
    mode IN ('auto', 'assigned', 'disabled')
  ),
  CONSTRAINT user_ai_task_assignments_routing_fields_check CHECK (
    (
      mode = 'assigned'
      AND api_key_id IS NOT NULL
      AND model IS NOT NULL
      AND model = btrim(model)
      AND length(model) BETWEEN 1 AND 200
    )
    OR
    (
      mode IN ('auto', 'disabled')
      AND api_key_id IS NULL
      AND model IS NULL
    )
  ),
  CONSTRAINT user_ai_task_assignments_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE,
  CONSTRAINT user_ai_task_assignments_user_api_key_fkey
    FOREIGN KEY (user_id, api_key_id)
    REFERENCES public.user_api_keys(user_id, id)
    ON DELETE NO ACTION
    DEFERRABLE INITIALLY DEFERRED
);

COMMENT ON TABLE public.user_ai_task_assignments IS
  'Per-user AI task routing. Missing rows and auto rows preserve personal-key priority selection; assigned rows bind one owned active key and model; disabled rows block the task.';

COMMENT ON COLUMN public.user_ai_task_assignments.model IS
  'Exact provider model selected for an assigned task. Auto routing continues to use the key default model.';

CREATE INDEX user_ai_task_assignments_user_api_key_idx
  ON public.user_ai_task_assignments (user_id, api_key_id)
  WHERE api_key_id IS NOT NULL;

CREATE FUNCTION public.user_ai_task_assignment_validate_key()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.mode = 'assigned' AND NOT EXISTS (
    SELECT 1
    FROM public.user_api_keys AS user_api_key
    WHERE user_api_key.user_id = NEW.user_id
      AND user_api_key.id = NEW.api_key_id
      AND user_api_key.is_active = true
      AND (
        NEW.task_id <> 'conversation.semantic-memory'
        OR user_api_key.provider = 'gemini'
      )
  ) THEN
    RAISE EXCEPTION 'Assigned AI task key must be active, compatible, and owned by the same user'
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.user_ai_task_assignment_validate_key()
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_ai_task_assignment_validate_key()
TO service_role;

CREATE TRIGGER user_ai_task_assignments_validate_key
BEFORE INSERT OR UPDATE OF user_id, mode, api_key_id, model
ON public.user_ai_task_assignments
FOR EACH ROW
EXECUTE FUNCTION public.user_ai_task_assignment_validate_key();

CREATE FUNCTION public.user_api_key_prevent_assigned_deactivation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.is_active = true
    AND NEW.is_active = false
    AND EXISTS (
      SELECT 1
      FROM public.user_ai_task_assignments AS assignment
      WHERE assignment.user_id = OLD.user_id
        AND assignment.api_key_id = OLD.id
        AND assignment.mode = 'assigned'
    )
  THEN
    RAISE EXCEPTION 'AI key is assigned to one or more tasks'
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.user_api_key_prevent_assigned_deactivation()
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_api_key_prevent_assigned_deactivation()
TO service_role;

CREATE TRIGGER user_api_keys_prevent_assigned_deactivation
BEFORE UPDATE OF is_active
ON public.user_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.user_api_key_prevent_assigned_deactivation();

CREATE TRIGGER user_ai_task_assignments_updated_at
BEFORE UPDATE ON public.user_ai_task_assignments
FOR EACH ROW
EXECUTE FUNCTION public.ai_touch_updated_at();

ALTER TABLE public.user_ai_task_assignments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.user_ai_task_assignments
FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.user_ai_task_assignments
TO authenticated;
GRANT ALL ON TABLE public.user_ai_task_assignments
TO service_role;

CREATE POLICY "Users can view own AI task assignments"
ON public.user_ai_task_assignments
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own AI task assignments"
ON public.user_ai_task_assignments
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own AI task assignments"
ON public.user_ai_task_assignments
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own AI task assignments"
ON public.user_ai_task_assignments
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

COMMIT;
