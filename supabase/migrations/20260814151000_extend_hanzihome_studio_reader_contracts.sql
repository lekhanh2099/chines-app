begin;

alter table public.hanzihome_reading_documents
  drop constraint if exists hanzihome_reading_documents_kind_check;
alter table public.hanzihome_reading_documents
  add constraint hanzihome_reading_documents_kind_check
  check (kind in ('core', 'mock', 'reinforcement', 'hsk', 'daily', 'personal', 'humanities'));

alter table public.hanzihome_tts_folders
  add column if not exists revision integer not null default 0 check (revision >= 0);
alter table public.hanzihome_tts_clips
  add column if not exists revision integer not null default 0 check (revision >= 0);

create or replace function public.hanzihome_tts_clip_folder_owner_check()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.folder_id is not null and not exists (
    select 1
    from public.hanzihome_tts_folders folder
    where folder.id = new.folder_id
      and folder.user_id = new.user_id
  ) then
    raise exception 'TTS clip folder does not belong to the clip owner';
  end if;

  return new;
end;
$$;

drop trigger if exists hanzihome_tts_clip_folder_owner_check
  on public.hanzihome_tts_clips;
create trigger hanzihome_tts_clip_folder_owner_check
before insert or update on public.hanzihome_tts_clips
for each row execute function public.hanzihome_tts_clip_folder_owner_check();

commit;
