import type { SupabaseClient } from "@supabase/supabase-js";
import { SECTIONS, type SectionKey } from "./food-db";
import type { EntriesBySection, EntryItem } from "./nutrition";

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

export async function getBodyTargets(
  supabase: SupabaseClient,
  userId: string,
): Promise<BodyTargetsRow | null> {
  const { data, error } = await supabase
    .from("body_targets")
    .select(
      "weight_kg, height_cm, age, sex, activity_level, goal, target_calories, target_protein, target_carbs, target_fat",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getWaterIntake(
  supabase: SupabaseClient,
  userId: string,
  date: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("water_intake")
    .select("amount_ml")
    .eq("user_id", userId)
    .eq("entry_date", date)
    .maybeSingle();

  if (error) throw error;
  return data ? Number(data.amount_ml) : 0;
}

export function emptyEntries(): EntriesBySection {
  const e = {} as EntriesBySection;
  for (const s of SECTIONS) e[s.key] = [];
  return e;
}

export async function getEntriesForDate(
  supabase: SupabaseClient,
  userId: string,
  date: string,
): Promise<EntriesBySection> {
  const { data, error } = await supabase
    .from("daily_entries")
    .select("id, section, food_name, qty, qty_label, unit, carbs, protein, fat, calories")
    .eq("user_id", userId)
    .eq("entry_date", date)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const entries = emptyEntries();
  for (const row of data ?? []) {
    const section = row.section as SectionKey;
    if (entries[section]) entries[section].push(row as EntryItem);
  }
  return entries;
}

export async function getCustomFoods(
  supabase: SupabaseClient,
  userId: string,
): Promise<CustomFoodRow[]> {
  const { data, error } = await supabase
    .from("custom_foods")
    .select("id, name, carbs, protein, fat, calories, piece_weight, density")
    .eq("user_id", userId);

  if (error) throw error;
  return data ?? [];
}

function pad(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}
function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Consecutive days (ending today or yesterday) with at least one logged
// entry. A day with nothing logged yet doesn't break an in-progress streak
// until it actually passes.
export async function getStreak(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("daily_entries")
    .select("entry_date")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(2000);

  if (error) throw error;

  const dateSet = new Set((data ?? []).map((r) => r.entry_date as string));
  if (dateSet.size === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(today);
  if (!dateSet.has(formatDate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (dateSet.has(formatDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface DayTotals {
  date: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Per-day totals for the last `days` days (including today), oldest first,
// with every day present even if nothing was logged (filled with zeros).
export async function getRecentDailyTotals(
  supabase: SupabaseClient,
  userId: string,
  days: number,
): Promise<DayTotals[]> {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));

  const { data, error } = await supabase
    .from("daily_entries")
    .select("entry_date, calories, protein, carbs, fat")
    .eq("user_id", userId)
    .gte("entry_date", formatDate(start))
    .lte("entry_date", formatDate(end));

  if (error) throw error;

  const byDate = new Map<string, DayTotals>();
  for (const row of data ?? []) {
    const key = row.entry_date as string;
    const existing = byDate.get(key) ?? { date: key, cal: 0, protein: 0, carbs: 0, fat: 0 };
    existing.cal += Number(row.calories ?? 0);
    existing.protein += Number(row.protein ?? 0);
    existing.carbs += Number(row.carbs ?? 0);
    existing.fat += Number(row.fat ?? 0);
    byDate.set(key, existing);
  }

  const out: DayTotals[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = formatDate(cursor);
    out.push(byDate.get(key) ?? { date: key, cal: 0, protein: 0, carbs: 0, fat: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

// date (YYYY-MM-DD) -> total calories for that day, for the given month
export async function getMonthTotals(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number, // 0-11
): Promise<Record<string, number>> {
  const start = `${year}-${pad(month + 1)}-01`;
  const endDate = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${pad(month + 1)}-${pad(endDate)}`;

  const { data, error } = await supabase
    .from("daily_entries")
    .select("entry_date, calories")
    .eq("user_id", userId)
    .gte("entry_date", start)
    .lte("entry_date", end);

  if (error) throw error;

  const totals: Record<string, number> = {};
  for (const row of data ?? []) {
    totals[row.entry_date] = (totals[row.entry_date] ?? 0) + Number(row.calories ?? 0);
  }
  return totals;
}
