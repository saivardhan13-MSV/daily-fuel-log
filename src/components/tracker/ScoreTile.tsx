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
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className={`score-tile ring-tile${sizeClass} ${cls}`}>
      <div className="ring-wrap">
        <svg viewBox="0 0 100 100" className="ring-svg">
          <circle cx="50" cy="50" r={radius} className="ring-track" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="ring-fill"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        <div className="ring-center">
          <div className="val display">{value}</div>
          {unit && <div className="ring-unit">{unit}</div>}
        </div>
      </div>
      <div className="lbl">{label}</div>
      <div className="target">
        of {target}
        {unit}
      </div>
      {subtitle && <div className="hero-subtitle">{subtitle}</div>}
    </div>
  );
}
