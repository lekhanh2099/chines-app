begin;

-- Exercise results of textbook lessons are saved as practice attempts.
alter table public.hanzihome_practice_attempts
  drop constraint hanzihome_practice_attempts_surface_check;
alter table public.hanzihome_practice_attempts
  add constraint hanzihome_practice_attempts_surface_check check (
    surface = any (array[
      'reader', 'dictation', 'translation', 'listening',
      'personal-learning', 'shadowing', 'review', 'exercise'
    ])
  );

commit;
