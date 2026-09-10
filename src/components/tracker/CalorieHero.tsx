import Link from "next/link";
import CalorieHeroVisual from "./CalorieHeroVisual";

export default function CalorieHero({
  consumed,
  target,
  loggedAnything,
}: {
  consumed: number;
  target: number | null | undefined;
  loggedAnything: boolean;
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

  return (
    <div className="calorie-hero-card">
      <CalorieHeroVisual consumed={Math.abs(remaining)} pct={pct} unit={over ? "over" : "kcal left"} />
      <div className="calorie-hero-main">
        <div className="calorie-hero-label">{over ? "Calories over today" : "Calories remaining"}</div>
        <div className="calorie-hero-sub">
          <b>{target.toLocaleString()}</b> goal&nbsp;·&nbsp;<b>{consumed.toLocaleString()}</b> consumed
        </div>
        {!loggedAnything && (
          <p className="calorie-hero-nudge">
            Nothing logged yet.
            <br />
            <a href="#today-log">Add your first meal</a>
          </p>
        )}
      </div>
    </div>
  );
}
