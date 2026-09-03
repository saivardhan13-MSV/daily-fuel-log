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

  return (
    <div className="tracker-root">
      <div className="app">
        <Topbar active="trends" userEmail={user.email} streak={streak} />
        <TrendCharts data={data} targetCalories={targets?.target_calories} />
        <FooterDisclaimer />
      </div>
    </div>
  );
}
