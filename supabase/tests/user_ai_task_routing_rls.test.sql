begin;

select plan(23);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) values
  (
    '00000000-0000-4000-8000-000000000911',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'ai-routing-owner@example.com',
    crypt('test-password', gen_salt('bf')),
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000912',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'ai-routing-other@example.com',
    crypt('test-password', gen_salt('bf')),
    now(),
    now(),
    now()
  );

insert into public.user_api_keys (
  id,
  user_id,
  provider,
  label,
  masked_key,
  encrypted_key,
  is_active,
  priority,
  default_model
) values
  (
    '00000000-0000-4000-8000-000000000921',
    '00000000-0000-4000-8000-000000000911',
    'gemini',
    'Owner Gemini',
    'AIza***',
    'encrypted-owner-gemini',
    true,
    1,
    'models/gemini-2.5-flash'
  ),
  (
    '00000000-0000-4000-8000-000000000922',
    '00000000-0000-4000-8000-000000000911',
    'deepseek',
    'Owner DeepSeek',
    'sk-***',
    'encrypted-owner-deepseek',
    true,
    2,
    'deepseek-chat'
  ),
  (
    '00000000-0000-4000-8000-000000000923',
    '00000000-0000-4000-8000-000000000912',
    'gemini',
    'Other Gemini',
    'AIza***',
    'encrypted-other-gemini',
    true,
    1,
    'models/gemini-2.5-flash'
  );

insert into public.user_ai_task_assignments (
  user_id,
  task_id,
  mode,
  api_key_id,
  model
) values (
  '00000000-0000-4000-8000-000000000912',
  'conversation.reply',
  'auto',
  null,
  null
);

insert into public.user_ai_activity_events (
  user_id,
  task_id,
  provider,
  api_key_id,
  key_label,
  model,
  resolution_source,
  status,
  latency_ms,
  created_at
) values
  (
    '00000000-0000-4000-8000-000000000911',
    'conversation.reply',
    'deepseek',
    '00000000-0000-4000-8000-000000000922',
    'Owner DeepSeek',
    'deepseek-chat',
    'auto',
    'success',
    120,
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000912',
    'conversation.reply',
    'gemini',
    '00000000-0000-4000-8000-000000000923',
    'Other Gemini',
    'models/gemini-2.5-flash',
    'auto',
    'success',
    150,
    now()
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000911', true);

select lives_ok(
  $query$
    insert into public.user_ai_task_assignments (
      user_id,
      task_id,
      mode,
      api_key_id,
      model
    ) values (
      '00000000-0000-4000-8000-000000000911',
      'lookup.quick',
      'auto',
      null,
      null
    )
  $query$,
 'user can insert an assignment for their own task'
);

select throws_ok(
  $query$
    insert into public.user_ai_task_assignments (
      user_id,
      task_id,
      mode,
      api_key_id,
      model
    ) values (
      '00000000-0000-4000-8000-000000000911',
      'daily-reading.legacy-generation',
      'auto',
      null,
      null
    )
  $query$,
  '23514',
  null,
  'removed legacy Daily Reading task is rejected'
);

select throws_ok(
  $query$
    insert into public.user_ai_task_assignments (
      user_id,
      task_id,
      mode,
      api_key_id,
      model
    ) values (
      '00000000-0000-4000-8000-000000000912',
      'lookup.quick',
      'auto',
      null,
      null
    )
  $query$,
  '42501',
  null,
  'user cannot insert an assignment for another user'
);

select results_eq(
  $$select task_id from public.user_ai_task_assignments order by task_id$$,
  array['lookup.quick'],
  'user reads only their own assignments'
);

update public.user_ai_task_assignments
set mode = 'disabled'
where user_id = '00000000-0000-4000-8000-000000000912';

reset role;

select is(
  (
    select mode
    from public.user_ai_task_assignments
    where user_id = '00000000-0000-4000-8000-000000000912'
      and task_id = 'conversation.reply'
  ),
  'auto',
  'user cannot update another user assignment'
);

set local role authenticated;

delete from public.user_ai_task_assignments
where user_id = '00000000-0000-4000-8000-000000000912';

reset role;

select is(
  (
    select count(*)::integer
    from public.user_ai_task_assignments
    where user_id = '00000000-0000-4000-8000-000000000912'
      and task_id = 'conversation.reply'
  ),
  1,
  'user cannot delete another user assignment'
);

set local role authenticated;

select throws_ok(
  $query$
    insert into public.user_ai_task_assignments (
      user_id,
      task_id,
      mode,
      api_key_id,
      model
    ) values (
      '00000000-0000-4000-8000-000000000911',
      'lookup.deep',
      'assigned',
      '00000000-0000-4000-8000-000000000923',
      'models/gemini-2.5-flash'
    )
  $query$,
  '23503',
  'Assigned AI task key must be active, compatible, and owned by the same user',
  'cross-user key assignment fails'
);

select throws_ok(
  $query$
    insert into public.user_ai_task_assignments (
      user_id,
      task_id,
      mode,
      api_key_id,
      model
    ) values (
      '00000000-0000-4000-8000-000000000911',
      'conversation.semantic-memory',
      'assigned',
      '00000000-0000-4000-8000-000000000922',
      'deepseek-chat'
    )
  $query$,
  '23503',
  'Assigned AI task key must be active, compatible, and owned by the same user',
  'semantic memory rejects an incompatible provider'
);

select lives_ok(
  $query$
    insert into public.user_ai_task_assignments (
      user_id,
      task_id,
      mode,
      api_key_id,
      model
    ) values (
      '00000000-0000-4000-8000-000000000911',
      'conversation.semantic-memory',
      'assigned',
      '00000000-0000-4000-8000-000000000921',
      'models/gemini-2.5-flash'
    )
  $query$,
  'semantic memory accepts an owned active Gemini key'
);

select throws_ok(
  $query$
    update public.user_api_keys
    set is_active = false
    where id = '00000000-0000-4000-8000-000000000921'
  $query$,
  '23503',
  'AI key is assigned to one or more tasks',
  'assigned key cannot be paused'
);

set constraints user_ai_task_assignments_user_api_key_fkey immediate;

select throws_ok(
  $query$
    delete from public.user_api_keys
    where id = '00000000-0000-4000-8000-000000000921'
  $query$,
  '23503',
  null,
  'assigned key cannot be deleted'
);

select results_eq(
  $$select key_label from public.user_ai_activity_events order by key_label$$,
  array['Owner DeepSeek'],
  'user reads only their own activity events'
);

select throws_ok(
  $query$
    insert into public.user_ai_activity_events (
      user_id,
      task_id,
      status,
      error_code
    ) values (
      '00000000-0000-4000-8000-000000000911',
      'lookup.quick',
      'blocked',
      'task-disabled'
    )
  $query$,
  '42501',
  null,
  'authenticated users cannot insert activity events'
);

delete from public.user_ai_activity_events
where user_id = '00000000-0000-4000-8000-000000000912';

reset role;

select is(
  (
    select count(*)::integer
    from public.user_ai_activity_events
    where user_id = '00000000-0000-4000-8000-000000000912'
  ),
  1,
  'user cannot delete another user activity'
);

set local role authenticated;

delete from public.user_ai_activity_events
where user_id = '00000000-0000-4000-8000-000000000911';

reset role;

select is(
  (
    select count(*)::integer
    from public.user_ai_activity_events
    where user_id = '00000000-0000-4000-8000-000000000911'
  ),
  0,
  'user can delete their own activity'
);

select set_config('request.jwt.claim.sub', '', true);

set local role service_role;

select lives_ok(
  $query$
    insert into public.user_ai_activity_events (
      user_id,
      task_id,
      status,
      error_code
    ) values (
      '00000000-0000-4000-8000-000000000911',
      'lookup.quick',
      'blocked',
      'task-disabled'
    )
  $query$,
  'service role can insert metadata-only activity'
);

reset role;

select ok(
  not has_table_privilege('anon', 'public.user_ai_task_assignments', 'select'),
  'anon has no assignment table privileges'
);

select ok(
  not has_table_privilege('anon', 'public.user_ai_activity_events', 'select'),
  'anon has no activity table privileges'
);

select ok(
  not has_table_privilege('authenticated', 'public.user_ai_activity_events', 'insert'),
  'authenticated role has no activity insert grant'
);

select ok(
  has_table_privilege('authenticated', 'public.user_ai_activity_events', 'select,delete'),
  'authenticated role has only the required activity access'
);

select ok(
  exists (
    select 1
    from cron.job
    where jobname = 'hanzihome-user-ai-activity-retention-90-days'
      and schedule = '20 3 * * *'
  ),
  '90-day cleanup cron is scheduled at 03:20 UTC'
);

insert into public.user_ai_activity_events (
  user_id,
  task_id,
  status,
  error_code,
  created_at
) values
  (
    '00000000-0000-4000-8000-000000000911',
    'lookup.quick',
    'blocked',
    'task-disabled',
    now() - interval '91 days'
  ),
  (
    '00000000-0000-4000-8000-000000000911',
    'lookup.quick',
    'blocked',
    'task-disabled',
    now() - interval '89 days'
  );

delete from public.user_ai_activity_events
where created_at < now() - interval '90 days';

select is(
  (
    select count(*)::integer
    from public.user_ai_activity_events
    where user_id = '00000000-0000-4000-8000-000000000911'
      and created_at < now() - interval '90 days'
  ),
  0,
  'retention cleanup removes expired events'
);

select is(
  (
    select count(*)::integer
    from public.user_ai_activity_events
    where user_id = '00000000-0000-4000-8000-000000000911'
      and created_at >= now() - interval '90 days'
  ),
  2,
  'retention cleanup preserves current events'
);

select * from finish();
rollback;
