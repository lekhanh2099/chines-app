BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TABLE public.user_ai_activity_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_id text NOT NULL,
  provider text,
  api_key_id uuid,
  key_label text,
  model text,
  resolution_source text,
  status text NOT NULL,
  error_code text,
  latency_ms integer,
  input_tokens bigint,
  output_tokens bigint,
  resource_type text,
  resource_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_ai_activity_events_pkey PRIMARY KEY (id),
  CONSTRAINT user_ai_activity_events_task_id_check CHECK (
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
  CONSTRAINT user_ai_activity_events_provider_check CHECK (
    provider IS NULL OR provider IN ('deepseek', 'gemini', 'openai', 'groq')
  ),
  CONSTRAINT user_ai_activity_events_key_label_check CHECK (
    key_label IS NULL
    OR (
      key_label = btrim(key_label)
      AND length(key_label) BETWEEN 1 AND 80
    )
  ),
  CONSTRAINT user_ai_activity_events_model_check CHECK (
    model IS NULL
    OR (
      model = btrim(model)
      AND length(model) BETWEEN 1 AND 200
    )
  ),
  CONSTRAINT user_ai_activity_events_provider_model_check CHECK (
    (provider IS NULL AND model IS NULL)
    OR (provider IS NOT NULL AND model IS NOT NULL)
  ),
  CONSTRAINT user_ai_activity_events_key_snapshot_check CHECK (
    api_key_id IS NULL OR key_label IS NOT NULL
  ),
  CONSTRAINT user_ai_activity_events_resolution_source_check CHECK (
    resolution_source IS NULL
    OR resolution_source IN ('auto', 'assigned', 'session-override')
  ),
  CONSTRAINT user_ai_activity_events_status_check CHECK (
    status IN ('success', 'failure', 'cancelled', 'blocked')
  ),
  CONSTRAINT user_ai_activity_events_error_code_check CHECK (
    error_code IS NULL
    OR (
      length(error_code) BETWEEN 1 AND 80
      AND error_code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    )
  ),
  CONSTRAINT user_ai_activity_events_status_error_check CHECK (
    (status = 'success' AND error_code IS NULL)
    OR (status <> 'success' AND error_code IS NOT NULL)
  ),
  CONSTRAINT user_ai_activity_events_attempt_identity_check CHECK (
    status = 'blocked'
    OR (
      provider IS NOT NULL
      AND model IS NOT NULL
      AND resolution_source IS NOT NULL
    )
  ),
  CONSTRAINT user_ai_activity_events_cancelled_check CHECK (
    status <> 'cancelled' OR error_code = 'cancelled'
  ),
  CONSTRAINT user_ai_activity_events_disabled_check CHECK (
    error_code IS DISTINCT FROM 'task-disabled'
    OR (
      status = 'blocked'
      AND resolution_source IS NULL
      AND provider IS NULL
      AND api_key_id IS NULL
      AND key_label IS NULL
      AND model IS NULL
    )
  ),
  CONSTRAINT user_ai_activity_events_latency_ms_check CHECK (
    latency_ms IS NULL OR latency_ms >= 0
  ),
  CONSTRAINT user_ai_activity_events_input_tokens_check CHECK (
    input_tokens IS NULL OR input_tokens >= 0
  ),
  CONSTRAINT user_ai_activity_events_output_tokens_check CHECK (
    output_tokens IS NULL OR output_tokens >= 0
  ),
  CONSTRAINT user_ai_activity_events_resource_check CHECK (
    (resource_type IS NULL AND resource_id IS NULL)
    OR (
      resource_type IS NOT NULL
      AND resource_type = btrim(resource_type)
      AND length(resource_type) BETWEEN 1 AND 80
      AND resource_id IS NOT NULL
      AND resource_id = btrim(resource_id)
      AND length(resource_id) BETWEEN 1 AND 200
    )
  ),
  CONSTRAINT user_ai_activity_events_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE,
  CONSTRAINT user_ai_activity_events_user_api_key_fkey
    FOREIGN KEY (user_id, api_key_id)
    REFERENCES public.user_api_keys(user_id, id)
    ON DELETE SET NULL (api_key_id)
);

COMMENT ON TABLE public.user_ai_activity_events IS
  'Metadata-only AI activity ledger. It must not contain prompts, lookup text, conversation content, generated output, provider credentials, or raw provider errors.';

COMMENT ON COLUMN public.user_ai_activity_events.key_label IS
  'Non-secret key label snapshot retained when the referenced personal key is later deleted.';

CREATE INDEX user_ai_activity_events_user_created_idx
  ON public.user_ai_activity_events (user_id, created_at DESC, id DESC);

CREATE INDEX user_ai_activity_events_user_task_created_idx
  ON public.user_ai_activity_events (user_id, task_id, created_at DESC);

CREATE INDEX user_ai_activity_events_user_provider_created_idx
  ON public.user_ai_activity_events (user_id, provider, created_at DESC)
  WHERE provider IS NOT NULL;

CREATE INDEX user_ai_activity_events_user_status_created_idx
  ON public.user_ai_activity_events (user_id, status, created_at DESC);

CREATE INDEX user_ai_activity_events_user_api_key_idx
  ON public.user_ai_activity_events (user_id, api_key_id)
  WHERE api_key_id IS NOT NULL;

CREATE INDEX user_ai_activity_events_retention_idx
  ON public.user_ai_activity_events (created_at);

ALTER TABLE public.user_ai_activity_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.user_ai_activity_events
FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, DELETE
ON TABLE public.user_ai_activity_events
TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.user_ai_activity_events
TO service_role;

CREATE POLICY "Users can view own AI activity events"
ON public.user_ai_activity_events
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own AI activity events"
ON public.user_ai_activity_events
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

SELECT cron.schedule(
  'hanzihome-user-ai-activity-retention-90-days',
  '20 3 * * *',
  $cleanup$
    DELETE FROM public.user_ai_activity_events
    WHERE created_at < now() - interval '90 days'
  $cleanup$
);

COMMIT;
