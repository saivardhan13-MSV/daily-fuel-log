"use client";

import type { EntryItem } from "@/lib/nutrition";
import SwipeableItemRow from "./SwipeableItemRow";

export default function ItemsList({ items }: { items: EntryItem[] }) {
  if (items.length === 0) {
    return <div className="empty-row">Nothing logged yet</div>;
  }

  return (
    <>
      <div className="item-head-row">
        <span>Food</span>
        <span className="q">grams</span>
        <span>protein</span>
        <span>carbs</span>
        <span>fat</span>
        <span className="sp" />
      </div>
      {items.map((it) => (
        <SwipeableItemRow key={it.id} item={it} />
      ))}
    </>
  );
}
