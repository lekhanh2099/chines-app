BEGIN;

UPDATE public.ai_messages
SET metadata = jsonb_set(
  metadata,
  '{provider}',
  to_jsonb(
    CASE metadata ->> 'provider'
      WHEN 'Groq' THEN 'groq'
      WHEN 'Google Gemini' THEN 'gemini'
    END
  ),
  false
)
WHERE role = 'assistant'
  AND metadata ->> 'provider' IN ('Groq', 'Google Gemini');

COMMIT;
