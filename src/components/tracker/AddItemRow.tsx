"use client";

import { useEffect, useState } from "react";
import { FOOD_DB, PIECE_WEIGHTS, DENSITIES, type SectionKey } from "@/lib/food-db";
import { capitalize, safeNum } from "@/lib/nutrition";
import { addEntry, upsertCustomFood } from "@/app/actions/entries";
import type { CustomFoodRow } from "@/lib/db";
import type { SearchResult } from "@/app/api/food-search/route";

interface Suggestion {
  name: string;
  carbs: number;
  protein: number;
  fat: number;
  cal: number;
  pieceWeight: number | null;
  density: number | null;
  source: string;
}

type Unit = "g" | "pc" | "ml";

function buildAllFoods(customFoods: CustomFoodRow[]): Map<string, Suggestion> {
  const map = new Map<string, Suggestion>();
  for (const [name, [carbs, protein, fat, cal]] of Object.entries(FOOD_DB)) {
    map.set(name, {
      name: capitalize(name),
      carbs,
      protein,
      fat,
      cal,
      pieceWeight: PIECE_WEIGHTS[name] ?? null,
      density: DENSITIES[name] ?? null,
      source: "saved",
    });
  }
  for (const cf of customFoods) {
    map.set(cf.name, {
      name: capitalize(cf.name),
      carbs: cf.carbs,
      protein: cf.protein,
      fat: cf.fat,
      cal: cf.calories,
      pieceWeight: cf.piece_weight,
      density: cf.density,
      source: "yours",
    });
  }
  return map;
}

function searchFoods(query: string, allFoods: Map<string, Suggestion>): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matches: Suggestion[] = [];
  for (const [key, item] of allFoods) {
    if (key.includes(q)) matches.push(item);
  }
  matches.sort((a, b) => a.name.length - b.name.length);
  return matches.slice(0, 8);
}

export default function AddItemRow({
  section,
  date,
  customFoods,
}: {
  section: SectionKey;
  date: string;
  customFoods: CustomFoodRow[];
}) {
  const allFoods = buildAllFoods(customFoods);

  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pending, setPending] = useState<Suggestion | null>(null);
  const [unit, setUnitState] = useState<Unit>("g");
  const [qty, setQty] = useState("100");
  const [conv, setConv] = useState("");
  const [showCustomPanel, setShowCustomPanel] = useState(false);
  const [customVals, setCustomVals] = useState({ carbs: "", protein: "", fat: "", cal: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlineResults, setOnlineResults] = useState<Suggestion[]>([]);
  const [searchingOnline, setSearchingOnline] = useState(false);

  const localMatches = searchFoods(query, allFoods);
  const seenNames = new Set(localMatches.map((i) => i.name.toLowerCase()));
  const showOnline = query.trim().length >= 3;
  const suggestions = [
    ...localMatches,
    ...(showOnline
      ? onlineResults.filter((i) => !seenNames.has(i.name.toLowerCase()))
      : []),
  ].slice(0, 10);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      setSearchingOnline(true);
      try {
        const res = await fetch(`/api/food-search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!cancelled) {
          const results: SearchResult[] = data.results ?? [];
          setOnlineResults(
            results.map((r) => ({
              name: capitalize(r.name),
              carbs: r.carbs,
              protein: r.protein,
              fat: r.fat,
              cal: r.cal,
              pieceWeight: null,
              density: null,
              source: r.source,
            })),
          );
        }
      } catch {
        if (!cancelled) setOnlineResults([]);
      } finally {
        if (!cancelled) setSearchingOnline(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function onInput(value: string) {
    setQuery(value);
    setShowCustomPanel(false);
    setError(null);
    const exact = allFoods.get(value.trim().toLowerCase());
    if (exact) {
      setPending(exact);
    } else if (pending && pending.name.toLowerCase() !== value.trim().toLowerCase()) {
      setPending(null);
    }
    setShowSuggestions(value.trim().length >= 2);
  }

  function selectFood(item: Suggestion) {
    setQuery(item.name);
    setPending(item);
    setShowSuggestions(false);
    setUnit("g");

    // Cache picks that came from USDA (not already saved/custom) so future
    // searches for this food are instant and don't hit the API again.
    if (item.source !== "saved" && item.source !== "yours" && !allFoods.has(item.name.toLowerCase())) {
      void upsertCustomFood({
        name: item.name,
        carbs: item.carbs,
        protein: item.protein,
        fat: item.fat,
        calories: item.cal,
      });
    }
  }

  function setUnit(mode: Unit) {
    setUnitState(mode);
    setQty(mode === "pc" ? "1" : "100");
    if (mode === "pc") {
      setConv(pending?.pieceWeight ? String(pending.pieceWeight) : "");
    } else if (mode === "ml") {
      setConv(pending?.density ? String(pending.density) : "1");
    } else {
      setConv("");
    }
  }

  function resetForm() {
    setQuery("");
    setPending(null);
    setUnitState("g");
    setQty("100");
    setConv("");
    setShowCustomPanel(false);
    setCustomVals({ carbs: "", protein: "", fat: "", cal: "" });
  }

  async function handleAdd() {
    const name = query.trim();
    if (!name) return;
    setError(null);

    let resolved = pending;
    if (!resolved || resolved.name.toLowerCase() !== name.toLowerCase()) {
      const exact = allFoods.get(name.toLowerCase());
      if (!exact) {
        setShowCustomPanel(true);
        return;
      }
      resolved = exact;
    }

    const rawQty = parseFloat(qty) || (unit === "pc" ? 1 : 100);
    let gramWeight = rawQty;
    let qtyLabel = `${Math.round(rawQty)}g`;

    if (unit === "pc" || unit === "ml") {
      const convNum = parseFloat(conv) || 0;
      if (convNum <= 0) {
        setError(unit === "pc" ? "Enter the weight of one piece first" : "Enter g/ml first");
        return;
      }
      gramWeight = rawQty * convNum;
      qtyLabel =
        unit === "pc"
          ? `${rawQty} pc → ${Math.round(gramWeight)}g used`
          : `${rawQty} ml → ${Math.round(gramWeight)}g used`;
    }

    const mult = gramWeight / 100;
    setSubmitting(true);
    const result = await addEntry({
      date,
      section,
      foodName: capitalize(resolved.name),
      qty: Math.round(gramWeight),
      qtyLabel,
      unit,
      carbs: resolved.carbs * mult,
      protein: resolved.protein * mult,
      fat: resolved.fat * mult,
      calories: resolved.cal * mult,
    });
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    resetForm();
  }

  async function handleAddCustom() {
    const name = query.trim();
    if (!name) return;
    const carbs = safeNum(customVals.carbs);
    const protein = safeNum(customVals.protein);
    const fat = safeNum(customVals.fat);
    const cal = safeNum(customVals.cal);

    setSubmitting(true);
    const saveResult = await upsertCustomFood({ name, carbs, protein, fat, calories: cal });
    if (saveResult.error) {
      setSubmitting(false);
      setError(saveResult.error);
      return;
    }

    const rawQty = parseFloat(qty) || 100;
    const mult = rawQty / 100;
    const result = await addEntry({
      date,
      section,
      foodName: capitalize(name),
      qty: Math.round(rawQty),
      qtyLabel: `${Math.round(rawQty)}g`,
      unit: "g",
      carbs: carbs * mult,
      protein: protein * mult,
      fat: fat * mult,
      calories: cal * mult,
    });
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    resetForm();
  }

  return (
    <>
      <div className="add-row">
        <div className="food-wrap">
          <input
            className="food"
            autoComplete="off"
            placeholder="Search any food…"
            value={query}
            onChange={(e) => onInput(e.target.value)}
            onFocus={() => setShowSuggestions(query.trim().length >= 2)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setShowSuggestions(false);
                handleAdd();
              }
            }}
          />
          {showSuggestions && (suggestions.length > 0 || (showOnline && searchingOnline)) && (
            <div className="suggest-box show">
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="suggest-item"
                  onMouseDown={() => selectFood(item)}
                >
                  <span className="sname">{item.name}</span>
                  <span className="smeta">
                    {Math.round(item.cal)} kcal/100g
                    <span className="stag">{item.source}</span>
                  </span>
                </div>
              ))}
              {showOnline && searchingOnline && (
                <div className="suggest-loading">Searching online…</div>
              )}
            </div>
          )}
        </div>

        <input
          className="qty"
          type="number"
          placeholder={unit === "g" ? "grams" : unit === "pc" ? "count" : "ml"}
          value={qty}
          min={1}
          onChange={(e) => setQty(e.target.value)}
        />

        {pending && (
          <div className="unit-toggle">
            <button
              type="button"
              className={unit === "g" ? "active" : ""}
              onClick={() => setUnit("g")}
            >
              g
            </button>
            <button
              type="button"
              className={unit === "pc" ? "active" : ""}
              onClick={() => setUnit("pc")}
            >
              pc
            </button>
            <button
              type="button"
              className={unit === "ml" ? "active" : ""}
              onClick={() => setUnit("ml")}
            >
              ml
            </button>
          </div>
        )}

        {pending && (unit === "pc" || unit === "ml") && (
          <input
            className="qty conv"
            type="number"
            placeholder={unit === "pc" ? "g/piece" : "g/ml"}
            min={0.01}
            step={0.01}
            value={conv}
            onChange={(e) => setConv(e.target.value)}
          />
        )}

        <button type="button" className="add-btn" disabled={submitting} onClick={handleAdd}>
          Add
        </button>

        {pending && (unit === "pc" || unit === "ml") && (
          <div className="weight-hint" style={{ display: "block" }}>
            {qty} {unit} &times; {conv || "?"}g/{unit} ={" "}
            {Math.round((parseFloat(qty) || 0) * (parseFloat(conv) || 0))}g total
          </div>
        )}

        <div className="search-hint">Searches your saved foods + USDA FoodData Central as you type</div>
      </div>

      {error && (
        <div className="save-note" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {showCustomPanel && (
        <div className="custom-panel show">
          <span className="hint">
            Not in our list — enter macros per 100g to save it as a custom food:
          </span>
          <input
            type="number"
            placeholder="carbs g"
            value={customVals.carbs}
            onChange={(e) => setCustomVals({ ...customVals, carbs: e.target.value })}
          />
          <input
            type="number"
            placeholder="protein g"
            value={customVals.protein}
            onChange={(e) => setCustomVals({ ...customVals, protein: e.target.value })}
          />
          <input
            type="number"
            placeholder="fat g"
            value={customVals.fat}
            onChange={(e) => setCustomVals({ ...customVals, fat: e.target.value })}
          />
          <input
            type="number"
            placeholder="kcal"
            value={customVals.cal}
            onChange={(e) => setCustomVals({ ...customVals, cal: e.target.value })}
          />
          <button type="button" disabled={submitting} onClick={handleAddCustom}>
            Save &amp; Add
          </button>
        </div>
      )}
    </>
  );
}
