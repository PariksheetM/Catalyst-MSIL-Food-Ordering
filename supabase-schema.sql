-- Portal schema
-- Safe to run multiple times (idempotent). Paste the whole file into the
-- Supabase SQL editor (Dashboard -> SQL Editor -> New query) and Run.

-- ---------- Records table ----------
create table if not exists public.paratha_records (
  id          bigint generated always as identity primary key,
  entry_date  date        not null,
  paratha_qty integer     not null check (paratha_qty >= 0),
  emp_name    text        not null,
  meal_type   text        not null,
  created_at  timestamptz not null default now()
);

-- New prefilled columns (added if the table already existed).
alter table public.paratha_records
  add column if not exists item_name text not null default 'Aloo Pyaz Paratha';
alter table public.paratha_records
  add column if not exists rate numeric not null default 12;

create index if not exists paratha_records_entry_date_idx
  on public.paratha_records (entry_date desc);

alter table public.paratha_records enable row level security;

-- ---------- Form settings (single row holds the field order) ----------
create table if not exists public.form_settings (
  id          int primary key default 1,
  field_order jsonb not null default
    '["emp_name","entry_date","paratha_qty","meal_type","item_name","rate"]'::jsonb,
  updated_at  timestamptz not null default now(),
  constraint form_settings_singleton check (id = 1)
);

insert into public.form_settings (id) values (1)
  on conflict (id) do nothing;

alter table public.form_settings enable row level security;

-- Row Level Security is ON with NO policies on purpose: the app reaches these
-- tables only through server API routes using the service_role key, which
-- bypasses RLS. The public anon key therefore cannot read or write directly.
