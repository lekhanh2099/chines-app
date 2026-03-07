alter table public.user_vocab_progress
  add column if not exists context_sentence text;

alter table public.user_vocab_progress
  add column if not exists context_translation text;