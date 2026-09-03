-- Water intake tracking — one row per user per day, incremented by quick-add buttons.
-- Run this in the Supabase SQL Editor, same as the previous migrations.

create table if not exists public.water_intake (
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  amount_ml numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, entry_date)
);

alter table public.water_intake enable row level security;

create policy "select own water" on public.water_intake
  for select using (auth.uid() = user_id);
create policy "insert own water" on public.water_intake
  for insert with check (auth.uid() = user_id);
create policy "update own water" on public.water_intake
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own water" on public.water_intake
  for delete using (auth.uid() = user_id);
