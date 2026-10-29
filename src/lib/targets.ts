// Types and labels for the targets form. The calorie/macro calculation itself
// (Mifflin-St Jeor) lives in the Python API, backend/app/domain/targets.py,
// and runs server-side when targets are saved.

export type Goal = "cut" | "maintain" | "bulk";
export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (little or no exercise)",
  light: "Light (1–3 days/week)",
  moderate: "Moderate (3–5 days/week)",
  active: "Active (6–7 days/week)",
  very_active: "Very active (hard training + physical job)",
};
