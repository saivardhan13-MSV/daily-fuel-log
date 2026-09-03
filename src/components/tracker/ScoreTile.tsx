export default function ScoreTile({
  cls,
  label,
  value,
  unit,
  target,
}: {
  cls: string;
  label: string;
  value: number;
  unit?: string;
  target?: number | null;
}) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : null;

  return (
    <div className={`score-tile ${cls}`}>
      <div className="val display">
        {value}
        {unit && <span style={{ fontSize: 16 }}>{unit}</span>}
      </div>
      <div className="lbl">{label}</div>
      {target != null && (
        <>
          <div className="target">
            of {target}
            {unit}
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </>
      )}
    </div>
  );
}
