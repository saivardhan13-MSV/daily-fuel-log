const VIEW_W = 80;
const VIEW_H = 140;
const TANK_TOP = 8;
const TANK_BOTTOM = 132;
const TANK_LEFT = 10;
const TANK_RIGHT = 70;
const TANK_H = TANK_BOTTOM - TANK_TOP;

// One wave period is 40 units wide; the path repeats 3x so it always
// covers the tank while the whole group scrolls left by exactly one
// period, giving a seamless animated loop.
const WAVE_PATH =
  "M-40,6 C-30,1 -30,11 -20,6 C-10,1 -10,11 0,6 C10,1 10,11 20,6 " +
  "C30,1 30,11 40,6 C50,1 50,11 60,6 C70,1 70,11 80,6 C90,1 90,11 100,6 " +
  "C110,1 110,11 120,6 L120,30 L-40,30 Z";

export default function WaterGauge({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const fillTop = TANK_BOTTOM - (clamped / 100) * TANK_H;

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="water-gauge" aria-hidden="true">
      <defs>
        <clipPath id="waterTankClip">
          <rect x={TANK_LEFT} y={TANK_TOP} width={TANK_RIGHT - TANK_LEFT} height={TANK_H} />
        </clipPath>
      </defs>

      {/* tick marks */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={TANK_LEFT}
          x2={TANK_LEFT + 5}
          y1={TANK_BOTTOM - t * TANK_H}
          y2={TANK_BOTTOM - t * TANK_H}
          className="water-gauge-tick"
        />
      ))}

      <g clipPath="url(#waterTankClip)">
        <rect
          x={TANK_LEFT}
          y={fillTop}
          width={TANK_RIGHT - TANK_LEFT}
          height={TANK_BOTTOM - fillTop}
          className="water-gauge-fill"
        />
        {clamped > 0 && (
          <g className="water-gauge-wave-group" style={{ transform: `translateY(${fillTop - 6}px)` }}>
            <path d={WAVE_PATH} className="water-gauge-wave water-gauge-wave-a" />
            <path d={WAVE_PATH} className="water-gauge-wave water-gauge-wave-b" transform="translate(20,1.5)" />
          </g>
        )}
      </g>

      <rect
        x={TANK_LEFT}
        y={TANK_TOP}
        width={TANK_RIGHT - TANK_LEFT}
        height={TANK_H}
        className="water-gauge-outline"
      />
    </svg>
  );
}
