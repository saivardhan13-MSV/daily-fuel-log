import Link from "next/link";
import AnimatedHeroRing from "./AnimatedHeroRing";

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
      <div className="calorie-hero calorie-hero-empty">
        <div className="calorie-hero-empty-title display">Set up your daily target</div>
        <p className="calorie-hero-empty-text">
          You haven&rsquo;t set your calorie and macro targets yet.
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
    <div className="calorie-hero">
      <div className="calorie-hero-ring">
        <AnimatedHeroRing value={consumed} pct={pct} />
      </div>
      <div className="calorie-hero-main">
        <div className="calorie-hero-number display">
          {Math.abs(remaining).toLocaleString()}
        </div>
        <div className="calorie-hero-label">{over ? "calories over today" : "calories remaining"}</div>
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
