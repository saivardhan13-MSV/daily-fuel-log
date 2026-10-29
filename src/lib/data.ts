import type { SupabaseClient } from "@supabase/supabase-js";
import type { SectionKey } from "./food-db";
import type { EntriesBySection } from "./nutrition";
import { todayStr } from "./nutrition";
import { apiRequest } from "./api";

// What the pages read. Every function asks the Python API (backend/), which
// takes the user from the forwarded Supabase token; nothing here queries the
// database directly. The row types below are the API's response shapes.

export interface CustomFoodRow {
  id: string;
  name: string;
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
  piece_weight: number | null;
  density: number | null;
}

export interface BodyTargetsRow {
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  sex: "male" | "female" | null;
  activity_level: string | null;
  goal: "cut" | "maintain" | "bulk" | null;
  target_calories: number | null;
  target_protein: number | null;
  target_carbs: number | null;
  target_fat: number | null;
}

export interface QuickAddSuggestion {
  foodName: string;
  qty: number;
  qtyLabel: string;
  unit: "g" | "pc" | "ml";
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
}

export interface DayTotals {
  date: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  // True only when the user actually logged at least one entry that day.
  // A day with nothing logged still gets a zero-filled row (so callers get
  // one entry per calendar day), but `logged: false` is what distinguishes
  // "not logged" from "logged and genuinely totaled zero" — callers doing
  // averages or target-hit counts must filter on this, not on `cal > 0`.
  logged: boolean;
}

export interface WeightLogRow {
  id: string;
  logged_date: string;
  weight_kg: number;
}

const get = <T>(supabase: SupabaseClient, path: string, query?: Record<string, string | number>) =>
  apiRequest<T>(supabase, "GET", path, { query });

function pad(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}

// The last `days` calendar days ending today, as local-calendar YYYY-MM-DD
// bounds. Pages use it to name the window they are showing; the API slices
// the same window from the `today` it is given.
export function getRangeBounds(days: number): { start: string; end: string } {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { start: fmt(start), end: fmt(end) };
}

export function getEntriesForDate(supabase: SupabaseClient, date: string): Promise<EntriesBySection> {
  return get(supabase, "/api/day", { date });
}

export function getCustomFoods(supabase: SupabaseClient): Promise<CustomFoodRow[]> {
  return get(supabase, "/api/custom-foods");
}

export function getBodyTargets(supabase: SupabaseClient): Promise<BodyTargetsRow | null> {
  return get(supabase, "/api/body-targets");
}

export async function getWaterIntake(supabase: SupabaseClient, date: string): Promise<number> {
  return (await get<{ amount_ml: number }>(supabase, "/api/water", { date })).amount_ml;
}

// Consecutive days (ending today or yesterday) with at least one logged
// entry. This server's calendar date is passed so both services count from
// the same day.
export async function getStreak(supabase: SupabaseClient): Promise<number> {
  return (await get<{ streak: number }>(supabase, "/api/streak", { today: todayStr() })).streak;
}

// Recent + frequent foods per meal section, ranked by the API.
export function getQuickAddSuggestions(
  supabase: SupabaseClient,
): Promise<Record<SectionKey, QuickAddSuggestion[]>> {
  return get(supabase, "/api/quick-add");
}

// Per-day totals for the last `days` days (including today), oldest first,
// with every day present even if nothing was logged (filled with zeros).
export async function getRecentDailyTotals(supabase: SupabaseClient, days: number): Promise<DayTotals[]> {
  return (await get<{ days: DayTotals[] }>(supabase, "/api/trends", { days, today: todayStr() })).days;
}

// Real weigh-ins only, oldest first, no zero-filling. The API takes a day
// count ending "today", so the [start, end] window the page computed with
// getRangeBounds is turned back into that count.
export async function getWeightLogs(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
): Promise<WeightLogRow[]> {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const days = Math.round((Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86_400_000) + 1;
  return (await get<{ logs: WeightLogRow[] }>(supabase, "/api/weight-logs", { days, today: endDate })).logs;
}

// date (YYYY-MM-DD) -> total calories for that day, for the given month
export function getMonthTotals(
  supabase: SupabaseClient,
  year: number,
  month: number, // 0-11
): Promise<Record<string, number>> {
  return get(supabase, "/api/month-totals", { year, month });
}
