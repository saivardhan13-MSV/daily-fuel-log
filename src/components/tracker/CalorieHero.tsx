import Link from "next/link";
import CalorieHeroVisual from "./CalorieHeroVisual";

export interface MacroProgress {
  value: number;
  target: number | null | undefined;
}

export default function CalorieHero({
  consumed,
  target,
  loggedAnything,
  protein,
  carbs,
  fat,
}: {
  consumed: number;
  target: number | null | undefined;
  loggedAnything: boolean;
  protein: MacroProgress;
  carbs: MacroProgress;
  fat: MacroProgress;
}) {
  if (target == null) {
    return (
      <div className="calorie-hero-card calorie-hero-empty">
        <div className="calorie-hero-empty-mark" aria-hidden="true" />
        <div className="calorie-hero-empty-title display">Your day starts here</div>
        <p className="calorie-hero-empty-text">
          Set your calorie and macro targets to personalize your daily log.
        </p>
        <Link href="/targets" className="calorie-hero-cta">
          Set targets
        </Link>
      </div>
    );
  }

  const remaining = target - consumed;
  const over = remaining < 0;
  const pct = Math.min(100, (consumed / target) * 100);
  const macroPct = (m: MacroProgress) =>
    m.target != null && m.target > 0 ? Math.min(100, (m.value / m.target) * 100) : 0;

  return (
    <div className="calorie-hero-card">
      <CalorieHeroVisual
        consumed={Math.abs(remaining)}
        pct={pct}
        unit={over ? "over" : "kcal left"}
        proteinPct={macroPct(protein)}
        carbsPct={macroPct(carbs)}
        fatPct={macroPct(fat)}
      />
      <div className="calorie-hero-main">
        <div className="calorie-hero-label">{over ? "Calories over today" : "Calories remaining"}</div>
        <div className="calorie-hero-sub">
          <span>
            <b>{target.toLocaleString()}</b> goal
          </span>
          <span>
            <b>{consumed.toLocaleString()}</b> consumed
          </span>
        </div>
        {!loggedAnything && (
          <p className="calorie-hero-nudge">
            Nothing logged yet. <a href="#today-log">Add your first meal below.</a>
          </p>
        )}
      </div>
    </div>
  );
}
