begin;

-- The saved-vocabulary (SRS) feature was removed from the application. Nothing
-- reads or writes these tables any more; vocabulary now lives in lessons and in
-- hanzihome_words.
drop table if exists public.user_vocab_progress;
drop table if exists public.user_vocabularies;

commit;
