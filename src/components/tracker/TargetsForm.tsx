"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveBodyTargets } from "@/app/actions/targets";
import {
  ACTIVITY_LABELS,
  type ActivityLevel,
  type Goal,
  type Sex,
} from "@/lib/targets";
import type { BodyTargetsRow } from "@/lib/db";

const ACTIVITY_LEVELS = Object.keys(ACTIVITY_LABELS) as ActivityLevel[];

export default function TargetsForm({ existing }: { existing: BodyTargetsRow | null }) {
  const router = useRouter();
  const [weightKg, setWeightKg] = useState(existing?.weight_kg?.toString() ?? "");
  const [heightCm, setHeightCm] = useState(existing?.height_cm?.toString() ?? "");
  const [age, setAge] = useState(existing?.age?.toString() ?? "");
  const [sex, setSex] = useState<Sex>((existing?.sex as Sex) ?? "male");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    (existing?.activity_level as ActivityLevel) ?? "moderate",
  );
  const [goal, setGoal] = useState<Goal>(existing?.goal ?? "maintain");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit() {
    setError(null);
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    const a = parseInt(age, 10);
    if (!w || !h || !a) {
      setError("Enter your weight, height, and age.");
      return;
    }

    setSubmitting(true);
    const result = await saveBodyTargets({
      weightKg: w,
      heightCm: h,
      age: a,
      sex,
      activityLevel,
      goal,
    });
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="section">
      <div className="section-head">
        <span className="name display">Your Details</span>
      </div>
      <div className="items tgt-items">
        <div className="tgt-form">
          <div className="tgt-row">
            <div className="tgt-field">
              <label htmlFor="tgt-weight">Weight (kg)</label>
              <input
                id="tgt-weight"
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>
            <div className="tgt-field">
              <label htmlFor="tgt-height">Height (cm)</label>
              <input
                id="tgt-height"
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
              />
            </div>
            <div className="tgt-field">
              <label htmlFor="tgt-age">Age</label>
              <input id="tgt-age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
          </div>

          <div className="tgt-field">
            <label>Sex (used only for the BMR calorie formula)</label>
            <div className="unit-toggle tgt-toggle">
              <button
                type="button"
                className={sex === "male" ? "active" : ""}
                onClick={() => setSex("male")}
              >
                Male
              </button>
              <button
                type="button"
                className={sex === "female" ? "active" : ""}
                onClick={() => setSex("female")}
              >
                Female
              </button>
            </div>
          </div>

          <div className="tgt-field">
            <label htmlFor="tgt-activity">Activity level</label>
            <select
              id="tgt-activity"
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
            >
              {ACTIVITY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {ACTIVITY_LABELS[level]}
                </option>
              ))}
            </select>
          </div>

          <div className="tgt-field">
            <label>Goal</label>
            <div className="unit-toggle tgt-toggle">
              <button
                type="button"
                className={goal === "cut" ? "active" : ""}
                onClick={() => setGoal("cut")}
              >
                Cut
              </button>
              <button
                type="button"
                className={goal === "maintain" ? "active" : ""}
                onClick={() => setGoal("maintain")}
              >
                Maintain
              </button>
              <button
                type="button"
                className={goal === "bulk" ? "active" : ""}
                onClick={() => setGoal("bulk")}
              >
                Bulk
              </button>
            </div>
          </div>

          <div>
            <button type="button" className="add-btn" disabled={submitting} onClick={handleSubmit}>
              {submitting ? "Saving…" : "Save & calculate targets"}
            </button>
            {error && (
              <div className="save-note" style={{ color: "var(--danger)" }}>
                {error}
              </div>
            )}
            {saved && !error && <div className="save-note">Saved</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
