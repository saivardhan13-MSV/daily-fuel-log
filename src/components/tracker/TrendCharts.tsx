"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import type { DayTotals } from "@/lib/db";

function shortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}

const tooltipStyle = {
  background: "#2a2729",
  border: "1px solid #3a3733",
  borderRadius: 0,
  fontSize: 12,
  color: "#f2ede2",
};

export default function TrendCharts({
  data,
  targetCalories,
}: {
  data: DayTotals[];
  targetCalories?: number | null;
}) {
  const chartData = data.map((d) => ({
    ...d,
    label: shortDate(d.date),
    cal: Math.round(d.cal),
    protein: Math.round(d.protein),
    carbs: Math.round(d.carbs),
    fat: Math.round(d.fat),
  }));

  return (
    <>
      <div className="section">
        <div className="section-head">
          <span className="name display">Calories</span>
          <span className="time">last {data.length} days</span>
        </div>
        <div style={{ padding: "14px 14px 6px", height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#3a3733" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#9b9488"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#3a3733" }}
              />
              <YAxis stroke="#9b9488" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#2a2729" }} />
              {targetCalories != null && (
                <ReferenceLine
                  y={targetCalories}
                  stroke="#e8b94a"
                  strokeDasharray="4 4"
                  label={{ value: "target", fill: "#e8b94a", fontSize: 10, position: "insideTopRight" }}
                />
              )}
              <Bar dataKey="cal" fill="#f2ede2" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <span className="name display">Macros</span>
          <span className="time">last {data.length} days</span>
        </div>
        <div style={{ padding: "14px 14px 6px", height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#3a3733" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#9b9488"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#3a3733" }}
              />
              <YAxis stroke="#9b9488" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9b9488" }} />
              <Line type="monotone" dataKey="protein" name="Protein (g)" stroke="#e8b94a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="carbs" name="Carbs (g)" stroke="#4e9e94" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fat" name="Fat (g)" stroke="#c5644a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
