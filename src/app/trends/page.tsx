import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecentDailyTotals, getBodyTargets, getStreak } from "@/lib/db";
import Topbar from "@/components/tracker/Topbar";
import TrendCharts from "@/components/tracker/TrendCharts";
import { FooterDisclaimer } from "@/components/tracker/Disclaimer";
import "../tracker.css";

const DAYS = 14;

export default async function TrendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [data, targets, streak] = await Promise.all([
    getRecentDailyTotals(supabase, user.id, DAYS),
    getBodyTargets(supabase, user.id),
    getStreak(supabase, user.id),
  ]);

  const loggedDays = data.filter((d) => d.cal > 0);
  const avgCal = loggedDays.length
    ? Math.round(loggedDays.reduce((sum, d) => sum + d.cal, 0) / loggedDays.length)
    : 0;
  const targetCalories = targets?.target_calories ?? null;
  const daysOnTarget = targetCalories
    ? loggedDays.filter((d) => d.cal >= targetCalories * 0.9 && d.cal <= targetCalories * 1.1).length
    : null;

  return (
    <div className="tracker-root">
      <div className="app">
        <Topbar active="trends" userEmail={user.email} streak={streak} />

        <div className="targets-hero">
          <span className="display targets-hero-title">Trends</span>
          <p className="targets-hero-sub">
            The last {DAYS} days — logged {loggedDays.length} of them.
          </p>
        </div>

        <div className="trend-stats">
          <div className="trend-stat">
            <span className="val display">{avgCal || "—"}</span>
            <span className="lbl">avg cal / logged day</span>
          </div>
          <div className="trend-stat">
            <span className="val display">{loggedDays.length}</span>
            <span className="lbl">of {DAYS} days logged</span>
          </div>
          {daysOnTarget != null && (
            <div className="trend-stat">
              <span className="val display">{daysOnTarget}</span>
              <span className="lbl">days within 10% of target</span>
            </div>
          )}
        </div>

        <TrendCharts data={data} targetCalories={targetCalories} />
        <FooterDisclaimer />
      </div>
    </div>
  );
}
