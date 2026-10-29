"use server";

import { apiRequest, runApiAction } from "@/lib/api";

export async function addWater(date: string, deltaMl: number): Promise<{ error?: string }> {
  return runApiAction(
    async (supabase) => {
      await apiRequest(supabase, "POST", "/api/water/add", { body: { date, deltaMl } });
      return {};
    },
    ["/"],
    "Failed to update water intake",
  );
}

export async function resetWater(date: string): Promise<{ error?: string }> {
  return runApiAction(
    async (supabase) => {
      await apiRequest(supabase, "POST", "/api/water/reset", { body: { date } });
      return {};
    },
    ["/"],
    "Failed to reset water intake",
  );
}
