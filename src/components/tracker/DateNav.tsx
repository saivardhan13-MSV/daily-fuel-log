"use client";

import { useRouter } from "next/navigation";
import { todayStr } from "@/lib/nutrition";

function shiftDate(date: string, delta: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + delta);
  const pad = (n: number) => (n < 10 ? "0" + n : "" + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function DateNav({ date }: { date: string }) {
  const router = useRouter();
  const isToday = date === todayStr();

  return (
    <div className="datenav">
      <button
        type="button"
        className="arrow"
        onClick={() => router.push(`/?date=${shiftDate(date, -1)}`)}
      >
        &#8249;
      </button>
      <input
        type="date"
        value={date}
        onChange={(e) => e.target.value && router.push(`/?date=${e.target.value}`)}
      />
      <button
        type="button"
        className="arrow"
        onClick={() => router.push(`/?date=${shiftDate(date, 1)}`)}
      >
        &#8250;
      </button>
      {isToday ? (
        <span className="today-label">Today</span>
      ) : (
        <button type="button" className="today-btn" onClick={() => router.push("/")}>
          Jump to today
        </button>
      )}
    </div>
  );
}
