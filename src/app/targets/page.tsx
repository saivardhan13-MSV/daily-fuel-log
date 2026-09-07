import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBodyTargets, getStreak } from "@/lib/db";
import Topbar from "@/components/tracker/Topbar";
import TargetsForm from "@/components/tracker/TargetsForm";
import { TargetsDisclaimer, FooterDisclaimer } from "@/components/tracker/Disclaimer";
import "../tracker.css";

export default async function TargetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [targets, streak] = await Promise.all([
    getBodyTargets(supabase, user.id),
    getStreak(supabase, user.id),
  ]);

  const hasTargets = targets?.target_calories != null;
  let proteinPct = 0;
  let carbsPct = 0;
  let fatPct = 0;
  if (hasTargets) {
    const proteinCal = (targets!.target_protein ?? 0) * 4;
    const carbsCal = (targets!.target_carbs ?? 0) * 4;
    const fatCal = (targets!.target_fat ?? 0) * 9;
    const total = proteinCal + carbsCal + fatCal || 1;
    proteinPct = (proteinCal / total) * 100;
    carbsPct = (carbsCal / total) * 100;
    fatPct = (fatCal / total) * 100;
  }

  return (
    <div className="tracker-root">
      <div className="app">
        <Topbar active="targets" userEmail={user.email} streak={streak} />

        <div className="targets-hero">
          <span className="display targets-hero-title">Your Targets</span>
          <p className="targets-hero-sub">
            Bodyweight-based calorie and macro goals, calculated once from your
            details below — update them any time your weight or routine changes.
          </p>
        </div>

        <TargetsDisclaimer />

        {hasTargets && (
          <div className="macro-split-card">
            <div className="macro-split-cal">
              <span className="val display">{targets!.target_calories}</span>
              <span className="lbl">calorie target / day</span>
            </div>
            <div className="macro-split-bar">
              <span style={{ width: `${proteinPct}%`, background: "var(--protein)" }} />
              <span style={{ width: `${carbsPct}%`, background: "var(--carbs)" }} />
              <span style={{ width: `${fatPct}%`, background: "var(--fat)" }} />
            </div>
            <div className="macro-split-legend">
              <span>
                <i style={{ background: "var(--protein)" }} /> Protein {targets!.target_protein}g
              </span>
              <span>
                <i style={{ background: "var(--carbs)" }} /> Carbs {targets!.target_carbs}g
              </span>
              <span>
                <i style={{ background: "var(--fat)" }} /> Fat {targets!.target_fat}g
              </span>
            </div>
          </div>
        )}

        <TargetsForm existing={targets} />
        <FooterDisclaimer />
      </div>
    </div>
  );
}
