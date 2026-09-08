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
            <div className="macro-strip-top">
              <span className="macro-strip-label">{item.label}</span>
              <span className="macro-strip-pct">{Math.round(pct)}%</span>
            </div>
            <span className="macro-strip-value">
              {item.value}
              {hasTarget && <span className="macro-strip-target">/{item.target}g</span>}
              {!hasTarget && <span className="macro-strip-target">g</span>}
            </span>
            <span className="macro-strip-bar">
              <span className="macro-strip-bar-fill" style={{ width: `${pct}%` }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
