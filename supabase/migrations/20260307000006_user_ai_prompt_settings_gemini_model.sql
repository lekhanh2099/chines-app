alter table public.user_ai_prompt_settings
  add column if not exists gemini_model text not null default 'models/gemini-2.5-flash';