import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ApiError, apiRequest } from "@/lib/api";

export interface SearchResult {
  name: string;
  carbs: number;
  protein: number;
  fat: number;
  cal: number;
  source: string;
}

// Thin proxy: the USDA FoodData Central lookup (and its API key) live in the
// Python API. This route only keeps the browser same-origin and signed-in.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await apiRequest<SearchResult[]>(supabase, "GET", "/api/food-search", { query: { q: query } });
    return NextResponse.json({ results });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    // Fail soft: saved foods still work without USDA results.
    return NextResponse.json({ results: [] });
  }
}
