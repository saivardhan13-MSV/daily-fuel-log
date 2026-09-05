import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getEntriesForDate,
  getCustomFoods,
  getBodyTargets,
  getWaterIntake,
  getStreak,
} from "@/lib/db";
import { totalsForEntries, round1, todayStr } from "@/lib/nutrition";
import { SECTIONS } from "@/lib/food-db";
import Topbar from "@/components/tracker/Topbar";
import DateNav from "@/components/tracker/DateNav";
import MealSection from "@/components/tracker/MealSection";
import ClearDayButton from "@/components/tracker/ClearDayButton";
import ScoreTile from "@/components/tracker/ScoreTile";
import WaterWidget from "@/components/tracker/WaterWidget";
import DateSync from "@/components/tracker/DateSync";
import TiltCard from "@/components/tracker/TiltCard";
import { FooterDisclaimer } from "@/components/tracker/Disclaimer";
import "./tracker.css";

export default async function Home(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const hasExplicitDate = typeof searchParams.date === "string";
  const date = hasExplicitDate ? (searchParams.date as string) : todayStr();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [entries, customFoods, targets, waterMl, streak] = await Promise.all([
    getEntriesForDate(supabase, user.id, date),
    getCustomFoods(supabase, user.id),
    getBodyTargets(supabase, user.id),
    getWaterIntake(supabase, user.id, date),
    getStreak(supabase, user.id),
  ]);

  const totals = totalsForEntries(entries);
  const proteinGoalMet =
    targets?.target_protein != null && totals.protein >= targets.target_protein;

  let heroSubtitle: string | undefined;
  if (targets?.target_calories != null) {
    const remaining = Math.round(targets.target_calories - totals.cal);
    heroSubtitle = remaining >= 0 ? `${remaining} cal left today` : `${-remaining} cal over today`;
  }

  return (
    <div className="tracker-root">
      <div className="page-shell">
        <DateSync currentDate={date} hasExplicitDate={hasExplicitDate} />
        <Topbar active="tracker" userEmail={user.email} streak={streak} />

        <div className="page-body">
          <div className="app">
            <DateNav date={date} />

            {proteinGoalMet && (
              <div className="milestone-banner">🎉 Protein goal reached for today!</div>
            )}

            <TiltCard className="day-hero">
              <ScoreTile
                cls="cal"
                label="Calories"
                value={Math.round(totals.cal)}
                target={targets?.target_calories}
                size="hero"
                subtitle={heroSubtitle}
              />
            </TiltCard>

            <div className="scoreboard scoreboard-secondary">
              <ScoreTile
                cls="protein"
                label="Protein"
                value={round1(totals.protein)}
                unit="g"
                target={targets?.target_protein}
              />
              <ScoreTile
                cls="carbs"
                label="Carbs"
                value={round1(totals.carbs)}
                unit="g"
                target={targets?.target_carbs}
              />
              <ScoreTile
                cls="fat"
                label="Fat"
                value={round1(totals.fat)}
                unit="g"
                target={targets?.target_fat}
              />
            </div>

            {SECTIONS.map((section) => (
              <MealSection
                key={section.key}
                section={section}
                items={entries[section.key]}
                date={date}
                customFoods={customFoods}
              />
            ))}

            <ClearDayButton date={date} />
            <FooterDisclaimer />
          </div>

          <aside className="sidebar">
            <WaterWidget date={date} amountMl={waterMl} />
          </aside>
        </div>
      </div>
    </div>
  );
}
