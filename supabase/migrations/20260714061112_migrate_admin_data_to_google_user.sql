-- Transfer user-owned data from the legacy email admin account to the
-- replacement Google account. Historical actor/deleted_by references remain
-- attached to the account that performed those actions.
do $migration$
declare
  source_user constant uuid := '77bfa7ac-e5a3-4c4c-adb6-4bd56af9b9ec';
  target_user constant uuid := '95d07bd7-f136-42ba-ac4d-fe361305c2b9';
  target_owned_rows bigint;
begin
  if not exists (select 1 from auth.users where id = source_user) then
    raise exception 'Legacy admin account does not exist';
  end if;

  if not exists (select 1 from auth.users where id = target_user) then
    raise exception 'Target Google account does not exist';
  end if;

  select
    (select count(*) from public.hanzihome_content_editors where user_id = target_user) +
    (select count(*) from public.hanzihome_content_roles where user_id = target_user) +
    (select count(*) from public.hanzihome_course_books where user_id = target_user) +
    (select count(*) from public.hanzihome_html_artifact_folders where owner_id = target_user) +
    (select count(*) from public.hanzihome_html_artifact_runtime_states where owner_id = target_user) +
    (select count(*) from public.hanzihome_html_artifacts where owner_id = target_user) +
    (select count(*) from public.hanzihome_lesson_drafts where user_id = target_user) +
    (select count(*) from public.hanzihome_memory_tips where owner_id = target_user) +
    (select count(*) from public.lesson_note_links where user_id = target_user) +
    (select count(*) from public.notes where user_id = target_user) +
    (select count(*) from public.user_learning_state where user_id = target_user) +
    (select count(*) from public.user_vocab_progress where user_id = target_user) +
    (select count(*) from public.user_vocabularies where user_id = target_user)
  into target_owned_rows;

  if target_owned_rows <> 0 then
    raise exception 'Target Google account already owns % rows; manual merge required', target_owned_rows;
  end if;
end
$migration$;

update public.hanzihome_content_editors
set user_id = '95d07bd7-f136-42ba-ac4d-fe361305c2b9'
where user_id = '77bfa7ac-e5a3-4c4c-adb6-4bd56af9b9ec';

update public.hanzihome_content_roles
set user_id = '95d07bd7-f136-42ba-ac4d-fe361305c2b9'
where user_id = '77bfa7ac-e5a3-4c4c-adb6-4bd56af9b9ec';

update public.hanzihome_course_books
set user_id = '95d07bd7-f136-42ba-ac4d-fe361305c2b9'
where user_id = '77bfa7ac-e5a3-4c4c-adb6-4bd56af9b9ec';

update public.hanzihome_html_artifact_folders
set owner_id = '95d07bd7-f136-42ba-ac4d-fe361305c2b9'
where owner_id = '77bfa7ac-e5a3-4c4c-adb6-4bd56af9b9ec';

alter table public.hanzihome_html_artifact_runtime_states
  alter constraint hanzihome_html_artifact_runtime_states_owner_artifact_fk
  deferrable initially immediate;

set constraints hanzihome_html_artifact_runtime_states_owner_artifact_fk deferred;

update public.hanzihome_html_artifacts
set owner_id = '95d07bd7-f136-42ba-ac4d-fe361305c2b9'
where owner_id = '77bfa7ac-e5a3-4c4c-adb6-4bd56af9b9ec';

update public.hanzihome_html_artifact_runtime_states
set owner_id = '95d07bd7-f136-42ba-ac4d-fe361305c2b9'
where owner_id = '77bfa7ac-e5a3-4c4c-adb6-4bd56af9b9ec';

set constraints hanzihome_html_artifact_runtime_states_owner_artifact_fk immediate;

update public.hanzihome_lesson_drafts
set user_id = '95d07bd7-f136-42ba-ac4d-fe361305c2b9'
where user_id = '77bfa7ac-e5a3-4c4c-adb6-4bd56af9b9ec';

update public.hanzihome_memory_tips
set owner_id = '95d07bd7-f136-42ba-ac4d-fe361305c2b9'
where owner_id = '77bfa7ac-e5a3-4c4c-adb6-4bd56af9b9ec';

update public.lesson_note_links
set user_id = '95d07bd7-f136-42ba-ac4d-fe361305c2b9'
where user_id = '77bfa7ac-e5a3-4c4c-adb6-4bd56af9b9ec';

update public.notes
set user_id = '95d07bd7-f136-42ba-ac4d-fe361305c2b9'
where user_id = '77bfa7ac-e5a3-4c4c-adb6-4bd56af9b9ec';

update public.user_learning_state
set user_id = '95d07bd7-f136-42ba-ac4d-fe361305c2b9'
where user_id = '77bfa7ac-e5a3-4c4c-adb6-4bd56af9b9ec';

update public.user_vocab_progress
set user_id = '95d07bd7-f136-42ba-ac4d-fe361305c2b9'
where user_id = '77bfa7ac-e5a3-4c4c-adb6-4bd56af9b9ec';

update public.user_vocabularies
set user_id = '95d07bd7-f136-42ba-ac4d-fe361305c2b9'
where user_id = '77bfa7ac-e5a3-4c4c-adb6-4bd56af9b9ec';

do $verification$
declare
  source_user constant uuid := '77bfa7ac-e5a3-4c4c-adb6-4bd56af9b9ec';
  remaining_rows bigint;
begin
  select
    (select count(*) from public.hanzihome_content_editors where user_id = source_user) +
    (select count(*) from public.hanzihome_content_roles where user_id = source_user) +
    (select count(*) from public.hanzihome_course_books where user_id = source_user) +
    (select count(*) from public.hanzihome_html_artifact_folders where owner_id = source_user) +
    (select count(*) from public.hanzihome_html_artifact_runtime_states where owner_id = source_user) +
    (select count(*) from public.hanzihome_html_artifacts where owner_id = source_user) +
    (select count(*) from public.hanzihome_lesson_drafts where user_id = source_user) +
    (select count(*) from public.hanzihome_memory_tips where owner_id = source_user) +
    (select count(*) from public.lesson_note_links where user_id = source_user) +
    (select count(*) from public.notes where user_id = source_user) +
    (select count(*) from public.user_learning_state where user_id = source_user) +
    (select count(*) from public.user_vocab_progress where user_id = source_user) +
    (select count(*) from public.user_vocabularies where user_id = source_user)
  into remaining_rows;

  if remaining_rows <> 0 then
    raise exception 'Legacy admin still owns % migrated rows', remaining_rows;
  end if;
end
$verification$;
