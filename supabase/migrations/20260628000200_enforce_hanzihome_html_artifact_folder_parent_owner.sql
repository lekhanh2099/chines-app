begin;

create unique index if not exists hanzihome_html_artifact_folders_owner_id_unique_idx
on public.hanzihome_html_artifact_folders(owner_id, id);

alter table public.hanzihome_html_artifact_folders
drop constraint if exists hanzihome_html_artifact_folders_owner_parent_fk;

alter table public.hanzihome_html_artifact_folders
add constraint hanzihome_html_artifact_folders_owner_parent_fk
foreign key (owner_id, parent_folder_id)
references public.hanzihome_html_artifact_folders(owner_id, id)
on delete set null;

commit;
