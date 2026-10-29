import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Client for the Python API in backend/, which owns all data access. Server-side
// only: it forwards the signed-in user's Supabase access token, and the API
// verifies that token and runs every query as that user. The browser never
// talks to the API directly. Requires API_URL (see .env.local.example).

const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type Query = Record<string, string | number | undefined>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
}

export async function apiRequest<T>(
  supabase: SupabaseClient,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  { query, body }: RequestOptions = {},
): Promise<T> {
  const base = process.env.API_URL;
  if (!base) {
    console.error("[api] API_URL is not set; the app cannot load or save data without it");
    throw new ApiError("The app isn't configured correctly. Try again later.", 500);
  }

  // getUser() has already verified the user on the page/action; this only
  // reads the token from the session cookie to hand to the API, which
  // re-verifies it on its own.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new ApiError("Not signed in", 401);

  const url = new URL(path, base);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (e) {
    // The browser only gets the friendly message; the real cause stays in the
    // server log (connection refused, timeout, DNS, ...).
    const cause = e instanceof Error ? ((e.cause as { code?: string } | undefined)?.code ?? e.name) : "unknown";
    console.error(`[api] ${method} ${url.pathname} failed: ${cause}`);
    throw new ApiError("Couldn't reach the server. Try again.", 503);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") message = data.detail;
    } catch {
      // non-JSON error body: keep the generic message
    }
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as T;
}

// Shape every Server Action returns: `{ error }` on failure, `{}` on success.
// Runs the call, revalidates the given paths on success, and turns any
// failure into the message the UI already knows how to show.
export async function runApiAction<T extends object = Record<string, never>>(
  call: (supabase: SupabaseClient) => Promise<T>,
  revalidate: string[],
  fallbackMessage: string,
): Promise<T | { error: string }> {
  try {
    const result = await call(await createClient());
    for (const path of revalidate) revalidatePath(path);
    return result;
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : fallbackMessage };
  }
}
