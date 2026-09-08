"use client";

import { useRouter } from "next/navigation";
import { todayStr } from "@/lib/nutrition";

function shiftDate(date: string, delta: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + delta);
  const pad = (n: number) => (n < 10 ? "0" + n : "" + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatLong(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function DateNav({ date }: { date: string }) {
  const router = useRouter();
  const isToday = date === todayStr();

  return (
    <div className="day-header">
      <span className="day-eyebrow">{isToday ? "Today" : "Viewing"}</span>
      <div className="day-header-row">
        <button
          type="button"
          className="day-arrow"
          aria-label="Previous day"
          onClick={() => router.push(`/?date=${shiftDate(date, -1)}`)}
        >
          &#8249;
        </button>
        <span className="day-date display">{formatLong(date)}</span>
        <button
          type="button"
          className="day-arrow"
          aria-label="Next day"
          onClick={() => router.push(`/?date=${shiftDate(date, 1)}`)}
        >
          &#8250;
        </button>
      </div>
      <div className="day-header-actions">
        <input
          type="date"
          value={date}
          aria-label="Pick a date"
          className="day-date-input"
          onChange={(e) => e.target.value && router.push(`/?date=${e.target.value}`)}
        />
        {!isToday && (
          <button type="button" className="day-jump" onClick={() => router.push("/")}>
            Jump to today
          </button>
        )}
      </div>
    </div>
  );
}
