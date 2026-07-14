alter table public.hanzihome_listening_items
  drop constraint if exists hanzihome_listening_items_content_check;

alter table public.hanzihome_listening_items
  add constraint hanzihome_listening_items_content_check
  check (
    transcript_zh is not null
    or prompt_zh is not null
    or jsonb_array_length(options) > 0
  );
