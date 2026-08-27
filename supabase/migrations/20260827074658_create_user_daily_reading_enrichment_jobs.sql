BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TABLE public.user_daily_reading_enrichment_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL,
  workflow_run_id text,
  user_id uuid NOT NULL,
  article_id text NOT NULL,
  article_fingerprint text NOT NULL,
  module text NOT NULL,
  task_id text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  api_key_id uuid,
  key_label text,
  provider text,
  model text,
  resolution_source text,
  progress_completed integer NOT NULL DEFAULT 0,
  progress_total integer NOT NULL DEFAULT 1,
  result jsonb,
  error_code text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  heartbeat_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '90 days'),
  CONSTRAINT user_daily_reading_enrichment_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT user_daily_reading_enrichment_jobs_run_module_key
    UNIQUE (user_id, run_id, module),
  CONSTRAINT user_daily_reading_enrichment_jobs_article_id_check CHECK (
    article_id = btrim(article_id) AND length(article_id) BETWEEN 1 AND 200
  ),
  CONSTRAINT user_daily_reading_enrichment_jobs_fingerprint_check CHECK (
    article_fingerprint ~ '^[a-f0-9]{8}$'
  ),
  CONSTRAINT user_daily_reading_enrichment_jobs_module_check CHECK (
    module IN ('translation', 'vocabulary', 'grammar', 'questions')
  ),
  CONSTRAINT user_daily_reading_enrichment_jobs_task_id_check CHECK (
    task_id IN (
      'daily-reading.translation',
      'daily-reading.vocabulary',
      'daily-reading.grammar',
      'daily-reading.questions'
    )
  ),
  CONSTRAINT user_daily_reading_enrichment_jobs_module_task_check CHECK (
    (module = 'translation' AND task_id = 'daily-reading.translation')
    OR (module = 'vocabulary' AND task_id = 'daily-reading.vocabulary')
    OR (module = 'grammar' AND task_id = 'daily-reading.grammar')
    OR (module = 'questions' AND task_id = 'daily-reading.questions')
  ),
  CONSTRAINT user_daily_reading_enrichment_jobs_status_check CHECK (
    status IN ('queued', 'running', 'succeeded', 'failed', 'blocked')
  ),
  CONSTRAINT user_daily_reading_enrichment_jobs_provider_check CHECK (
    provider IS NULL OR provider IN ('deepseek', 'gemini', 'openai', 'groq')
  ),
  CONSTRAINT user_daily_reading_enrichment_jobs_resolution_check CHECK (
    resolution_source IS NULL OR resolution_source IN ('auto', 'assigned')
  ),
  CONSTRAINT user_daily_reading_enrichment_jobs_runtime_snapshot_check CHECK (
    (
      status = 'blocked'
      AND api_key_id IS NULL
      AND key_label IS NULL
      AND provider IS NULL
      AND model IS NULL
      AND resolution_source IS NULL
    )
    OR (
      api_key_id IS NOT NULL
      AND key_label IS NOT NULL
      AND key_label = btrim(key_label)
      AND length(key_label) BETWEEN 1 AND 80
      AND provider IS NOT NULL
      AND model IS NOT NULL
      AND model = btrim(model)
      AND length(model) BETWEEN 1 AND 200
      AND resolution_source IS NOT NULL
    )
  ),
  CONSTRAINT user_daily_reading_enrichment_jobs_progress_check CHECK (
    progress_total > 0
    AND progress_completed >= 0
    AND progress_completed <= progress_total
  ),
  CONSTRAINT user_daily_reading_enrichment_jobs_result_check CHECK (
    (status = 'succeeded' AND result IS NOT NULL AND error_code IS NULL)
    OR (status IN ('queued', 'running') AND result IS NULL AND error_code IS NULL)
    OR (status IN ('failed', 'blocked') AND result IS NULL AND error_code IS NOT NULL)
  ),
  CONSTRAINT user_daily_reading_enrichment_jobs_error_code_check CHECK (
    error_code IS NULL
    OR (
      length(error_code) BETWEEN 1 AND 80
      AND error_code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    )
  ),
  CONSTRAINT user_daily_reading_enrichment_jobs_terminal_time_check CHECK (
    (status IN ('queued', 'running') AND completed_at IS NULL)
    OR (status IN ('succeeded', 'failed', 'blocked') AND completed_at IS NOT NULL)
  ),
  CONSTRAINT user_daily_reading_enrichment_jobs_workflow_run_id_check CHECK (
    workflow_run_id IS NULL
    OR (
      workflow_run_id = btrim(workflow_run_id)
      AND length(workflow_run_id) BETWEEN 1 AND 200
    )
  ),
  CONSTRAINT user_daily_reading_enrichment_jobs_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE,
  CONSTRAINT user_daily_reading_enrichment_jobs_user_api_key_fkey
    FOREIGN KEY (user_id, api_key_id)
    REFERENCES public.user_api_keys(user_id, id)
    ON DELETE SET NULL (api_key_id)
);

COMMENT ON TABLE public.user_daily_reading_enrichment_jobs IS
  'Metadata and terminal module results for durable Daily Reading AI enrichment. Article text, prompts, provider credentials, and raw provider errors must never be stored here.';

COMMENT ON COLUMN public.user_daily_reading_enrichment_jobs.result IS
  'Validated terminal module result only. Partial provider output is never published.';

CREATE UNIQUE INDEX user_daily_reading_enrichment_jobs_active_article_module_idx
  ON public.user_daily_reading_enrichment_jobs (user_id, article_fingerprint, module)
  WHERE status IN ('queued', 'running');

CREATE INDEX user_daily_reading_enrichment_jobs_user_run_idx
  ON public.user_daily_reading_enrichment_jobs (user_id, run_id, created_at, id);

CREATE INDEX user_daily_reading_enrichment_jobs_user_article_idx
  ON public.user_daily_reading_enrichment_jobs (
    user_id,
    article_fingerprint,
    created_at DESC,
    id DESC
  );

CREATE INDEX user_daily_reading_enrichment_jobs_active_key_idx
  ON public.user_daily_reading_enrichment_jobs (user_id, api_key_id)
  WHERE status IN ('queued', 'running') AND api_key_id IS NOT NULL;

CREATE INDEX user_daily_reading_enrichment_jobs_retention_idx
  ON public.user_daily_reading_enrichment_jobs (expires_at);

CREATE OR REPLACE FUNCTION public.user_api_key_prevent_assigned_deactivation()
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

  IF OLD.is_active = true
    AND NEW.is_active = false
    AND EXISTS (
      SELECT 1
      FROM public.user_daily_reading_enrichment_jobs AS job
      WHERE job.user_id = OLD.user_id
        AND job.api_key_id = OLD.id
        AND job.status IN ('queued', 'running')
    )
  THEN
    RAISE EXCEPTION 'AI key is used by one or more active Daily Reading jobs'
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$$;

CREATE FUNCTION public.user_api_key_prevent_active_job_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.user_daily_reading_enrichment_jobs AS job
    WHERE job.user_id = OLD.user_id
      AND job.api_key_id = OLD.id
      AND job.status IN ('queued', 'running')
  )
  THEN
    RAISE EXCEPTION 'AI key is used by one or more active Daily Reading jobs'
      USING ERRCODE = '23503';
  END IF;

  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.user_api_key_prevent_active_job_delete()
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_api_key_prevent_active_job_delete()
TO service_role;

CREATE TRIGGER user_api_keys_prevent_active_job_delete
BEFORE DELETE
ON public.user_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.user_api_key_prevent_active_job_delete();

ALTER TABLE public.user_daily_reading_enrichment_jobs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.user_daily_reading_enrichment_jobs
FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, DELETE
ON TABLE public.user_daily_reading_enrichment_jobs
TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.user_daily_reading_enrichment_jobs
TO service_role;

CREATE POLICY "Users can view own Daily Reading enrichment jobs"
ON public.user_daily_reading_enrichment_jobs
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own terminal Daily Reading enrichment jobs"
ON public.user_daily_reading_enrichment_jobs
FOR DELETE
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  AND status IN ('succeeded', 'failed', 'blocked')
);

SELECT cron.schedule(
  'hanzihome-daily-reading-enrichment-jobs-maintenance',
  '35 3 * * *',
  $maintenance$
    UPDATE public.user_daily_reading_enrichment_jobs
    SET
      status = 'failed',
      error_code = 'workflow-stalled',
      completed_at = now(),
      heartbeat_at = now()
    WHERE status IN ('queued', 'running')
      AND heartbeat_at < now() - interval '24 hours';

    DELETE FROM public.user_daily_reading_enrichment_jobs
    WHERE expires_at <= now();
  $maintenance$
);

COMMIT;
