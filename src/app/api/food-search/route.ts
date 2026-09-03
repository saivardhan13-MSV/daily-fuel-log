import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface SearchResult {
  name: string;
  carbs: number;
  protein: number;
  fat: number;
  cal: number;
  source: string;
}

// USDA nutrient numbers (stable across food types): Energy(kcal)=208, Protein=203,
// Fat=204, Carbohydrate by difference=205.
function pickNutrient(
  nutrients: Array<{ nutrientNumber?: string; unitName?: string; value?: number }>,
  number: string,
): number | null {
  const hit = nutrients.find(
    (n) => n.nutrientNumber === number && (number !== "208" || n.unitName === "KCAL"),
  );
  return hit && typeof hit.value === "number" ? hit.value : null;
}

async function searchUsda(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.USDA_FDC_API_KEY;
  if (!apiKey) return [];

  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", "8");

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    const foods = Array.isArray(data.foods) ? data.foods : [];

    const out: SearchResult[] = [];
    for (const food of foods) {
      const nutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];
      const cal = pickNutrient(nutrients, "208");
      const protein = pickNutrient(nutrients, "203");
      const fat = pickNutrient(nutrients, "204");
      const carbs = pickNutrient(nutrients, "205");
      const name: string | undefined = food.description;

      if (!name || cal === null || protein === null || fat === null || carbs === null) continue;

      out.push({
        name: name.trim().slice(0, 80),
        carbs,
        protein,
        fat,
        cal,
        source: food.brandOwner ? String(food.brandOwner).slice(0, 30) : "USDA",
      });
    }
    return out;
  } catch {
    // network error or timeout — fail soft, local results still work
    return [];
  }
}

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

  const results = await searchUsda(query);
  return NextResponse.json({ results });
}
