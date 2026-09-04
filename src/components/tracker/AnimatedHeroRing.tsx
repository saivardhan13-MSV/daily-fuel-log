"use client";

import { useEffect, useState } from "react";

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function AnimatedHeroRing({
  value,
  pct,
  unit,
}: {
  value: number;
  pct: number;
  unit?: string;
}) {
  const [progress, setProgress] = useState(() => (prefersReducedMotion() ? 1 : 0));

  useEffect(() => {
    if (prefersReducedMotion()) return;

    let raf = 0;
    const duration = 800;
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      setProgress(1 - Math.pow(1 - t, 3)); // ease-out cubic
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, pct]);

  const displayPct = pct * progress;
  const offset = CIRCUMFERENCE * (1 - displayPct / 100);
  const displayValue = Math.round(value * progress);

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
        <div className="val display">{displayValue}</div>
        {unit && <div className="ring-unit">{unit}</div>}
      </div>
    </div>
  );
}
