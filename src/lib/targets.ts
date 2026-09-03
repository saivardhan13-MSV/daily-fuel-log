export type Goal = "cut" | "maintain" | "bulk";
export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2, // little or no exercise
  light: 1.375, // light exercise 1-3 days/week
  moderate: 1.55, // moderate exercise 3-5 days/week
  active: 1.725, // hard exercise 6-7 days/week
  very_active: 1.9, // very hard exercise + physical job
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (little or no exercise)",
  light: "Light (1–3 days/week)",
  moderate: "Moderate (3–5 days/week)",
  active: "Active (6–7 days/week)",
  very_active: "Very active (hard training + physical job)",
};

const GOAL_CALORIE_MULTIPLIER: Record<Goal, number> = {
  cut: 0.8, // ~20% deficit
  maintain: 1.0,
  bulk: 1.1, // ~10% surplus
};

// Protein target scales with goal — higher in a deficit to preserve muscle.
const GOAL_PROTEIN_PER_KG: Record<Goal, number> = {
  cut: 2.2,
  maintain: 1.8,
  bulk: 1.6,
};

const FAT_PERCENT_OF_CALORIES = 0.25;

export interface TargetInputs {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export interface TargetMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Mifflin-St Jeor equation.
export function calculateBmr({ weightKg, heightCm, age, sex }: TargetInputs): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calculateTargets(inputs: TargetInputs): TargetMacros {
  const bmr = calculateBmr(inputs);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[inputs.activityLevel];
  const calories = Math.round(tdee * GOAL_CALORIE_MULTIPLIER[inputs.goal]);

  const protein = Math.round(GOAL_PROTEIN_PER_KG[inputs.goal] * inputs.weightKg);
  const proteinCal = protein * 4;

  const fatCal = calories * FAT_PERCENT_OF_CALORIES;
  const fat = Math.round(fatCal / 9);

  const carbsCal = Math.max(calories - proteinCal - fatCal, 0);
  const carbs = Math.round(carbsCal / 4);

  return { calories, protein, carbs, fat };
}
