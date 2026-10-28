import type { SupabaseClient } from "@supabase/supabase-js";
import type { SectionKey } from "./food-db";
import type { EntriesBySection } from "./nutrition";
import { todayStr } from "./nutrition";
import { apiEnabled, apiRequest } from "./api";
import * as db from "./db";
import type {
  BodyTargetsRow,
  CustomFoodRow,
  DayTotals,
  QuickAddSuggestion,
  WeightLogRow,
} from "./db";

// What the pages read. Each function has the same signature as its db.ts
// twin and either asks the Python API (API_URL set) or queries Supabase
// directly (the default). The API derives the user from the token, so
// `userId` is only used on the direct path.

const get = <T>(supabase: SupabaseClient, path: string, query?: Record<string, string | number>) =>
  apiRequest<T>(supabase, "GET", path, { query });

export async function getEntriesForDate(supabase: SupabaseClient, userId: string, date: string): Promise<EntriesBySection> {
  if (!apiEnabled()) return db.getEntriesForDate(supabase, userId, date);
  return get(supabase, "/api/day", { date });
}

export async function getCustomFoods(supabase: SupabaseClient, userId: string): Promise<CustomFoodRow[]> {
  if (!apiEnabled()) return db.getCustomFoods(supabase, userId);
  return get(supabase, "/api/custom-foods");
}

export async function getBodyTargets(supabase: SupabaseClient, userId: string): Promise<BodyTargetsRow | null> {
  if (!apiEnabled()) return db.getBodyTargets(supabase, userId);
  return get(supabase, "/api/body-targets");
}

export async function getWaterIntake(supabase: SupabaseClient, userId: string, date: string): Promise<number> {
  if (!apiEnabled()) return db.getWaterIntake(supabase, userId, date);
  return (await get<{ amount_ml: number }>(supabase, "/api/water", { date })).amount_ml;
}

export async function getStreak(supabase: SupabaseClient, userId: string): Promise<number> {
  if (!apiEnabled()) return db.getStreak(supabase, userId);
  // Pass this server's calendar date so both services count from the same day.
  return (await get<{ streak: number }>(supabase, "/api/streak", { today: todayStr() })).streak;
}

export async function getQuickAddSuggestions(
  supabase: SupabaseClient,
  userId: string,
): Promise<Record<SectionKey, QuickAddSuggestion[]>> {
  if (!apiEnabled()) return db.getQuickAddSuggestions(supabase, userId);
  return get(supabase, "/api/quick-add");
}

export async function getRecentDailyTotals(supabase: SupabaseClient, userId: string, days: number): Promise<DayTotals[]> {
  if (!apiEnabled()) return db.getRecentDailyTotals(supabase, userId, days);
  return (await get<{ days: DayTotals[] }>(supabase, "/api/trends", { days, today: todayStr() })).days;
}

// The API takes a day count ending "today", so the [start, end] window the
// page computed with getRangeBounds is turned back into that count.
export async function getWeightLogs(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string,
): Promise<WeightLogRow[]> {
  if (!apiEnabled()) return db.getWeightLogs(supabase, userId, startDate, endDate);
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const days = Math.round((Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86_400_000) + 1;
  return (await get<{ logs: WeightLogRow[] }>(supabase, "/api/weight-logs", { days, today: endDate })).logs;
}

export async function getMonthTotals(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number, // 0-11
): Promise<Record<string, number>> {
  if (!apiEnabled()) return db.getMonthTotals(supabase, userId, year, month);
  return get(supabase, "/api/month-totals", { year, month });
}
