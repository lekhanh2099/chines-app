begin;

-- These tables have no runtime source callers, rows, foreign-key dependents,
-- or database routine references. Listening practice now records immutable
-- evidence in hanzihome_practice_attempts; no current product path reads the
-- abandoned listening state contract.
--
-- Do not use CASCADE: an unexpected dependency must block this migration.
drop function if exists public.hanzihome_cutover_boya_legacy_to_nine_volume(text, text);
drop function if exists public.hanzihome_rollback_boya_nine_volume_cutover();
drop table public.hanzihome_learning_events;
drop table public.hanzihome_import_chunks;
drop table public.hanzihome_listening_attempts;
drop table public.hanzihome_listening_item_progress;

commit;
