import AnimatedHeroRing from "./AnimatedHeroRing";

export default function ScoreTile({
  cls,
  label,
  value,
  unit,
  target,
  size = "compact",
  subtitle,
}: {
  cls: string;
  label: string;
  value: number;
  unit?: string;
  target?: number | null;
  size?: "compact" | "hero";
  subtitle?: string;
}) {
  const hasTarget = target != null && target > 0;
  const sizeClass = size === "hero" ? " ring-tile-hero" : "";

  if (!hasTarget) {
    return (
      <div className={`score-tile ${cls}${sizeClass}`}>
        <div className="val display">
          {value}
          {unit && <span style={{ fontSize: 16 }}>{unit}</span>}
        </div>
        <div className="lbl">{label}</div>
      </div>
    );
  }

  const pct = Math.min(100, (value / target) * 100);

  return (
    <div className={`score-tile ring-tile${sizeClass} ${cls}`}>
      <AnimatedHeroRing value={value} pct={pct} unit={unit} decimals={1} />
      <div className="lbl">{label}</div>
      <div className="target">
        of {target}
        {unit}
      </div>
      {subtitle && <div className="hero-subtitle">{subtitle}</div>}
    </div>
  );
}
