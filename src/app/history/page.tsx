import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMonthTotals, getStreak } from "@/lib/db";
import { todayStr } from "@/lib/nutrition";
import Topbar from "@/components/tracker/Topbar";
import { FooterDisclaimer } from "@/components/tracker/Disclaimer";
import "../tracker.css";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad(n: number) {
  return n < 10 ? "0" + n : "" + n;
}

export default async function HistoryPage(props: PageProps<"/history">) {
  const searchParams = await props.searchParams;
  const now = new Date();
  const year = typeof searchParams.year === "string" ? parseInt(searchParams.year, 10) : now.getFullYear();
  const month = typeof searchParams.month === "string" ? parseInt(searchParams.month, 10) : now.getMonth();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [totals, streak] = await Promise.all([
    getMonthTotals(supabase, user.id, year, month),
    getStreak(supabase, user.id),
  ]);
  const today = todayStr();

  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let prevYear = year, prevMonth = month - 1;
  if (prevMonth < 0) { prevMonth = 11; prevYear--; }
  let nextYear = year, nextMonth = month + 1;
  if (nextMonth > 11) { nextMonth = 0; nextYear++; }

  const cells: ReactNode[] = [];
  for (let i = 0; i < startDow; i++) {
    cells.push(<div className="cal-day empty" key={`empty-${i}`} />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    const hasData = totals[dateStr] !== undefined;
    const cls = `cal-day${hasData ? " has-data" : ""}${dateStr === today ? " today-cell" : ""}`;
    cells.push(
      <Link href={`/?date=${dateStr}`} className={cls} key={dateStr}>
        <span className="dnum">{day}</span>
        {hasData && <span className="dcal">{Math.round(totals[dateStr])} cal</span>}
      </Link>,
    );
  }

  return (
    <div className="tracker-root">
      <div className="app">
        <Topbar active="history" userEmail={user.email} streak={streak} />
        <div className="history">
          <div className="hist-nav">
            <Link href={`/history?year=${prevYear}&month=${prevMonth}`} className="nav-btn">
              &#8249;
            </Link>
            <span className="display">
              {MONTH_NAMES[month]} {year}
            </span>
            <Link href={`/history?year=${nextYear}&month=${nextMonth}`} className="nav-btn">
              &#8250;
            </Link>
          </div>
          <div className="cal-grid">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div className="cal-dow" key={i}>
                {d}
              </div>
            ))}
            {cells}
          </div>
        </div>
        <FooterDisclaimer />
      </div>
    </div>
  );
}
