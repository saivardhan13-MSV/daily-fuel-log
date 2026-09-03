"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, userId: user.id };
}

export async function addWater(date: string, deltaMl: number): Promise<{ error?: string }> {
  try {
    const { supabase, userId } = await requireUser();

    const { data: existing, error: readError } = await supabase
      .from("water_intake")
      .select("amount_ml")
      .eq("user_id", userId)
      .eq("entry_date", date)
      .maybeSingle();
    if (readError) return { error: readError.message };

    const newAmount = Math.max(0, Number(existing?.amount_ml ?? 0) + deltaMl);

    const { error } = await supabase.from("water_intake").upsert(
      {
        user_id: userId,
        entry_date: date,
        amount_ml: newAmount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,entry_date" },
    );
    if (error) return { error: error.message };

    revalidatePath("/");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update water intake" };
  }
}

export async function resetWater(date: string): Promise<{ error?: string }> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from("water_intake").upsert(
      {
        user_id: userId,
        entry_date: date,
        amount_ml: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,entry_date" },
    );
    if (error) return { error: error.message };
    revalidatePath("/");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to reset water intake" };
  }
}
