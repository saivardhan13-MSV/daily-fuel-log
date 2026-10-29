"use server";

import { createClient } from "@/lib/supabase/server";
import type { SectionKey } from "@/lib/food-db";
import type { EntriesBySection, EntryItem } from "@/lib/nutrition";
import { ApiError, apiRequest, runApiAction } from "@/lib/api";

// All validation (calendar dates, sections, ids, numbers) happens in the
// Python API, which is the only thing that writes these tables. These actions
// pass the call through and return the `{ error }` shape the UI already shows.

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
  return runApiAction(
    async (supabase) => {
      await apiRequest(supabase, "POST", "/api/entries", { body: input });
      return {};
    },
    ["/"],
    "Failed to add item",
  );
}

export async function removeEntry(id: string): Promise<{ error?: string }> {
  return runApiAction(
    async (supabase) => {
      await apiRequest(supabase, "DELETE", `/api/entries/${encodeURIComponent(id)}`);
      return {};
    },
    ["/"],
    "Failed to remove item",
  );
}

export async function clearDay(date: string): Promise<{ error?: string }> {
  return runApiAction(
    async (supabase) => {
      await apiRequest(supabase, "DELETE", "/api/day", { query: { date } });
      return {};
    },
    ["/"],
    "Failed to clear day",
  );
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
  try {
    const supabase = await createClient();
    return await apiRequest<MealCopyPreview | null>(supabase, "GET", "/api/copy/meal-preview", {
      query: { dest_date: destDate, section },
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Failed to load previous meal" };
  }
}

export interface DayCopyPreview {
  sourceDate: string;
  entries: EntriesBySection;
}

// If `sourceDate` is given, previews that specific date (the API still checks
// it is strictly before destDate). Otherwise finds the nearest prior logged
// date across any section.
export async function getDayCopyPreview(
  destDate: string,
  sourceDate?: string,
): Promise<DayCopyPreview | { error: string } | null> {
  try {
    const supabase = await createClient();
    return await apiRequest<DayCopyPreview | null>(supabase, "GET", "/api/copy/day-preview", {
      query: { dest_date: destDate, source_date: sourceDate },
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Failed to load previous day" };
  }
}

export async function getRecentDatesForCopy(destDate: string): Promise<string[]> {
  try {
    const supabase = await createClient();
    return await apiRequest<string[]>(supabase, "GET", "/api/copy/recent-dates", {
      query: { dest_date: destDate },
    });
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
// day". The API re-reads the source rows itself (never trusting client-echoed
// preview data) and inserts them in a single batch; each row keeps its
// original section.
export async function copyEntries(
  input: CopyEntriesInput,
): Promise<{ error?: string; copiedCount?: number }> {
  return runApiAction(
    (supabase) => apiRequest<{ copiedCount: number }>(supabase, "POST", "/api/copy", { body: input }),
    ["/"],
    "Failed to copy",
  );
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
  return runApiAction(
    async (supabase) => {
      await apiRequest(supabase, "PUT", "/api/custom-foods", {
        body: { ...input, pieceWeight: input.pieceWeight ?? null, density: input.density ?? null },
      });
      return {};
    },
    ["/"],
    "Failed to save food",
  );
}
