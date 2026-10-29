"use client";

import { useState, type RefObject } from "react";
import { logWeight, updateWeightLog } from "@/app/actions/weight";
import { todayStr } from "@/lib/nutrition";
import type { WeightLogRow } from "@/lib/data";
import CopySheet from "./CopySheet";

export default function LogWeightSheet({
  open,
  onClose,
  returnFocusRef,
  mode,
  editEntry,
  weightLogs,
}: {
  open: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
  mode: "log" | "edit";
  editEntry?: WeightLogRow;
  weightLogs: WeightLogRow[]; // fetched 30-day set, used only for the "already logged" hint
}) {
  // The parent remounts this component (via a changing `key`) each time the
  // sheet opens for a new purpose, so these lazy initializers always start
  // fresh — no effect needed to "reset" state on open. CopySheet itself
  // already focuses the first focusable element (this form's weight input)
  // whenever it opens.
  const [date, setDate] = useState(() => (mode === "edit" && editEntry ? editEntry.logged_date : todayStr()));
  const [weight, setWeight] = useState(() => {
    if (mode === "edit" && editEntry) return editEntry.weight_kg.toString();
    // "Log weight" defaults to today — if today already has a measurement,
    // pre-fill it so submitting reads as correcting today's entry, not a
    // blind overwrite.
    const todayEntry = weightLogs.find((w) => w.logged_date === todayStr());
    return todayEntry ? todayEntry.weight_kg.toString() : "";
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = todayStr();
  const existingForDate = weightLogs.find((w) => w.logged_date === date && w.id !== editEntry?.id);

  async function handleSubmit() {
    setError(null);
    const w = parseFloat(weight);
    if (!Number.isFinite(w) || w <= 0 || w >= 500) {
      setError("Enter a weight between 0 and 500 kg.");
      return;
    }
    if (date > today) {
      setError("You can't log a future date.");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    const result =
      mode === "edit" && editEntry
        ? await updateWeightLog({ id: editEntry.id, loggedDate: date, weightKg: w, clientToday: today })
        : await logWeight({ loggedDate: date, weightKg: w, clientToday: today });
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  }

  const title = mode === "edit" ? "Edit weight" : "Log weight";
  const saveLabel = submitting ? "Saving…" : existingForDate ? "Update weight" : mode === "edit" ? "Save changes" : "Log weight";

  return (
    <CopySheet open={open} title={title} onClose={onClose} returnFocusRef={returnFocusRef}>
      <div className="tgt-form">
        <div className="tgt-field">
          <label htmlFor="weight-input">Weight (kg)</label>
          <input
            id="weight-input"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            max="499"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="tgt-field">
          <label htmlFor="weight-date-input">Date</label>
          <input
            id="weight-date-input"
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        {existingForDate && (
          <p className="copy-status">
            You already have {existingForDate.weight_kg}kg logged for this date — saving will update it.
          </p>
        )}
        {error && <p className="copy-status copy-error">{error}</p>}
        <div className="copy-actions">
          <button type="button" className="copy-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="add-btn" disabled={submitting} onClick={handleSubmit}>
            {saveLabel}
          </button>
        </div>
      </div>
    </CopySheet>
  );
}
