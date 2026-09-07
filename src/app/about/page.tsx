import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import "../tracker.css";

const METRICS = [
  {
    label: "Food macros",
    color: "var(--protein)",
    body: "Every food you log pulls from a database of 190+ common foods (including a solid range of Indian dishes) plus a live search against USDA FoodData Central. These are estimates from public nutrition data, not lab-tested per serving — close enough for real-world tracking, not precise to the gram.",
  },
  {
    label: "Daily calorie & macro targets",
    color: "var(--carbs)",
    body: "Your targets use the Mifflin-St Jeor formula — the same one most dietitians start from — to estimate your BMR (calories your body burns at rest) from your weight, height, age, and sex. That gets multiplied by an activity factor based on how often you train, then adjusted for your goal: roughly 20% below maintenance for a cut, 10% above for a bulk. Protein scales with your bodyweight (higher on a cut, to help hold onto muscle), fat is fixed at 25% of your calories, and carbs fill whatever's left.",
  },
  {
    label: "Water goal",
    color: "var(--fat)",
    body: "A flat 3L/day guideline — a reasonable general default, not personalized to your body size or activity level.",
  },
  {
    label: "Logging streak",
    color: "var(--workout)",
    body: "Counts consecutive days with at least one item logged, including today once you've added something.",
  },
];

export default async function AboutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="tracker-root">
      <div className="app">
        <div className="topbar">
          <div className="brand">
            <span className="display">DAILY FUEL LOG</span>
            <span className="tag">track every plate, every day</span>
          </div>
          <Link href={user ? "/" : "/login"} className="today-btn" style={{ textDecoration: "none" }}>
            {user ? "← Back to app" : "← Back to sign in"}
          </Link>
        </div>

        <div className="about-hero">
          <span className="display about-hero-title">Built by someone who actually uses it</span>
          <p className="about-hero-sub">
            A personal note on why this exists, and exactly how every number on
            your dashboard gets calculated — no black box.
          </p>
        </div>

        <div className="about-card">
          <span className="name display about-card-title">Why I built this</span>
          <p className="about-body">
            Hey — I&apos;m Saivardhan. I&apos;m into fitness and got tired of
            nutrition apps that bury basic calorie tracking behind
            subscriptions, ads, and features I never touch. Daily Fuel Log is
            the simple tracker I wanted for myself — log what you eat, see
            your macros, stay consistent. Sharing it in case it&apos;s useful
            for you too.
          </p>
        </div>

        <div className="about-card">
          <span className="name display about-card-title">How the numbers work</span>
          <div className="about-metrics">
            {METRICS.map((m) => (
              <div className="about-metric" key={m.label}>
                <span className="about-metric-label" style={{ color: m.color }}>
                  {m.label}
                </span>
                <p className="about-body">{m.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="disclaimer-box" style={{ marginTop: 0 }}>
          <strong>None of this is medical advice.</strong> These are general
          estimates for personal tracking. If you have a medical condition,
          are pregnant or nursing, or have a history of disordered eating,
          please check with a doctor or registered dietitian before using
          these numbers to guide your diet.
        </div>
      </div>
    </div>
  );
}
