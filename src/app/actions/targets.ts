"use server";

import { apiRequest, runApiAction } from "@/lib/api";
import type { ActivityLevel, Goal, Sex } from "@/lib/targets";

export interface SaveBodyTargetsInput {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: Goal;
}

// The API computes the calorie and macro targets itself from these inputs
// (Mifflin-St Jeor); the client never supplies the resulting numbers.
export async function saveBodyTargets(
  input: SaveBodyTargetsInput,
): Promise<{ error?: string }> {
  return runApiAction(
    async (supabase) => {
      await apiRequest(supabase, "PUT", "/api/body-targets", { body: input });
      return {};
    },
    ["/", "/targets"],
    "Failed to save targets",
  );
}
