alter table public.user_vocab_progress
  add column if not exists personal_note text;

alter table public.user_vocab_progress
  add column if not exists personal_note_mode text
    check (personal_note_mode in ('normal', 'important'))
    default 'important';