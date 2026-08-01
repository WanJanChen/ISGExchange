-- Run this file in Supabase Dashboard > SQL Editor before setting .env.
-- This app uses Supabase Email and Password authentication.
create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  poster_image text,
  created_at timestamptz not null default now()
);
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  item_name text not null,
  amount numeric not null check (amount >= 0),
  quantity integer check (quantity >= 0),
  amounts jsonb not null default '[]'::jsonb,
  item_image text,
  note text
);
create table if not exists public.event_dates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  date_label text not null
);
create table if not exists public.exchanges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_date_id uuid not null references public.event_dates(id) on delete cascade,
  contact_handle text not null,
  contact_platform text check (contact_platform in ('instagram', 'threads')),
  nickname text,
  receiver_item_text text not null default '',
  receiver_item_image text,
  sender_item_text text not null,
  sender_expense_id uuid references public.expenses(id) on delete set null,
  is_prepared boolean not null default false,
  is_completed boolean not null default false,
  note text
);

alter table public.events enable row level security;
alter table public.expenses enable row level security;
alter table public.event_dates enable row level security;
alter table public.exchanges enable row level security;

create policy "Own events" on public.events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own expenses" on public.expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own dates" on public.event_dates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own exchanges" on public.exchanges for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
