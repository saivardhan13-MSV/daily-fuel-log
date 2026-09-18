-- Historical weigh-ins, independent of body_targets.weight_kg (which remains
-- a BMR-calculation input, untouched by this migration). One canonical
-- measurement per user per calendar date; edits/deletes address a row by its
-- own stable id (not by the date), since the date itself may be corrected.
-- Run this in the Supabase SQL Editor, same as the previous migrations.

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_date date not null,
  weight_kg numeric not null check (weight_kg > 0 and weight_kg < 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, logged_date)
);

alter table public.weight_logs enable row level security;

create policy "select own weight logs" on public.weight_logs
  for select using (auth.uid() = user_id);
create policy "insert own weight logs" on public.weight_logs
  for insert with check (auth.uid() = user_id);
create policy "update own weight logs" on public.weight_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own weight logs" on public.weight_logs
  for delete using (auth.uid() = user_id);
