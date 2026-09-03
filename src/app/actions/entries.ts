"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SectionKey } from "@/lib/food-db";

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
