-- BYOK (Bring Your Own Key): store user's personal DeepSeek API key (encrypted at rest via pgcrypto).

create extension if not exists pgcrypto;

alter table public.user_ai_prompt_settings
  add column if not exists deepseek_api_key_encrypted text default null,
  add column if not exists deepseek_enabled boolean not null default false;

comment on column public.user_ai_prompt_settings.deepseek_api_key_encrypted
  is 'AES-256 encrypted DeepSeek API key. Encrypted/decrypted server-side only.';
comment on column public.user_ai_prompt_settings.deepseek_enabled
  is 'Whether the user has BYOK mode active for DeepSeek.';
