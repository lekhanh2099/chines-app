create table if not exists public.hanzihome_import_chunks (
  import_key text not null,
  part integer not null,
  total_parts integer not null,
  payload text not null,
  created_at timestamptz not null default now(),
  primary key (import_key, part)
);

alter table public.hanzihome_import_chunks enable row level security;
revoke all on public.hanzihome_import_chunks from anon, authenticated;

