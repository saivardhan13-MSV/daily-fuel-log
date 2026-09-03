"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculateTargets, type ActivityLevel, type Goal, type Sex } from "@/lib/targets";

export interface SaveBodyTargetsInput {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export async function saveBodyTargets(
  input: SaveBodyTargetsInput,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const macros = calculateTargets(input);

  const { error } = await supabase.from("body_targets").upsert({
    user_id: user.id,
    weight_kg: input.weightKg,
    height_cm: input.heightCm,
    age: input.age,
    sex: input.sex,
    activity_level: input.activityLevel,
    goal: input.goal,
    target_calories: macros.calories,
    target_protein: macros.protein,
    target_carbs: macros.carbs,
    target_fat: macros.fat,
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/targets");
  return {};
}
