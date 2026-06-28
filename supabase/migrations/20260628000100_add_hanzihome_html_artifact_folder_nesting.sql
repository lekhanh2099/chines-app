begin;

alter table public.hanzihome_html_artifact_folders
add column if not exists parent_folder_id uuid references public.hanzihome_html_artifact_folders(id) on delete set null;

alter table public.hanzihome_html_artifact_folders
drop constraint if exists hanzihome_html_artifact_folders_parent_not_self;

alter table public.hanzihome_html_artifact_folders
add constraint hanzihome_html_artifact_folders_parent_not_self
check (parent_folder_id is null or parent_folder_id <> id);

create index if not exists hanzihome_html_artifact_folders_owner_parent_position_idx
on public.hanzihome_html_artifact_folders(owner_id, parent_folder_id, position, updated_at desc);

commit;
