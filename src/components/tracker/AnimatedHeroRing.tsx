"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "motion";

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function AnimatedHeroRing({
  value,
  pct,
  unit,
  decimals = 0,
}: {
  value: number;
  pct: number;
  unit?: string;
  decimals?: number;
}) {
  const reduced = prefersReducedMotion();
  const [displayPct, setDisplayPct] = useState(() => (reduced ? pct : 0));
  const [displayValue, setDisplayValue] = useState(() => (reduced ? value : 0));
  const pctRef = useRef(displayPct);
  const valueRef = useRef(displayValue);

  useEffect(() => {
    if (reduced) return;

    const step = decimals === 1 ? 10 : 1;

    const pctAnim = animate(pctRef.current, pct, {
      type: "spring",
      stiffness: 90,
      damping: 18,
      onUpdate: (v) => {
        pctRef.current = v;
        setDisplayPct(v);
      },
    });
    const valueAnim = animate(valueRef.current, value, {
      type: "spring",
      stiffness: 90,
      damping: 18,
      onUpdate: (v) => {
        valueRef.current = v;
        setDisplayValue(Math.round(v * step) / step);
      },
    });

    return () => {
      pctAnim.stop();
      valueAnim.stop();
    };
  }, [value, pct, decimals, reduced]);

  const shownPct = reduced ? pct : displayPct;
  const shownValue = reduced ? value : displayValue;
  const offset = CIRCUMFERENCE * (1 - shownPct / 100);

  return (
    <div className="ring-wrap">
      <svg viewBox="0 0 100 100" className="ring-svg">
        <circle cx="50" cy="50" r={RADIUS} className="ring-track" />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          className="ring-fill ring-fill-animated"
          style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: offset }}
        />
      </svg>
      <div className="ring-center">
        <div className="val display">{shownValue}</div>
        {unit && <div className="ring-unit">{unit}</div>}
      </div>
    </div>
  );
}
