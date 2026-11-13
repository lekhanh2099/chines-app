begin;

-- user_daily_reading_enrichment_jobs keeps a 90-day runtime snapshot of the key
-- that ran each job. Its FK is ON DELETE SET NULL (api_key_id), but the
-- snapshot CHECK required api_key_id IS NOT NULL for every non-blocked row, so
-- deleting any key that had run a job failed with 23514 and users could not
-- revoke a key for up to 90 days. The snapshot columns stay mandatory; only the
-- live key reference may become null once the key is deleted. This mirrors
-- user_ai_activity_events, which already keeps label snapshots with a nullable key.
--
-- Existing rows satisfy the previous, stricter rule, so they satisfy this one.
-- DROP/ADD take ACCESS EXCLUSIVE and, inside this single transaction, that lock
-- is held through the VALIDATE scan until COMMIT. The table is small (a 90-day
-- job log), so the scan is short; NOT VALID + VALIDATE is kept so the same file
-- can be split into two transactions if the table ever grows large.
alter table public.user_daily_reading_enrichment_jobs
 drop constraint user_daily_reading_enrichment_jobs_runtime_snapshot_check;

alter table public.user_daily_reading_enrichment_jobs
 add constraint user_daily_reading_enrichment_jobs_runtime_snapshot_check check (
  (
   status = 'blocked'
   and api_key_id is null
   and key_label is null
   and provider is null
   and model is null
   and resolution_source is null
  )
  or (
   key_label is not null
   and key_label = btrim(key_label)
   and length(key_label) between 1 and 80
   and provider is not null
   and model is not null
   and model = btrim(model)
   and length(model) between 1 and 200
   and resolution_source is not null
  )
 ) not valid;

alter table public.user_daily_reading_enrichment_jobs
 validate constraint user_daily_reading_enrichment_jobs_runtime_snapshot_check;

commit;
