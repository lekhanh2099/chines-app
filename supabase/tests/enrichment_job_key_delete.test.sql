begin;
select plan(4);

insert into auth.users (
 id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at
) values (
 '00000000-0000-4000-8000-000000000951',
 '00000000-0000-0000-0000-000000000000',
 'authenticated',
 'authenticated',
 'enrichment-key-owner@example.com',
 crypt('test-password', gen_salt('bf')),
 now(), now(), now()
);

insert into public.user_api_keys (
 id, user_id, provider, label, masked_key, encrypted_key, is_active, priority, default_model
) values (
 '00000000-0000-4000-8000-000000000961',
 '00000000-0000-4000-8000-000000000951',
 'groq',
 'Groq chính',
 'gsk_***',
 'encrypted-groq',
 true,
 1,
 'openai/gpt-oss-20b'
);

insert into public.user_daily_reading_enrichment_jobs (
 run_id, user_id, article_id, article_fingerprint, module, task_id, status,
 api_key_id, key_label, provider, model, resolution_source, result, error_code, completed_at
) values
 (
  gen_random_uuid(), '00000000-0000-4000-8000-000000000951', 'article-1', 'abcdef12',
  'translation', 'daily-reading.translation', 'succeeded',
  '00000000-0000-4000-8000-000000000961', 'Groq chính', 'groq', 'openai/gpt-oss-20b', 'auto',
  '{}'::jsonb, null, now()
 ),
 (
  gen_random_uuid(), '00000000-0000-4000-8000-000000000951', 'article-1', 'abcdef12',
  'vocabulary', 'daily-reading.vocabulary', 'failed',
  '00000000-0000-4000-8000-000000000961', 'Groq chính', 'groq', 'openai/gpt-oss-20b', 'auto',
  null, 'provider-error', now()
 );

select lives_ok(
 $$delete from public.user_api_keys where id = '00000000-0000-4000-8000-000000000961'$$,
 'a key that already ran enrichment jobs can be deleted'
);

select is(
 (select count(*)::int from public.user_daily_reading_enrichment_jobs
  where user_id = '00000000-0000-4000-8000-000000000951' and api_key_id is null),
 2,
 'job rows keep existing with the key reference cleared'
);

select is(
 (select count(*)::int from public.user_daily_reading_enrichment_jobs
  where user_id = '00000000-0000-4000-8000-000000000951' and key_label = 'Groq chính'
   and provider = 'groq' and model = 'openai/gpt-oss-20b'),
 2,
 'job rows keep their runtime snapshot for history'
);

select throws_ok(
 $$insert into public.user_daily_reading_enrichment_jobs (
   run_id, user_id, article_id, article_fingerprint, module, task_id, status
  ) values (
   gen_random_uuid(), '00000000-0000-4000-8000-000000000951', 'article-2', 'abcdef12',
   'grammar', 'daily-reading.grammar', 'queued'
  )$$,
 '23514',
 null,
 'a non-blocked job still requires a runtime snapshot'
);

select * from finish();
rollback;
