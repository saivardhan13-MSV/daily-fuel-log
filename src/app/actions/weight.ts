"use server";

import { apiRequest, runApiAction } from "@/lib/api";

// Validation lives in the API: real calendar dates, 0 < weight < 500, UUID
// ids, and the future-date check (which trusts `clientToday` only within one
// day of the server's date, so a forged value can't unlock arbitrary dates).

export interface LogWeightInput {
  loggedDate: string;
  weightKg: number;
  // The browser's own local "today" (never derived from toISOString()),
  // used only to keep the future-date check honest across timezones.
  clientToday?: string;
}

// The one write path for "Log weight" from the panel's default (today,
// possibly already logged) or a backfilled past date. Upserts on
// (user, logged_date): logging again for a date that already has a
// measurement silently corrects that day's value, never creates a second row.
export async function logWeight(input: LogWeightInput): Promise<{ error?: string }> {
  return runApiAction(
    async (supabase) => {
      await apiRequest(supabase, "PUT", "/api/weight-logs", { body: input });
      return {};
    },
    ["/trends"],
    "Failed to save weight",
  );
}

export interface UpdateWeightLogInput {
  id: string;
  loggedDate: string;
  weightKg: number;
  clientToday?: string;
}

// Corrects an existing row by id — distinct from logWeight's upsert-by-date
// because here the date itself may change. Moving a row onto a date that
// already has a different measurement fails cleanly, never silently
// overwriting that other row.
export async function updateWeightLog(input: UpdateWeightLogInput): Promise<{ error?: string }> {
  const { id, ...fields } = input;
  return runApiAction(
    async (supabase) => {
      await apiRequest(supabase, "PATCH", `/api/weight-logs/${encodeURIComponent(id)}`, { body: fields });
      return {};
    },
    ["/trends"],
    "Failed to update weight",
  );
}

export async function deleteWeightLog(id: string): Promise<{ error?: string }> {
  return runApiAction(
    async (supabase) => {
      await apiRequest(supabase, "DELETE", `/api/weight-logs/${encodeURIComponent(id)}`);
      return {};
    },
    ["/trends"],
    "Failed to delete weight",
  );
}
