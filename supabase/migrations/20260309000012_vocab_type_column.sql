-- Add `type` column to user_vocabularies for word/sentence segregation.
-- Also add to dictionary_core so that type persists globally.

-- 1. Add type column to dictionary_core
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dictionary_core'
      AND column_name = 'type'
  ) THEN
    ALTER TABLE public.dictionary_core
      ADD COLUMN type text NOT NULL DEFAULT 'word'
      CHECK (type IN ('word', 'sentence'));
  END IF;
END $$;

-- 2. Auto-classify existing rows: sentences have >4 hanzi chars or pinyin with >3 spaces
UPDATE public.dictionary_core
SET type = 'sentence'
WHERE type = 'word'
  AND (
    char_length(headword) > 4
    OR (pinyin IS NOT NULL AND array_length(string_to_array(pinyin, ' '), 1) > 3)
  );
