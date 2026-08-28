BEGIN;

ALTER TABLE public.user_daily_reading_enrichment_jobs
  ADD COLUMN request_signature text,
  ADD COLUMN reused_from_job_id uuid;

ALTER TABLE public.user_daily_reading_enrichment_jobs
  ADD CONSTRAINT user_daily_reading_enrichment_jobs_user_id_id_key
    UNIQUE (user_id, id),
  ADD CONSTRAINT user_daily_reading_enrichment_jobs_request_signature_check CHECK (
    request_signature IS NULL
    OR request_signature ~ '^[a-f0-9]{64}$'
  ),
  ADD CONSTRAINT user_daily_reading_enrichment_jobs_reused_from_job_id_fkey
    FOREIGN KEY (user_id, reused_from_job_id)
    REFERENCES public.user_daily_reading_enrichment_jobs(user_id, id)
    ON DELETE SET NULL (reused_from_job_id);

COMMENT ON COLUMN public.user_daily_reading_enrichment_jobs.request_signature IS
  'SHA-256 of the article, module configuration, enrichment contract version, task and exact runtime snapshot. Existing rows remain outside reuse.';

COMMENT ON COLUMN public.user_daily_reading_enrichment_jobs.reused_from_job_id IS
  'Terminal source job cloned without another provider request. Null means the job was generated or blocked normally.';

CREATE INDEX user_daily_reading_enrichment_jobs_reusable_result_idx
  ON public.user_daily_reading_enrichment_jobs (
    user_id,
    request_signature,
    completed_at DESC,
    id DESC
  )
  WHERE status = 'succeeded'
    AND result IS NOT NULL
    AND request_signature IS NOT NULL;

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

REVOKE ALL ON FUNCTION public.ai_claim_post_turn_jobs(uuid, uuid, integer)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ai_claim_post_turn_jobs(uuid, uuid, integer)
TO service_role;

COMMENT ON FUNCTION public.ai_claim_post_turn_jobs(uuid, uuid, integer) IS
  'Server-only bounded durable job claim using SKIP LOCKED. Reclaims processing leases older than 15 minutes and never starts a sixth attempt.';

CREATE INDEX ai_post_turn_jobs_processing_lease_idx
  ON public.ai_post_turn_jobs (locked_at, created_at)
  WHERE status = 'processing';

CREATE FUNCTION public.user_ai_activity_summary(
  p_user_id uuid,
  p_task_id text DEFAULT NULL,
  p_provider text DEFAULT NULL
)
RETURNS TABLE (
  task_id text,
  provider text,
  model text,
  attempts bigint,
  successes bigint,
  success_rate numeric,
  average_latency_ms numeric,
  input_tokens bigint,
  output_tokens bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    event.task_id,
    event.provider,
    event.model,
    count(*) AS attempts,
    count(*) FILTER (WHERE event.status = 'success') AS successes,
    round(
      100.0 * count(*) FILTER (WHERE event.status = 'success') / nullif(count(*), 0),
      1
    ) AS success_rate,
    round(avg(event.latency_ms), 0) AS average_latency_ms,
    coalesce(sum(event.input_tokens), 0) AS input_tokens,
    coalesce(sum(event.output_tokens), 0) AS output_tokens
  FROM public.user_ai_activity_events AS event
  WHERE event.user_id = p_user_id
    AND event.status IN ('success', 'failure', 'cancelled')
    AND event.resource_type IS DISTINCT FROM 'ai-runtime-check'
    AND event.provider IS NOT NULL
    AND event.model IS NOT NULL
    AND (p_task_id IS NULL OR event.task_id = p_task_id)
    AND (p_provider IS NULL OR event.provider = p_provider)
  GROUP BY event.task_id, event.provider, event.model
  ORDER BY count(*) DESC, event.task_id ASC, event.provider ASC, event.model ASC;
$$;

REVOKE ALL ON FUNCTION public.user_ai_activity_summary(uuid, text, text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_ai_activity_summary(uuid, text, text)
TO service_role;

COMMENT ON FUNCTION public.user_ai_activity_summary(uuid, text, text) IS
  'Server-only 90-day AI attempt aggregates. Blocked events and runtime probes are excluded from success-rate calculations.';

COMMIT;
