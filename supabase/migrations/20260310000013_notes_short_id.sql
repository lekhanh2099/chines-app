-- Migration: Add short_id to notes for cleaner URLs
-- Pattern: /note/<short_id> instead of /notes/<uuid>

-- 1. Add short_id column
alter table public.notes
  add column if not exists short_id text;

-- 2. Unique index for fast lookups
create unique index if not exists idx_notes_short_id
  on public.notes (short_id) where short_id is not null;

-- 3. Function to generate a random alphanumeric short ID (8 chars)
create or replace function generate_note_short_id()
returns text
language plpgsql
as $$
declare
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

-- 4. Backfill existing notes with short_ids
do $$
declare
  note_rec record;
  new_short_id text;
  collision boolean;
begin
  for note_rec in select id from public.notes where short_id is null loop
    collision := true;
    while collision loop
      new_short_id := generate_note_short_id();
      collision := exists(select 1 from public.notes where short_id = new_short_id);
    end loop;
    update public.notes set short_id = new_short_id where id = note_rec.id;
  end loop;
end;
$$;

-- 5. Trigger to auto-generate short_id on insert
create or replace function set_note_short_id()
returns trigger
language plpgsql
as $$
declare
  new_short_id text;
  collision boolean;
begin
  if new.short_id is null then
    collision := true;
    while collision loop
      new_short_id := generate_note_short_id();
      collision := exists(select 1 from public.notes where short_id = new_short_id);
    end loop;
    new.short_id := new_short_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_note_short_id on public.notes;
create trigger trg_note_short_id
  before insert on public.notes
  for each row execute function set_note_short_id();
