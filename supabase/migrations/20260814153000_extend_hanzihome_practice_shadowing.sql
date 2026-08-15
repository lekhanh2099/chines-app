begin;

alter table public.hanzihome_practice_attempts
  drop constraint if exists hanzihome_practice_attempts_surface_check;

alter table public.hanzihome_practice_attempts
  add constraint hanzihome_practice_attempts_surface_check
  check (surface in ('reader', 'dictation', 'translation', 'listening', 'personal-learning', 'shadowing'));

commit;
