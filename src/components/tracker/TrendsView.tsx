"use client";

import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip } from "recharts";
import type { DayTotals } from "@/lib/db";
import { round1 } from "@/lib/nutrition";

type RangeOption = 7 | 30;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function shortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}

function fullDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function pluralDays(n: number): string {
  return `${n} logged day${n === 1 ? "" : "s"}`;
}

// ±10% of target reads as "on target" — the same tolerance used for the
// deterministic within-target count, so the tooltip's per-day status word
// and the insight sentence's headline count never disagree with each other.
function calStatus(cal: number, target: number): "on target" | "over target" | "under target" {
  const diffPct = (cal - target) / target;
  if (Math.abs(diffPct) <= 0.1) return "on target";
  return diffPct > 0 ? "over target" : "under target";
}

interface ChartPoint {
  date: string;
  label: string;
  cal: number | null;
  logged: boolean;
}

function CalorieTooltip({
  active,
  payload,
  targetCalories,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  targetCalories: number | null;
}) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;

  if (!point.logged) {
    return (
      <div className="trend-tooltip">
        <div className="trend-tooltip-date">{fullDate(point.date)}</div>
        <div className="trend-tooltip-status">Not logged</div>
      </div>
    );
  }

  const status = targetCalories != null && point.cal != null ? calStatus(point.cal, targetCalories) : null;
  return (
    <div className="trend-tooltip">
      <div className="trend-tooltip-date">{fullDate(point.date)}</div>
      <div className="trend-tooltip-val">{point.cal?.toLocaleString()} kcal</div>
      {targetCalories != null && (
        <div className="trend-tooltip-target">Target {targetCalories.toLocaleString()} kcal</div>
      )}
      {status && <div className={`trend-tooltip-status status-${status.replace(" ", "-")}`}>{status}</div>}
    </div>
  );
}

export default function TrendsView({
  days,
  targetCalories,
  targetProtein,
  currentStreak,
  weightKg,
}: {
  days: DayTotals[]; // oldest first, one zero-filled row per calendar day
  targetCalories: number | null;
  targetProtein: number | null;
  currentStreak: number;
  weightKg: number | null;
}) {
  const [range, setRange] = useState<RangeOption>(7);
  const reduced = prefersReducedMotion();

  const rangeDays = useMemo(() => (range === 7 ? days.slice(-7) : days), [days, range]);
  const loggedDays = useMemo(() => rangeDays.filter((d) => d.logged), [rangeDays]);

  const avgCal = loggedDays.length
    ? loggedDays.reduce((sum, d) => sum + d.cal, 0) / loggedDays.length
    : null;
  const avgProtein = loggedDays.length
    ? loggedDays.reduce((sum, d) => sum + d.protein, 0) / loggedDays.length
    : null;

  const calorieInsight = useMemo(() => {
    if (loggedDays.length === 0) return "Log a few days to see your calorie trend.";
    if (targetCalories == null) {
      return `Average ${Math.round(avgCal!).toLocaleString()} kcal across ${pluralDays(loggedDays.length)}.`;
    }
    const within = loggedDays.filter((d) => Math.abs(d.cal - targetCalories) <= targetCalories * 0.1).length;
    return `You stayed within 10% of your calorie target on ${within} of ${pluralDays(loggedDays.length)}.`;
  }, [loggedDays, targetCalories, avgCal]);

  const proteinInsight = useMemo(() => {
    if (loggedDays.length === 0) return "Log a few days to see your protein consistency.";
    if (targetProtein == null) {
      return `Average ${round1(avgProtein!)}g protein across ${pluralDays(loggedDays.length)}.`;
    }
    const met = loggedDays.filter((d) => d.protein >= targetProtein).length;
    return `Protein target met on ${met} of ${pluralDays(loggedDays.length)}.`;
  }, [loggedDays, targetProtein, avgProtein]);

  const consistencyText = `${loggedDays.length} of ${rangeDays.length} days logged`;

  const chartData: ChartPoint[] = useMemo(
    () =>
      rangeDays.map((d) => ({
        date: d.date,
        label: shortDate(d.date),
        cal: d.logged ? Math.round(d.cal) : null,
        logged: d.logged,
      })),
    [rangeDays],
  );

  // Keep the x-axis readable at 30 points on a 390px screen by thinning
  // labels to ~6 evenly spaced ticks; 7-day view has room to show every one.
  const tickInterval = range === 7 ? 0 : Math.max(0, Math.ceil(rangeDays.length / 6) - 1);

  const proteinMax = useMemo(() => {
    const vals = loggedDays.map((d) => d.protein);
    return Math.max(targetProtein ?? 0, ...vals, 1);
  }, [loggedDays, targetProtein]);

  return (
    <div className="trend-view">
      <div className="targets-hero">
        <span className="display targets-hero-title">Trends</span>
        <p className="targets-hero-sub">How your logging has gone lately — averages only ever count days you actually logged.</p>
      </div>

      <div className="trend-range-toggle" role="group" aria-label="Time range">
        {([7, 30] as RangeOption[]).map((r) => (
          <button
            key={r}
            type="button"
            className={`trend-range-btn${range === r ? " active" : ""}`}
            aria-pressed={range === r}
            onClick={() => setRange(r)}
          >
            {r}D
          </button>
        ))}
      </div>

      <div className="trend-stats">
        <div className="trend-stat">
          <span className="val display">{avgCal != null ? Math.round(avgCal).toLocaleString() : "—"}</span>
          <span className="lbl">avg calories</span>
        </div>
        <div className="trend-stat">
          <span className="val display">{avgProtein != null ? round1(avgProtein) : "—"}</span>
          <span className="lbl">avg protein (g)</span>
        </div>
        <div className="trend-stat">
          <span className="val display">{loggedDays.length}</span>
          <span className="lbl">of {rangeDays.length} days logged</span>
        </div>
        <div className="trend-stat">
          <span className="val display">{currentStreak}</span>
          <span className="lbl">day streak</span>
        </div>
      </div>

      <div className="trend-panel">
        <div className="trend-panel-head">
          <span className="trend-panel-title">Calories</span>
          <span className="trend-panel-sub">last {rangeDays.length} days</span>
        </div>
        {chartData.length > 0 && loggedDays.length > 0 ? (
          <>
            <div className="trend-chart" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="var(--line)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="var(--text-faint)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "var(--line)" }}
                    interval={tickInterval}
                  />
                  <YAxis stroke="var(--text-faint)" fontSize={11} tickLine={false} axisLine={false} width={40} />
                  {targetCalories != null && (
                    <ReferenceLine
                      y={targetCalories}
                      stroke="var(--text-faint)"
                      strokeDasharray="4 4"
                      label={{ value: "target", fill: "var(--text-faint)", fontSize: 10, position: "insideTopRight" }}
                    />
                  )}
                  <Tooltip
                    content={(props) => (
                      <CalorieTooltip
                        active={props.active}
                        payload={props.payload as unknown as Array<{ payload: ChartPoint }> | undefined}
                        targetCalories={targetCalories}
                      />
                    )}
                    cursor={{ fill: "var(--surface-alt)" }}
                  />
                  <Bar
                    dataKey="cal"
                    fill="var(--accent)"
                    radius={[2, 2, 0, 0]}
                    isAnimationActive={!reduced}
                    animationDuration={220}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="trend-insight">{calorieInsight}</p>
            <details className="trend-details">
              <summary>View as a list</summary>
              <ul className="trend-data-list">
                {rangeDays.map((d) => (
                  <li key={d.date}>
                    <span>{fullDate(d.date)}</span>
                    <span>
                      {d.logged
                        ? `${Math.round(d.cal).toLocaleString()} kcal${
                            targetCalories != null ? ` · ${calStatus(d.cal, targetCalories)}` : ""
                          }`
                        : "Not logged"}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </>
        ) : (
          <p className="trend-empty-note">Log a few days to see your calorie trend.</p>
        )}
      </div>

      <div className="trend-panel">
        <div className="trend-panel-head">
          <span className="trend-panel-title">Protein</span>
          <span className="trend-panel-sub">last {rangeDays.length} days</span>
        </div>
        {loggedDays.length > 0 ? (
          <>
            <div
              className="trend-protein-row"
              role="img"
              aria-label={`Protein per day. ${proteinInsight}`}
            >
              {targetProtein != null && (
                <span
                  className="trend-protein-target-line"
                  style={{ bottom: `${Math.min(100, (targetProtein / proteinMax) * 100)}%` }}
                />
              )}
              {rangeDays.map((d) => {
                const pct = d.logged ? Math.min(100, (d.protein / proteinMax) * 100) : 0;
                const hit = targetProtein != null && d.logged && d.protein >= targetProtein;
                return (
                  <div
                    key={d.date}
                    className={`trend-protein-col${d.logged ? "" : " empty"}`}
                    title={`${fullDate(d.date)}: ${d.logged ? `${round1(d.protein)}g` : "not logged"}`}
                  >
                    {d.logged && (
                      <span className={`trend-protein-bar${hit ? " hit" : ""}`} style={{ height: `${pct}%` }} />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="trend-insight">{proteinInsight}</p>
          </>
        ) : (
          <p className="trend-empty-note">Log a few days to see your protein consistency.</p>
        )}
      </div>

      <div className="trend-panel">
        <div className="trend-panel-head">
          <span className="trend-panel-title">Consistency</span>
          <span className="trend-panel-sub">last {rangeDays.length} days</span>
        </div>
        <div className="trend-day-row" role="img" aria-label={`${consistencyText}. ${currentStreak}-day current streak.`}>
          {rangeDays.map((d) => (
            <span
              key={d.date}
              className={`trend-day-cell${d.logged ? " logged" : ""}`}
              title={`${fullDate(d.date)}: ${d.logged ? "logged" : "not logged"}`}
            />
          ))}
        </div>
        <p className="trend-insight">
          {consistencyText}
          {currentStreak > 0 ? ` · ${currentStreak}-day current streak` : ""}
        </p>
        <p className="trend-empty-note trend-note-small">An empty day means not logged — not necessarily nothing eaten.</p>
      </div>

      <div className="trend-panel">
        <div className="trend-panel-head">
          <span className="trend-panel-title">Weight</span>
        </div>
        <p className="trend-empty-note">
          {weightKg != null ? `Current weight: ${weightKg}kg. ` : ""}
          Weight trend becomes available after multiple weigh-ins.
        </p>
      </div>
    </div>
  );
}
