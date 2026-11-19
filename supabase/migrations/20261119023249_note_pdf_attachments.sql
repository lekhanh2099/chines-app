-- One imported PDF per note. The file lives in the private `note-pdfs` bucket at
-- `<user_id>/<note_id>/<attachment_id>.pdf`; page ink reuses
-- public.hanzihome_pdf_annotations with asset_id = 'note-pdf:<attachment_id>'.
begin;
set local lock_timeout = '5s';

create table public.note_pdf_attachments (
 id uuid primary key default gen_random_uuid(),
 note_id uuid not null references public.notes(id) on delete cascade,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 storage_path text not null,
 file_name text not null,
 byte_size bigint not null,
 page_count integer not null,
 created_at timestamptz not null default now(),
 constraint note_pdf_attachments_note_id_key unique (note_id),
 constraint note_pdf_attachments_storage_path_check
  check (storage_path = user_id::text || '/' || note_id::text || '/' || id::text || '.pdf'),
 constraint note_pdf_attachments_file_name_check
  check (length(btrim(file_name)) between 1 and 255),
 constraint note_pdf_attachments_byte_size_check check (byte_size between 1 and 52428800),
 constraint note_pdf_attachments_page_count_check check (page_count between 1 and 2000)
);

create index note_pdf_attachments_user_idx on public.note_pdf_attachments (user_id);

alter table public.note_pdf_attachments enable row level security;

create policy "Owners read their note PDFs" on public.note_pdf_attachments
 for select to authenticated
 using (user_id = (select auth.uid()));

create policy "Owners attach PDFs to their notes" on public.note_pdf_attachments
 for insert to authenticated
 with check (
  user_id = (select auth.uid())
  and exists (
   select 1 from public.notes
   where notes.id = note_pdf_attachments.note_id and notes.user_id = (select auth.uid())
  )
 );

create policy "Owners remove their note PDFs" on public.note_pdf_attachments
 for delete to authenticated
 using (user_id = (select auth.uid()));

revoke all on table public.note_pdf_attachments from anon, authenticated;
grant select, insert, delete on table public.note_pdf_attachments to authenticated;
grant all on table public.note_pdf_attachments to service_role;

-- Ink rows cannot be deleted by clients (CAS-only writes), so the attachment
-- owns their cleanup, including when the note delete cascades here.
create function public.note_pdf_attachments_delete_ink()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
 delete from public.hanzihome_pdf_annotations
 where user_id = old.user_id and asset_id = 'note-pdf:' || old.id::text;
 return old;
end;
$$;
revoke all on function public.note_pdf_attachments_delete_ink() from public, anon, authenticated;

create trigger note_pdf_attachments_delete_ink
 after delete on public.note_pdf_attachments
 for each row execute function public.note_pdf_attachments_delete_ink();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('note-pdfs', 'note-pdfs', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

create policy "Owners read their note PDF files" on storage.objects
 for select to authenticated
 using (bucket_id = 'note-pdfs' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Owners upload their note PDF files" on storage.objects
 for insert to authenticated
 with check (bucket_id = 'note-pdfs' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Owners delete their note PDF files" on storage.objects
 for delete to authenticated
 using (bucket_id = 'note-pdfs' and (storage.foldername(name))[1] = (select auth.uid())::text);

commit;
