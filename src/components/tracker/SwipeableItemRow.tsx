"use client";

import { useState, useTransition } from "react";
import { motion, useMotionValue, animate } from "motion/react";
import { removeEntry } from "@/app/actions/entries";
import { round1, type EntryItem } from "@/lib/nutrition";

const DELETE_THRESHOLD = -50;
const DRAG_CONSTRAINT = -84;

export default function SwipeableItemRow({ item }: { item: EntryItem }) {
  const [dismissed, setDismissed] = useState(false);
  const [, startTransition] = useTransition();
  const x = useMotionValue(0);

  function commitDelete() {
    animate(x, -420, { type: "tween", duration: 0.18, ease: "easeIn" }).then(() => {
      setDismissed(true);
      startTransition(() => {
        void removeEntry(item.id);
      });
    });
  }

  function handleDragEnd() {
    if (x.get() < DELETE_THRESHOLD) {
      commitDelete();
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 32 });
    }
  }

  if (dismissed) return null;

  return (
    <motion.div layout="position" className="item-row-wrap">
      <button
        type="button"
        className="item-row-delete-backing"
        onClick={commitDelete}
        aria-label={`Delete ${item.food_name}`}
      >
        Delete
      </button>
      <motion.div
        className="item-row"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: DRAG_CONSTRAINT, right: 0 }}
        dragElastic={0.06}
        onDragEnd={handleDragEnd}
      >
        <span className="iname">{item.food_name}</span>
        <span className="iqty">{item.qty_label}</span>
        <span className="imacro protein">{round1(item.protein)}</span>
        <span className="imacro carbs">{round1(item.carbs)}</span>
        <span className="imacro fat">{round1(item.fat)}</span>
        <button type="button" className="rm" onClick={commitDelete} aria-label="Remove item">
          &times;
        </button>
      </motion.div>
    </motion.div>
  );
}
