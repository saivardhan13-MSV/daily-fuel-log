"use client";

import { useRef, useState } from "react";
import type { SectionKey } from "@/lib/food-db";
import { round1, totalsForItems, type EntryItem } from "@/lib/nutrition";
import { copyEntries, getMealCopyPreview, type MealCopyPreview } from "@/app/actions/entries";
import CopySheet from "./CopySheet";

// qty_label carries the full sentence for pc/ml entries (e.g. "2 pc -> 236g
// used"); a preview row only has room for the quantity itself.
function shortQtyLabel(qtyLabel: string): string {
  const arrowIdx = qtyLabel.indexOf("→");
  return arrowIdx === -1 ? qtyLabel : qtyLabel.slice(0, arrowIdx).trim();
}

function formatSourceDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type LoadState = "idle" | "loading" | "loaded" | "empty" | "error";

export default function CopyPreviousMeal({
  section,
  sectionLabel,
  date,
  destinationCount,
}: {
  section: SectionKey;
  sectionLabel: string;
  date: string;
  destinationCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>("idle");
  const [preview, setPreview] = useState<MealCopyPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  async function openPreview() {
    setOpen(true);
    setState("loading");
    setError(null);
    const result = await getMealCopyPreview(date, section);
    if (result === null) {
      setState("empty");
    } else if ("error" in result) {
      setError(result.error);
      setState("error");
    } else {
      setPreview(result);
      setState("loaded");
    }
  }

  function close() {
    setOpen(false);
  }

  async function confirmCopy() {
    if (!preview || submitting) return;
    setSubmitting(true);
    const result = await copyEntries({ destDate: date, sourceDate: preview.sourceDate, section });
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      setState("error");
      return;
    }
    close();
  }

  const totals = preview ? totalsForItems(preview.items) : null;

  return (
    <>
      <button type="button" ref={triggerRef} className="copy-trigger" onClick={openPreview}>
        <span aria-hidden="true">↻</span> Copy previous
      </button>

      <CopySheet
        open={open}
        title={`Copy previous ${sectionLabel}`}
        onClose={close}
        returnFocusRef={triggerRef}
      >
        {state === "loading" && <p className="copy-status">Looking for a previous {sectionLabel.toLowerCase()}…</p>}

        {state === "empty" && (
          <p className="copy-status">No previous {sectionLabel.toLowerCase()} to copy yet.</p>
        )}

        {state === "error" && <p className="copy-status copy-error">{error}</p>}

        {state === "loaded" && preview && totals && (
          <>
            <p className="copy-source">From {formatSourceDate(preview.sourceDate)}</p>
            <ul className="copy-item-list">
              {preview.items.map((item: EntryItem) => (
                <li key={item.id}>
                  <span className="copy-item-name">{item.food_name}</span>
                  <span className="copy-item-qty">{shortQtyLabel(item.qty_label)}</span>
                </li>
              ))}
            </ul>
            <p className="copy-totals">
              {Math.round(totals.cal)} kcal · {round1(totals.protein)}g protein
            </p>
            {destinationCount > 0 && (
              <p className="copy-warning">
                This {sectionLabel.toLowerCase()} already has {destinationCount} item{destinationCount === 1 ? "" : "s"}.
                Copied foods will be added to them.
              </p>
            )}
            <div className="copy-actions">
              <button type="button" className="copy-cancel" onClick={close}>
                Cancel
              </button>
              <button type="button" className="add-btn" disabled={submitting} onClick={confirmCopy}>
                {submitting ? "Copying…" : "Copy meal"}
              </button>
            </div>
          </>
        )}
      </CopySheet>
    </>
  );
}
