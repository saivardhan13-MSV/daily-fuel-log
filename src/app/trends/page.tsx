import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecentDailyTotals, getBodyTargets, getStreak } from "@/lib/db";
import Topbar from "@/components/tracker/Topbar";
import TrendsView from "@/components/tracker/TrendsView";
import { FooterDisclaimer } from "@/components/tracker/Disclaimer";
import "../tracker.css";

// Fetch the larger 30-day window once — the 7-day view is a client-side
// slice of the same array, so switching ranges never issues a second query.
const RANGE_DAYS = 30;

export default async function TrendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [days, targets, streak] = await Promise.all([
    getRecentDailyTotals(supabase, user.id, RANGE_DAYS),
    getBodyTargets(supabase, user.id),
    getStreak(supabase, user.id),
  ]);

  return (
    <div className="tracker-root">
      <div className="app">
        <Topbar active="trends" userEmail={user.email} streak={streak} />
        <TrendsView
          days={days}
          targetCalories={targets?.target_calories ?? null}
          targetProtein={targets?.target_protein ?? null}
          currentStreak={streak}
          weightKg={targets?.weight_kg ?? null}
        />
        <FooterDisclaimer />
      </div>
    </div>
  );
}
