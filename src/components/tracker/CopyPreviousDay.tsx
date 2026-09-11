"use client";

import { useRef, useState } from "react";
import { SECTIONS } from "@/lib/food-db";
import { round1, totalsForEntries } from "@/lib/nutrition";
import { copyEntries, getDayCopyPreview, getRecentDatesForCopy, type DayCopyPreview } from "@/app/actions/entries";
import CopySheet from "./CopySheet";

function shortQtyLabel(qtyLabel: string): string {
  const arrowIdx = qtyLabel.indexOf("→");
  return arrowIdx === -1 ? qtyLabel : qtyLabel.slice(0, arrowIdx).trim();
}

function formatSourceDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

type LoadState = "idle" | "loading" | "loaded" | "empty" | "error";

export default function CopyPreviousDay({
  date,
  destinationCount,
}: {
  date: string;
  destinationCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>("idle");
  const [preview, setPreview] = useState<DayCopyPreview | null>(null);
  const [recentDates, setRecentDates] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  async function loadPreview(sourceDate?: string) {
    setState("loading");
    setError(null);
    const result = await getDayCopyPreview(date, sourceDate);
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

  async function openPreview() {
    setOpen(true);
    void loadPreview();
    if (recentDates.length === 0) {
      const dates = await getRecentDatesForCopy(date);
      setRecentDates(dates);
    }
  }

  function close() {
    setOpen(false);
  }

  async function confirmCopy() {
    if (!preview || submitting) return;
    setSubmitting(true);
    const result = await copyEntries({ destDate: date, sourceDate: preview.sourceDate, section: null });
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      setState("error");
      return;
    }
    close();
  }

  const totals = preview ? totalsForEntries(preview.entries) : null;
  const sectionsWithItems = preview
    ? SECTIONS.filter((s) => preview.entries[s.key].length > 0)
    : [];

  return (
    <>
      <button type="button" ref={triggerRef} className="copy-trigger copy-day-trigger" onClick={openPreview}>
        <span aria-hidden="true">↻</span> Copy previous day
      </button>

      <CopySheet open={open} title="Copy previous day" onClose={close} returnFocusRef={triggerRef}>
        {state === "loading" && <p className="copy-status">Looking for a previous day…</p>}

        {state === "empty" && <p className="copy-status">No previous day to copy yet.</p>}

        {state === "error" && <p className="copy-status copy-error">{error}</p>}

        {state === "loaded" && preview && totals && (
          <>
            <p className="copy-source">From {formatSourceDate(preview.sourceDate)}</p>

            {recentDates.length > 1 && (
              <div className="copy-date-picker" role="group" aria-label="Choose a different source date">
                {recentDates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`quickadd-section-chip${d === preview.sourceDate ? " active" : ""}`}
                    aria-pressed={d === preview.sourceDate}
                    onClick={() => void loadPreview(d)}
                  >
                    {formatSourceDate(d)}
                  </button>
                ))}
              </div>
            )}

            <div className="copy-day-groups">
              {sectionsWithItems.map((s) => (
                <div key={s.key} className="copy-day-group">
                  <span className="copy-day-group-label">{s.label}</span>
                  <ul className="copy-item-list">
                    {preview.entries[s.key].map((item) => (
                      <li key={item.id}>
                        <span className="copy-item-name">{item.food_name}</span>
                        <span className="copy-item-qty">{shortQtyLabel(item.qty_label)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="copy-totals">
              {Math.round(totals.cal)} kcal · {round1(totals.protein)}g protein
            </p>
            {destinationCount > 0 && (
              <p className="copy-warning">
                This date already has {destinationCount} logged item{destinationCount === 1 ? "" : "s"}. Copying
                will add the selected day&apos;s entries.
              </p>
            )}
            <div className="copy-actions">
              <button type="button" className="copy-cancel" onClick={close}>
                Cancel
              </button>
              <button type="button" className="add-btn" disabled={submitting} onClick={confirmCopy}>
                {submitting ? "Copying…" : "Copy day"}
              </button>
            </div>
          </>
        )}
      </CopySheet>
    </>
  );
}
