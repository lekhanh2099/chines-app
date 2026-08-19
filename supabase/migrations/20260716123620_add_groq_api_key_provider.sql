alter table public.user_api_keys
drop constraint if exists user_api_keys_provider_check;

alter table public.user_api_keys
add constraint user_api_keys_provider_check
check (provider in ('deepseek', 'gemini', 'openai', 'groq'));
