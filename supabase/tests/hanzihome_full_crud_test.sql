begin;

select plan(9);

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
) values (
  '00000000-0000-4000-8000-000000000901',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'hanzihome-crud-test@example.com',
  crypt('test-password', gen_salt('bf')),
  now(),
  now(),
  now()
);

create temporary table hanzihome_crud_test_state (
  course_id text not null,
  updated_at timestamptz not null
);

insert into hanzihome_crud_test_state (course_id, updated_at)
select
  result -> 'item' ->> 'id',
  (result -> 'item' ->> 'updated_at')::timestamptz
from private.hanzihome_mutate_content(
  '00000000-0000-4000-8000-000000000901',
  'create',
  'course',
  null,
  null,
  '{"slug":"crud-test","title":"CRUD Test","subtitle":null,"type":"custom"}'::jsonb,
  'Create CRUD test course'
) as mutation(result);

select is(
  (select count(*)::integer from hanzihome_crud_test_state),
  1,
  'create returns one canonical course'
);

select is(
  (
    select count(*)::integer
    from public.hanzihome_content_audit_log audit
    join hanzihome_crud_test_state state on state.course_id = audit.entity_id
    where audit.operation = 'create'
  ),
  1,
  'create writes its audit record in the same transaction'
);

select throws_ok(
  format(
    $query$
      select private.hanzihome_mutate_content(
        '00000000-0000-4000-8000-000000000901',
        'update',
        'course',
        %L,
        '2000-01-01T00:00:00Z',
        '{"title":"Stale update"}'::jsonb,
        'Reject stale update'
      )
    $query$,
    (select course_id from hanzihome_crud_test_state)
  ),
  '40001',
  'HanziHome entity changed since it was loaded',
  'stale updates fail with optimistic concurrency conflict'
);

select throws_ok(
  $query$
    select private.hanzihome_mutate_content(
      '00000000-0000-4000-8000-000000000901',
      'create',
      'book',
      null,
      null,
      '{"course_id":"missing-course","title":"Invalid parent"}'::jsonb,
      'Reject invalid parent'
    )
  $query$,
  '23503',
  'Active parent entity was not found',
  'create verifies the parent relationship'
);

select is(
  (
    select count(*)::integer
    from public.hanzihome_content_audit_log
    where reason = 'Reject invalid parent'
  ),
  0,
  'failed mutation does not write an audit record'
);

update hanzihome_crud_test_state state
set updated_at = (
  select (result -> 'item' ->> 'updated_at')::timestamptz
  from private.hanzihome_mutate_content(
    '00000000-0000-4000-8000-000000000901',
    'delete',
    'course',
    state.course_id,
    state.updated_at,
    '{}'::jsonb,
    'Soft delete CRUD test course'
  ) as mutation(result)
);

select ok(
  (
    select course.deleted_at is not null
    from public.hanzihome_courses course
    join hanzihome_crud_test_state state on state.course_id = course.id
  ),
  'delete is a soft delete'
);

select throws_ok(
  format(
    $query$
      select private.hanzihome_mutate_content(
        '00000000-0000-4000-8000-000000000901',
        'update',
        'course',
        %L,
        %L,
        '{"title":"Deleted update"}'::jsonb,
        'Reject update while deleted'
      )
    $query$,
    (select course_id from hanzihome_crud_test_state),
    (select updated_at from hanzihome_crud_test_state)
  ),
  '22023',
  'Deleted content must be restored before it can be changed',
  'deleted content cannot be updated'
);

update hanzihome_crud_test_state state
set updated_at = (
  select (result -> 'item' ->> 'updated_at')::timestamptz
  from private.hanzihome_mutate_content(
    '00000000-0000-4000-8000-000000000901',
    'restore',
    'course',
    state.course_id,
    state.updated_at,
    '{}'::jsonb,
    'Restore CRUD test course'
  ) as mutation(result)
);

select ok(
  (
    select course.deleted_at is null
    from public.hanzihome_courses course
    join hanzihome_crud_test_state state on state.course_id = course.id
  ),
  'restore makes soft-deleted content active again'
);

select is(
  (
    select count(*)::integer
    from public.hanzihome_content_audit_log audit
    join hanzihome_crud_test_state state on state.course_id = audit.entity_id
    where audit.operation in ('create', 'delete', 'restore')
  ),
  3,
  'successful create, delete, and restore each have an audit record'
);

select * from finish();
rollback;
