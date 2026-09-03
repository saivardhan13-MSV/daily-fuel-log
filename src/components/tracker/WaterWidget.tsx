"use client";

import { useState, useTransition } from "react";
import { addWater, resetWater } from "@/app/actions/water";
import WaterGauge from "./WaterGauge";

const QUICK_ADD = [250, 500, 1000];
const DAILY_GOAL_ML = 3000;

export default function WaterWidget({ date, amountMl }: { date: string; amountMl: number }) {
  const [isPending, startTransition] = useTransition();
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);

  const displayAmount = pendingAmount ?? amountMl;
  const liters = (displayAmount / 1000).toFixed(2);
  const pct = Math.min(100, Math.round((displayAmount / DAILY_GOAL_ML) * 100));
  const reachedGoal = displayAmount >= DAILY_GOAL_ML;

  function handleAdd(delta: number) {
    setPendingAmount(displayAmount + delta);
    startTransition(async () => {
      const result = await addWater(date, delta);
      if (result.error) setPendingAmount(null);
    });
  }

  function handleReset() {
    if (!confirm("Reset today's water intake to 0?")) return;
    setPendingAmount(0);
    startTransition(async () => {
      const result = await resetWater(date);
      if (result.error) setPendingAmount(null);
    });
  }

  return (
    <div className="water-widget">
      <div className="water-title display">Water</div>

      <div className="water-gauge-row">
        <WaterGauge pct={pct} />
        <div className="water-readout">
          <div className="water-amount display">{liters}L</div>
          <div className="water-goal">of {(DAILY_GOAL_ML / 1000).toFixed(1)}L</div>
          {reachedGoal && <div className="water-goal-hit">🎉 goal hit</div>}
        </div>
      </div>

      <div className="water-buttons">
        {QUICK_ADD.map((ml) => (
          <button key={ml} type="button" disabled={isPending} onClick={() => handleAdd(ml)}>
            +{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
          </button>
        ))}
      </div>
      <button type="button" className="water-reset" disabled={isPending} onClick={handleReset}>
        Reset
      </button>
    </div>
  );
}
