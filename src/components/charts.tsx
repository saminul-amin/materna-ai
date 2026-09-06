"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { formatShortDate } from "@/lib/utils";

/* Validated categorical palette (CVD-safe, checked with the dataviz validator). */
export const SERIES = { a: "#0d9488", b: "#7c3aed", c: "#ea580c", d: "#0284c7" };

const axisStyle = { fontSize: 12, fill: "#64748b" };

function TooltipBox({ active, payload, label, unit }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string | number; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-700 mb-1">{typeof label === "number" ? formatShortDate(new Date(label)) : label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-slate-700">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.color }} aria-hidden />
          {p.name}: <span className="font-semibold">{p.value}</span> {unit}
        </p>
      ))}
    </div>
  );
}

export interface BPPoint {
  date: string | Date;
  systolic: number | null;
  diastolic: number | null;
}

export function BPChart({ data, height = 260, attentionSys, attentionDia, movingAvg }: { data: BPPoint[]; height?: number; attentionSys?: number; attentionDia?: number; movingAvg?: { systolic: number[]; diastolic: number[] } }) {
  const rows = data.map((d, i) => ({
    t: new Date(d.date).getTime(),
    Systolic: d.systolic,
    Diastolic: d.diastolic,
    "Systolic (3-pt avg)": movingAvg?.systolic[i],
    "Diastolic (3-pt avg)": movingAvg?.diastolic[i],
  }));
  if (rows.length === 0) return <p className="text-sm text-slate-500 py-8 text-center">No blood pressure readings yet.</p>;
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(v) => formatShortDate(new Date(v))} tick={axisStyle} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} minTickGap={28} />
          <YAxis domain={[50, "auto"]} tick={axisStyle} axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<TooltipBox unit="mmHg" />} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
          {attentionSys && <ReferenceLine y={attentionSys} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Prototype band ${attentionSys}`, position: "insideTopRight", fontSize: 10, fill: "#b45309" }} />}
          {attentionDia && <ReferenceLine y={attentionDia} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Prototype band ${attentionDia}`, position: "insideBottomRight", fontSize: 10, fill: "#b45309" }} />}
          <Line type="monotone" dataKey="Systolic" stroke={SERIES.a} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} connectNulls isAnimationActive={false} />
          <Line type="monotone" dataKey="Diastolic" stroke={SERIES.b} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} connectNulls isAnimationActive={false} />
          {movingAvg && <Line type="monotone" dataKey="Systolic (3-pt avg)" stroke={SERIES.a} strokeWidth={1.5} strokeDasharray="3 3" dot={false} isAnimationActive={false} />}
          {movingAvg && <Line type="monotone" dataKey="Diastolic (3-pt avg)" stroke={SERIES.b} strokeWidth={1.5} strokeDasharray="3 3" dot={false} isAnimationActive={false} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface ValuePoint {
  date: string | Date;
  value: number | null;
}

export function ValueChart({ data, name, unit, height = 240, color = SERIES.a, refLine, domain }: { data: ValuePoint[]; name: string; unit: string; height?: number; color?: string; refLine?: number; domain?: [number | string, number | string] }) {
  const rows = data.map((d) => ({ t: new Date(d.date).getTime(), [name]: d.value }));
  if (rows.length === 0) return <p className="text-sm text-slate-500 py-8 text-center">No {name.toLowerCase()} readings yet.</p>;
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(v) => formatShortDate(new Date(v))} tick={axisStyle} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} minTickGap={28} />
          <YAxis domain={domain ?? ["auto", "auto"]} tick={axisStyle} axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<TooltipBox unit={unit} />} />
          {refLine && <ReferenceLine y={refLine} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Prototype band ${refLine}`, position: "insideTopRight", fontSize: 10, fill: "#b45309" }} />}
          <Line type="monotone" dataKey={name} stroke={color} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} connectNulls isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WellbeingChart({ data, height = 240 }: { data: { date: string | Date; mood: number; stress: number; sleep: number }[]; height?: number }) {
  const rows = data.map((d) => ({ t: new Date(d.date).getTime(), Mood: d.mood, Stress: d.stress, Sleep: d.sleep }));
  if (rows.length === 0) return <p className="text-sm text-slate-500 py-8 text-center">No check-ins yet.</p>;
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(v) => formatShortDate(new Date(v))} tick={axisStyle} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} minTickGap={28} />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={axisStyle} axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<TooltipBox unit="/ 5" />} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
          <Line type="monotone" dataKey="Mood" stroke={SERIES.a} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} isAnimationActive={false} />
          <Line type="monotone" dataKey="Stress" stroke={SERIES.c} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} isAnimationActive={false} />
          <Line type="monotone" dataKey="Sleep" stroke={SERIES.d} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
