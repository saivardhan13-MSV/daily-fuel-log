import type { SectionKey } from "./food-db";

export interface EntryItem {
  id: string;
  section: SectionKey;
  food_name: string;
  qty: number;
  qty_label: string;
  unit: "g" | "pc" | "ml";
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
}

export type EntriesBySection = Record<SectionKey, EntryItem[]>;

export interface Totals {
  carbs: number;
  protein: number;
  fat: number;
  cal: number;
}

export function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function round1(n: number): number {
  return Math.round(safeNum(n) * 10) / 10;
}

export function totalsForItems(items: EntryItem[]): Totals {
  const t: Totals = { carbs: 0, protein: 0, fat: 0, cal: 0 };
  for (const it of items) {
    t.carbs += safeNum(it.carbs);
    t.protein += safeNum(it.protein);
    t.fat += safeNum(it.fat);
    t.cal += safeNum(it.calories);
  }
  return t;
}

export function totalsForEntries(entries: EntriesBySection): Totals {
  const t: Totals = { carbs: 0, protein: 0, fat: 0, cal: 0 };
  for (const items of Object.values(entries)) {
    const s = totalsForItems(items);
    t.carbs += s.carbs;
    t.protein += s.protein;
    t.fat += s.fat;
    t.cal += s.cal;
  }
  return t;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? "0" + n : "" + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
