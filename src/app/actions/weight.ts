"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayStr } from "@/lib/nutrition";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, userId: user.id };
}

// Format alone isn't enough — "2026-02-30" and "2026-13-40" both match this
// regex despite being impossible calendar dates. The round-trip through a
// local Date (constructed from explicit numeric y/m/d, never a parsed
// string, so this carries no timezone ambiguity) normalizes invalid dates
// by rolling over — if the normalized result doesn't match what was typed,
// the input wasn't a real date.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function isValidDateString(d: string): boolean {
  if (!DATE_RE.test(d)) return false;
  const [y, m, day] = d.split("-").map(Number);
  const date = new Date(y, m - 1, day);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === day;
}

function isValidWeight(w: number): boolean {
  return Number.isFinite(w) && w > 0 && w < 500;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidId(id: string): boolean {
  return UUID_RE.test(id);
}

// Whole-day difference between two YYYY-MM-DD strings, computed via
// Date.UTC on explicit numeric components — never a parsed string — so this
// is pure calendar arithmetic with no local-timezone interpretation at all.
function daysBetween(dateA: string, dateB: string): number {
  const [ay, am, ad] = dateA.split("-").map(Number);
  const [by, bm, bd] = dateB.split("-").map(Number);
  const a = Date.UTC(ay, am - 1, ad);
  const b = Date.UTC(by, bm - 1, bd);
  return Math.round((a - b) / 86_400_000);
}

// The deployed server almost certainly runs in UTC (Node/Vercel default,
// and nothing in this project sets TZ), while the browser sends its own
// genuine local "today". For any user meaningfully ahead of UTC (e.g.
// India, UTC+5:30 — the timezone this app's sample data targets), their
// real local "today" can already be one calendar day ahead of the server's
// UTC "today" for several hours around midnight, which a naive
// server-local comparison would wrongly reject as "the future".
//
// No real-world timezone diverges from UTC by more than one calendar day
// in either direction, so trusting a client-supplied "today" is safe only
// within that ±1 day window — anything further off is not a legitimate
// timezone, just a spoofed value, and falls back to the server's own UTC
// clock. This can never be used to accept an actually-arbitrary future
// date: the most a forged clientToday can buy is the same ±1 day any real
// timezone would legitimately get.
function resolveFutureCheckReference(clientToday: string | undefined, serverToday: string): string {
  if (clientToday && isValidDateString(clientToday) && Math.abs(daysBetween(clientToday, serverToday)) <= 1) {
    return clientToday;
  }
  return serverToday;
}

export interface LogWeightInput {
  loggedDate: string;
  weightKg: number;
  // The browser's own local "today" (never derived from toISOString()),
  // used only to keep the future-date check honest across timezones — see
  // resolveFutureCheckReference above for why this can't be abused.
  clientToday?: string;
}

// The one write path for "Log weight" from the panel's default (today,
// possibly already logged) or a backfilled past date. Upserts on
// (user_id, logged_date) — logging again for a date that already has a
// measurement silently corrects that day's value, never creates a second row.
export async function logWeight(input: LogWeightInput): Promise<{ error?: string }> {
  if (!isValidDateString(input.loggedDate)) return { error: "Invalid date" };
  if (!isValidWeight(input.weightKg)) return { error: "Enter a weight between 0 and 500 kg" };
  if (input.loggedDate > resolveFutureCheckReference(input.clientToday, todayStr())) {
    return { error: "You can't log a future date" };
  }

  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from("weight_logs").upsert(
      {
        user_id: userId,
        logged_date: input.loggedDate,
        weight_kg: input.weightKg,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,logged_date" },
    );
    if (error) return { error: "Failed to save weight" };

    revalidatePath("/trends");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save weight" };
  }
}

export interface UpdateWeightLogInput {
  id: string;
  loggedDate: string;
  weightKg: number;
  clientToday?: string;
}

// Corrects an existing row by id — distinct from logWeight's upsert-by-date
// because here the date itself may change. Moving a row onto a date that
// already has a different measurement must fail cleanly, never silently
// overwrite that other row (which an upsert-by-date would do instead).
export async function updateWeightLog(input: UpdateWeightLogInput): Promise<{ error?: string }> {
  if (!isValidId(input.id)) return { error: "Invalid request" };
  if (!isValidDateString(input.loggedDate)) return { error: "Invalid date" };
  if (!isValidWeight(input.weightKg)) return { error: "Enter a weight between 0 and 500 kg" };
  if (input.loggedDate > resolveFutureCheckReference(input.clientToday, todayStr())) {
    return { error: "You can't log a future date" };
  }

  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase
      .from("weight_logs")
      .update({
        logged_date: input.loggedDate,
        weight_kg: input.weightKg,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .eq("user_id", userId);

    if (error) {
      if (error.code === "23505") {
        return { error: "You already have a weight logged for that date." };
      }
      return { error: "Failed to update weight" };
    }

    revalidatePath("/trends");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update weight" };
  }
}

export async function deleteWeightLog(id: string): Promise<{ error?: string }> {
  if (!isValidId(id)) return { error: "Invalid request" };

  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from("weight_logs").delete().eq("id", id).eq("user_id", userId);
    if (error) return { error: "Failed to delete weight" };

    revalidatePath("/trends");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete weight" };
  }
}
