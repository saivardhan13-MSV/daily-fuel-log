-- Daily Fuel Log — initial schema
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- daily_entries: one row per food item logged into one meal section on one day
-- ---------------------------------------------------------------------------
create table if not exists public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  section text not null check (section in (
    'breakfast', 'midMorningSnack', 'lunch', 'eveningSnack',
    'preWorkout', 'postWorkout', 'dinner'
  )),
  food_name text not null,
  qty numeric not null,          -- grams actually used, after any pc/ml conversion
  qty_label text not null,       -- display string, e.g. "1 pc -> 118g used"
  unit text not null default 'g' check (unit in ('g', 'pc', 'ml')),
  carbs numeric not null default 0,
  protein numeric not null default 0,
  fat numeric not null default 0,
  calories numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists daily_entries_user_date_idx
  on public.daily_entries (user_id, entry_date);

alter table public.daily_entries enable row level security;

create policy "select own entries" on public.daily_entries
  for select using (auth.uid() = user_id);
create policy "insert own entries" on public.daily_entries
  for insert with check (auth.uid() = user_id);
create policy "update own entries" on public.daily_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own entries" on public.daily_entries
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- custom_foods: per-user food macros (per 100g), seeded by search picks or
-- manual "not in our list" entries
-- ---------------------------------------------------------------------------
create table if not exists public.custom_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  carbs numeric not null default 0,
  protein numeric not null default 0,
  fat numeric not null default 0,
  calories numeric not null default 0,
  piece_weight numeric,   -- grams per piece, if known (for "pc" unit mode)
  density numeric,        -- grams per ml, if known (for "ml" unit mode)
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.custom_foods enable row level security;

create policy "select own custom foods" on public.custom_foods
  for select using (auth.uid() = user_id);
create policy "insert own custom foods" on public.custom_foods
  for insert with check (auth.uid() = user_id);
create policy "update own custom foods" on public.custom_foods
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own custom foods" on public.custom_foods
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- body_targets: one current row per user (bodyweight-based daily targets)
-- ---------------------------------------------------------------------------
create table if not exists public.body_targets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weight_kg numeric,
  goal text check (goal in ('cut', 'maintain', 'bulk')),
  activity_level text,
  target_calories numeric,
  target_protein numeric,
  target_carbs numeric,
  target_fat numeric,
  updated_at timestamptz not null default now()
);

alter table public.body_targets enable row level security;

create policy "select own targets" on public.body_targets
  for select using (auth.uid() = user_id);
create policy "insert own targets" on public.body_targets
  for insert with check (auth.uid() = user_id);
create policy "update own targets" on public.body_targets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own targets" on public.body_targets
  for delete using (auth.uid() = user_id);
