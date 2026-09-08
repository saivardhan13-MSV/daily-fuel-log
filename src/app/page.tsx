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
import CalorieHero from "@/components/tracker/CalorieHero";
import MacroStrip from "@/components/tracker/MacroStrip";
import WaterWidget from "@/components/tracker/WaterWidget";
import DateSync from "@/components/tracker/DateSync";
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
  const hasEntries = Object.values(entries).some((items) => items.length > 0);
  const proteinGoalMet =
    targets?.target_protein != null && totals.protein >= targets.target_protein;

  return (
    <div className="tracker-root">
      <div className="app">
        <DateSync currentDate={date} hasExplicitDate={hasExplicitDate} />
        <Topbar active="tracker" userEmail={user.email} streak={streak} />

        <DateNav date={date} />

        {proteinGoalMet && (
          <div className="milestone-banner">Protein goal reached for today.</div>
        )}

        <CalorieHero
          consumed={Math.round(totals.cal)}
          target={targets?.target_calories}
          loggedAnything={hasEntries}
        />

        {targets?.target_calories != null && (
          <MacroStrip
            items={[
              { cls: "protein", label: "Protein", value: round1(totals.protein), target: targets.target_protein },
              { cls: "carbs", label: "Carbs", value: round1(totals.carbs), target: targets.target_carbs },
              { cls: "fat", label: "Fat", value: round1(totals.fat), target: targets.target_fat },
            ]}
          />
        )}

        <div id="today-log" className="meal-log">
          {SECTIONS.map((section) => (
            <MealSection
              key={section.key}
              section={section}
              items={entries[section.key]}
              date={date}
              customFoods={customFoods}
            />
          ))}
        </div>

        <WaterWidget date={date} amountMl={waterMl} />

        <ClearDayButton date={date} />
        <FooterDisclaimer />
      </div>
    </div>
  );
}
