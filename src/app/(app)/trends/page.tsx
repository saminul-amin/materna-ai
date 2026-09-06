"use client";

import Link from "next/link";
import { useApi } from "@/lib/use-api";
import { Card, PageHeader, Spinner, ErrorState, EmptyState, Alert, Badge, DisclaimerBanner } from "@/components/ui";
import { ObservationCard } from "@/components/observation-card";
import { BPChart } from "@/components/charts";
import type { Observation } from "@/lib/trend-engine";
import { CATEGORY_META } from "@/lib/trend-engine";

interface TrendsRes {
  observations: Observation[];
  bpSeries: { date: string; systolic: number; diastolic: number }[];
  engine: { name: string; methods: string[]; disclaimer: string; bpBands: { attention: { systolic: number; diastolic: number } } };
}

export default function TrendsPage() {
  const { data, loading, error, reload } = useApi<TrendsRes>("/api/trends");
  if (loading && !data) return <Spinner label="Analysing your measurements…" />;
  if (error || !data) return <ErrorState message={error ?? "No data"} onRetry={reload} />;

  const bp = data.observations.find((o) => o.metric === "bp");
  const series = bp?.data.series;
  const counts = data.observations.reduce<Record<string, number>>((acc, o) => ({ ...acc, [o.category]: (acc[o.category] ?? 0) + 1 }), {});

  return (
    <div className="space-y-5">
      <PageHeader title="AI Trend Detection" subtitle="Longitudinal analysis of your readings: the engine looks at the sequence of measurements, not only the latest one." action={<button onClick={reload} className="btn-secondary !min-h-[40px]">Re-analyse</button>} />

      <Alert tone="warn" title="Prototype/Demo Logic — Not for Clinical Use">{data.engine.disclaimer}</Alert>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[]).map((c) => (
          <Badge key={c} className={CATEGORY_META[c].badge}>{CATEGORY_META[c].label}: {counts[c] ?? 0}</Badge>
        ))}
      </div>

      {data.observations.length === 0 ? (
        <Card><EmptyState title="Nothing to analyse yet" description="Record at least 3 readings of any measurement to enable trend detection." action={<Link href="/monitoring?add=1" className="btn-primary">Add measurement</Link>} /></Card>
      ) : (
        <div className="grid gap-4">
          {data.observations.map((o) => <ObservationCard key={o.metric} o={o} />)}
        </div>
      )}

      {series && data.bpSeries.length > 0 && (
        <Card title="Blood pressure: readings vs 3-point moving average" subtitle="Solid = readings · dashed = moving average · amber = prototype attention band">
          <BPChart
            data={data.bpSeries}
            movingAvg={{ systolic: series.systolic.movingAvg, diastolic: series.diastolic.movingAvg }}
            attentionSys={data.engine.bpBands.attention.systolic}
            attentionDia={data.engine.bpBands.attention.diastolic}
            height={300}
          />
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500 font-semibold">Baseline avg</p><p className="font-bold">{bp!.data.baselineAvg} mmHg</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500 font-semibold">Recent avg</p><p className="font-bold">{bp!.data.recentAvg} mmHg</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500 font-semibold">Change</p><p className="font-bold">{bp!.data.changePct}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500 font-semibold">Rate / week</p><p className="font-bold">{bp!.data.slopePerWeek} mmHg</p></div>
          </div>
        </Card>
      )}

      <Card title="How the prototype engine works" subtitle={data.engine.name}>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm">
          {data.engine.methods.map((m) => (
            <li key={m} className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-slate-700">{m}</li>
          ))}
        </ul>
        <p className="text-sm text-slate-600 mt-3">Trend categories: <strong>Stable</strong>, <strong>Increasing</strong>, <strong>Decreasing</strong>, <strong>Needs attention</strong>, <strong>Urgent attention</strong>. The engine considers your personal baseline (earliest readings), your recent readings, the rate of change per week, and how many consecutive readings fall inside configurable prototype bands. It never diagnoses a condition.</p>
      </Card>

      <DisclaimerBanner compact />
    </div>
  );
}
