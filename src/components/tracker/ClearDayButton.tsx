"use client";

import { useTransition } from "react";
import { clearDay } from "@/app/actions/entries";

export default function ClearDayButton({ date }: { date: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="day-actions">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (confirm(`Clear all entries logged for ${date}? This can't be undone.`)) {
            startTransition(() => {
              void clearDay(date);
            });
          }
        }}
      >
        Clear this day
      </button>
    </div>
  );
}
