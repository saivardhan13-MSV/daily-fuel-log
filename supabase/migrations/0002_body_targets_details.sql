-- Adds the inputs the Mifflin-St Jeor BMR formula actually needs (height, age,
-- biological sex) — the Phase 1 schema only had weight/goal/activity_level,
-- which isn't enough to compute BMR properly.
-- Run this in the Supabase SQL Editor, same as 0001_init.sql.

alter table public.body_targets
  add column if not exists height_cm numeric,
  add column if not exists age integer,
  add column if not exists sex text check (sex in ('male', 'female'));
