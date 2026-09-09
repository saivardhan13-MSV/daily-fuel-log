import AnimatedHeroRing from "./AnimatedHeroRing";

export interface MacroStripItem {
  cls: "protein" | "carbs" | "fat";
  label: string;
  value: number;
  target?: number | null;
}

export default function MacroStrip({ items }: { items: MacroStripItem[] }) {
  return (
    <div className="macro-strip-card">
      {items.map((item) => {
        const hasTarget = item.target != null && item.target > 0;
        const pct = hasTarget ? Math.min(100, (item.value / item.target!) * 100) : 0;
        return (
          <div className={`macro-strip-item ${item.cls}`} key={item.cls}>
            <div className="macro-strip-ring">
              <AnimatedHeroRing value={item.value} pct={pct} decimals={1} />
            </div>
            <div className="macro-strip-info">
              <span className="macro-strip-label">{item.label}</span>
              <span className="macro-strip-target">{hasTarget ? `of ${item.target}g` : "g"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
