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

  return (
    <div className="tracker-root">
      <div className="app">
        <Topbar active="targets" userEmail={user.email} streak={streak} />
        <TargetsDisclaimer />

        {targets?.target_calories != null && (
          <div className="scoreboard">
            <div className="score-tile cal">
              <div className="val display">{targets.target_calories}</div>
              <div className="lbl">Calorie Target</div>
            </div>
            <div className="score-tile protein">
              <div className="val display">
                {targets.target_protein}
                <span style={{ fontSize: 16 }}>g</span>
              </div>
              <div className="lbl">Protein Target</div>
            </div>
            <div className="score-tile carbs">
              <div className="val display">
                {targets.target_carbs}
                <span style={{ fontSize: 16 }}>g</span>
              </div>
              <div className="lbl">Carbs Target</div>
            </div>
            <div className="score-tile fat">
              <div className="val display">
                {targets.target_fat}
                <span style={{ fontSize: 16 }}>g</span>
              </div>
              <div className="lbl">Fat Target</div>
            </div>
          </div>
        )}

        <TargetsForm existing={targets} />
        <FooterDisclaimer />
      </div>
    </div>
  );
}
