"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import AnimatedHeroRing from "./AnimatedHeroRing";
import type { HeroRingData } from "./CalorieHero3D";

const CalorieHero3D = dynamic(() => import("./CalorieHero3D"), { ssr: false });

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

// Capability check is stable for the life of the tab (resize doesn't change
// WebGL/reduced-motion support) and must differ between server (always the
// 2D fallback) and client (real capability) — useSyncExternalStore is the
// pattern React wants for exactly this, without a hydration mismatch or a
// setState-in-effect flip after mount.
function noopSubscribe() {
  return () => {};
}
function getSnapshot(): boolean {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wide = window.innerWidth >= 768;
  return !reduced && wide && supportsWebGL();
}
function getServerSnapshot(): boolean {
  return false;
}

export interface CalorieHeroVisualProps {
  consumed: number;
  pct: number;
  unit?: string;
}

export default function CalorieHeroVisual({ consumed, pct, unit }: CalorieHeroVisualProps) {
  const use3D = useSyncExternalStore(noopSubscribe, getSnapshot, getServerSnapshot);

  if (!use3D) {
    return (
      <div className="calorie-hero-ring-wrap calorie-hero-ring-2d">
        <AnimatedHeroRing value={consumed} pct={pct} unit={unit} />
      </div>
    );
  }

  const data: HeroRingData = {
    calPct: pct,
    calColor: "#e0a94f",
    accentColor: "#6fae8e",
    surfaceColor: "#1f2729",
  };

  return (
    <div className="calorie-hero-ring-wrap calorie-hero-ring-3d">
      <CalorieHero3D {...data} />
      <div className="calorie-hero-ring-3d-number">
        <AnimatedHeroRing value={consumed} pct={pct} unit={unit} ringless />
      </div>
    </div>
  );
}
