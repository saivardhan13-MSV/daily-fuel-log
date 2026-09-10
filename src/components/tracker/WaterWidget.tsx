"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { animate } from "motion";
import { addWater, resetWater } from "@/app/actions/water";

const QUICK_ADD = [250, 500, 1000];
const DAILY_GOAL_ML = 3000;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function WaterWidget({ date, amountMl }: { date: string; amountMl: number }) {
  const [isPending, startTransition] = useTransition();
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [displayLiters, setDisplayLiters] = useState(amountMl / 1000);
  const [rippleKey, setRippleKey] = useState(0);
  const litersRef = useRef(displayLiters);
  const reduced = prefersReducedMotion();

  const displayAmount = pendingAmount ?? amountMl;
  const pct = Math.min(100, Math.round((displayAmount / DAILY_GOAL_ML) * 100));
  const reachedGoal = displayAmount >= DAILY_GOAL_ML;

  useEffect(() => {
    if (reduced) return;
    const target = displayAmount / 1000;
    const controls = animate(litersRef.current, target, {
      type: "spring",
      stiffness: 120,
      damping: 20,
      onUpdate: (v) => {
        litersRef.current = v;
        setDisplayLiters(v);
      },
    });
    return () => controls.stop();
  }, [displayAmount, reduced]);

  const shownLiters = reduced ? displayAmount / 1000 : displayLiters;

  function handleAdd(delta: number) {
    setPendingAmount(displayAmount + delta);
    setRippleKey((k) => k + 1);
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
    <div className="water-card">
      <div className="water-head">
        <span className="water-title">Hydration</span>
        {reachedGoal && <span className="water-goal-hit">Goal reached</span>}
      </div>

      <div className="water-visual">
        <div className="water-tube">
          <div className="water-tube-fill" style={{ height: `${pct}%` }}>
            <span className="water-tube-surface" />
            {rippleKey > 0 && <span key={rippleKey} className="water-tube-ripple" />}
          </div>
        </div>
        <div className="water-readout">
          <span className="water-readout-val display">{shownLiters.toFixed(2)}</span>
          <span className="water-readout-goal">of {(DAILY_GOAL_ML / 1000).toFixed(1)} L</span>
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
