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
      <div className="items" style={{ paddingBottom: 14 }}>
        <div className="custom-panel show" style={{ borderTop: "none", paddingTop: 12 }}>
          <span className="hint">Weight (kg)</span>
          <input
            type="number"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            style={{ width: 90 }}
          />
          <span className="hint" style={{ width: "auto", marginBottom: 0 }}>
            Height (cm)
          </span>
          <input
            type="number"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            style={{ width: 90 }}
          />
          <span className="hint" style={{ width: "auto", marginBottom: 0 }}>
            Age
          </span>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            style={{ width: 70 }}
          />
        </div>

        <div style={{ marginTop: 6 }}>
          <div className="hint" style={{ marginBottom: 6 }}>
            Sex (used only for the BMR calorie formula)
          </div>
          <div className="unit-toggle" style={{ marginBottom: 14 }}>
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

          <div className="hint" style={{ marginBottom: 6 }}>
            Activity level
          </div>
          <select
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--line)",
              color: "var(--text)",
              padding: "8px 10px",
              fontSize: 13,
              width: "100%",
              marginBottom: 14,
            }}
          >
            {ACTIVITY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {ACTIVITY_LABELS[level]}
              </option>
            ))}
          </select>

          <div className="hint" style={{ marginBottom: 6 }}>
            Goal
          </div>
          <div className="unit-toggle" style={{ marginBottom: 14 }}>
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

          <button
            type="button"
            className="add-btn"
            disabled={submitting}
            onClick={handleSubmit}
          >
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
  );
}
