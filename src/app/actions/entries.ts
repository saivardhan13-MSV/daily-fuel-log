"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SECTIONS, type SectionKey } from "@/lib/food-db";
import { getEntriesForDate, getNearestPriorLoggedDate, getRecentLoggedDates } from "@/lib/db";
import type { EntriesBySection, EntryItem } from "@/lib/nutrition";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, userId: user.id };
}

export interface AddEntryInput {
  date: string;
  section: SectionKey;
  foodName: string;
  qty: number;
  qtyLabel: string;
  unit: "g" | "pc" | "ml";
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
}

export async function addEntry(input: AddEntryInput): Promise<{ error?: string }> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from("daily_entries").insert({
      user_id: userId,
      entry_date: input.date,
      section: input.section,
      food_name: input.foodName,
      qty: input.qty,
      qty_label: input.qtyLabel,
      unit: input.unit,
      carbs: input.carbs,
      protein: input.protein,
      fat: input.fat,
      calories: input.calories,
    });
    if (error) return { error: error.message };
    revalidatePath("/");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add item" };
  }
}

export async function removeEntry(id: string): Promise<{ error?: string }> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase
      .from("daily_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { error: error.message };
    revalidatePath("/");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to remove item" };
  }
}

export async function clearDay(date: string): Promise<{ error?: string }> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase
      .from("daily_entries")
      .delete()
      .eq("user_id", userId)
      .eq("entry_date", date);
    if (error) return { error: error.message };
    revalidatePath("/");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to clear day" };
  }
}

// Server Actions are invoked over the network as plain serialized calls, so
// TypeScript's param types give no runtime guarantee — a client bypassing
// the UI could send any string. `entry_date` is constrained by the DB
// column type and `section` by a DB check constraint, but validating here
// avoids relying on a raw Postgres/PostgREST round trip (and its error
// text) to reject obviously-malformed input.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function isValidDateString(d: string): boolean {
  return DATE_RE.test(d);
}

const VALID_SECTIONS = new Set<string>(SECTIONS.map((s) => s.key));
function isValidSection(s: string): s is SectionKey {
  return VALID_SECTIONS.has(s);
}

export interface MealCopyPreview {
  sourceDate: string;
  items: EntryItem[];
}

// Finds the nearest prior date with entries in this section and returns
// them, or null if nothing exists to copy — the empty state, not an error.
export async function getMealCopyPreview(
  destDate: string,
  section: SectionKey,
): Promise<MealCopyPreview | { error: string } | null> {
  if (!isValidDateString(destDate) || !isValidSection(section)) {
    return { error: "Invalid request" };
  }
  try {
    const { supabase, userId } = await requireUser();
    const sourceDate = await getNearestPriorLoggedDate(supabase, userId, destDate, section);
    if (!sourceDate) return null;
    const entries = await getEntriesForDate(supabase, userId, sourceDate);
    return { sourceDate, items: entries[section] };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load previous meal" };
  }
}

export interface DayCopyPreview {
  sourceDate: string;
  entries: EntriesBySection;
}

// If `sourceDate` is given, previews that specific date (still validated
// server-side to be strictly before destDate at copy time). Otherwise finds
// the nearest prior logged date across any section.
export async function getDayCopyPreview(
  destDate: string,
  sourceDate?: string,
): Promise<DayCopyPreview | { error: string } | null> {
  if (!isValidDateString(destDate) || (sourceDate !== undefined && !isValidDateString(sourceDate))) {
    return { error: "Invalid request" };
  }
  try {
    const { supabase, userId } = await requireUser();
    const resolvedDate = sourceDate ?? (await getNearestPriorLoggedDate(supabase, userId, destDate));
    if (!resolvedDate) return null;
    if (resolvedDate >= destDate) return { error: "Pick a date before the one you're viewing" };
    const entries = await getEntriesForDate(supabase, userId, resolvedDate);
    return { sourceDate: resolvedDate, entries };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load previous day" };
  }
}

export async function getRecentDatesForCopy(destDate: string): Promise<string[]> {
  if (!isValidDateString(destDate)) return [];
  try {
    const { supabase, userId } = await requireUser();
    return await getRecentLoggedDates(supabase, userId, destDate, 8);
  } catch {
    return [];
  }
}

export interface CopyEntriesInput {
  destDate: string;
  sourceDate: string;
  section: SectionKey | null; // null = whole day, every section
}

// The one bulk-copy path for both "copy previous meal" and "copy previous
// day" — re-reads the source rows fresh (never trusts client-echoed preview
// data for the actual write) and inserts them as new daily_entries rows in
// a single batch insert, stamped with the current user and destination
// date. Source section is preserved per row, so a whole-day copy lands each
// item back in the section it came from.
export async function copyEntries(
  input: CopyEntriesInput,
): Promise<{ error?: string; copiedCount?: number }> {
  if (
    !isValidDateString(input.destDate) ||
    !isValidDateString(input.sourceDate) ||
    (input.section !== null && !isValidSection(input.section))
  ) {
    return { error: "Invalid request" };
  }
  try {
    const { supabase, userId } = await requireUser();

    if (input.sourceDate >= input.destDate) {
      return { error: "Source date must be before the date you're viewing" };
    }

    let query = supabase
      .from("daily_entries")
      .select("section, food_name, qty, qty_label, unit, carbs, protein, fat, calories")
      .eq("user_id", userId)
      .eq("entry_date", input.sourceDate);
    if (input.section) query = query.eq("section", input.section);

    const { data: sourceRows, error: fetchError } = await query;
    if (fetchError) return { error: fetchError.message };
    if (!sourceRows || sourceRows.length === 0) {
      return { error: "Nothing to copy from that date" };
    }

    const rows = sourceRows.map((r) => ({
      user_id: userId,
      entry_date: input.destDate,
      section: r.section,
      food_name: r.food_name,
      qty: r.qty,
      qty_label: r.qty_label,
      unit: r.unit,
      carbs: r.carbs,
      protein: r.protein,
      fat: r.fat,
      calories: r.calories,
    }));

    const { error: insertError } = await supabase.from("daily_entries").insert(rows);
    if (insertError) return { error: insertError.message };

    revalidatePath("/");
    return { copiedCount: rows.length };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to copy" };
  }
}

export interface UpsertCustomFoodInput {
  name: string;
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
  pieceWeight?: number | null;
  density?: number | null;
}

export async function upsertCustomFood(
  input: UpsertCustomFoodInput,
): Promise<{ error?: string }> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from("custom_foods").upsert(
      {
        user_id: userId,
        name: input.name.toLowerCase(),
        carbs: input.carbs,
        protein: input.protein,
        fat: input.fat,
        calories: input.calories,
        piece_weight: input.pieceWeight ?? null,
        density: input.density ?? null,
      },
      { onConflict: "user_id,name" },
    );
    if (error) return { error: error.message };
    revalidatePath("/");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save food" };
  }
}
