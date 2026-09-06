"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQueryParam } from "@/lib/use-query-param";
import { ArrowRight, ArrowUpRight, ArrowDownRight, Minus, Database, ListChecks, Lightbulb, HandHelping } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { Card, PageHeader, Spinner, ErrorState, EmptyState, Alert, Badge, DisclaimerBanner } from "@/components/ui";
import { CategoryIcon } from "@/components/observation-card";
import type { Observation } from "@/lib/trend-engine";
import { CATEGORY_META } from "@/lib/trend-engine";
import { formatDate } from "@/lib/utils";

interface TrendsRes {
  observations: Observation[];
  engine: { disclaimer: string };
}

export default function ExplainPage() {
  const wanted = useQueryParam("metric");
  const { data, loading, error, reload } = useApi<TrendsRes>("/api/trends");
  const [metric, setMetric] = useState<string>("");

  useEffect(() => {
    if (!data || wanted === undefined) return;
    const preferred = wanted && data.observations.find((o) => o.metric === wanted) ? wanted : null;
    if (!data.observations.find((o) => o.metric === metric)) setMetric(preferred ?? data.observations[0]?.metric ?? "");
  }, [data, wanted, metric]);

  if (loading && !data) return <Spinner label="Preparing explanation…" />;
  if (error || !data) return <ErrorState message={error ?? "No data"} onRetry={reload} />;
  const o = data.observations.find((x) => x.metric === metric);

  return (
    <div className="space-y-5">
      <PageHeader title="Why am I seeing this?" subtitle="Every AI observation is explained with the evidence and the exact data used. No black boxes." />

      {data.observations.length === 0 ? (
        <Card><EmptyState title="No observations to explain yet" description="Add at least 3 readings of a measurement to generate an observation." action={<Link href="/monitoring?add=1" className="btn-primary">Add measurement</Link>} /></Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Choose observation">
            {data.observations.map((x) => (
              <button key={x.metric} role="tab" aria-selected={x.metric === metric} onClick={() => setMetric(x.metric)} className={`rounded-full border px-3 py-1.5 text-sm font-medium inline-flex items-center gap-1.5 ${x.metric === metric ? "bg-brand-600 text-white border-brand-600" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
                <CategoryIcon category={x.category} className={x.metric === metric ? "!text-white h-4 w-4" : "h-4 w-4"} /> {x.metricLabel}
              </button>
            ))}
          </div>

          {o && (
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Observation */}
              <Card className="lg:col-span-3" title="Observation">
                <div className="flex items-start gap-3">
                  <CategoryIcon category={o.category} className="h-7 w-7 mt-0.5" />
                  <div>
                    <div className="flex flex-wrap gap-2 mb-1">
                      <Badge className={CATEGORY_META[o.category].badge}>{CATEGORY_META[o.category].label}</Badge>
                      <Badge tone="neutral">Confidence: {o.confidence}</Badge>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{o.title}</h2>
                    <p className="text-slate-700 mt-1">{o.summary}</p>
                  </div>
                </div>
              </Card>

              {/* Visual: baseline → recent → trend */}
              <Card className="lg:col-span-3" title="Baseline → Recent → Trend">
                <div className="grid sm:grid-cols-3 gap-3 items-stretch">
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-xs uppercase font-semibold text-slate-500">Baseline (earliest readings)</p>
                    <p className="text-3xl font-extrabold text-slate-900 mt-1">{o.data.baselineAvg} <span className="text-base font-medium text-slate-500">{o.unit}</span></p>
                    <p className="text-sm text-slate-600 mt-1">{o.data.baselineValues.length ? o.data.baselineValues.join(" · ") : "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-brand-50 border border-brand-200 p-4 relative">
                    <ArrowRight className="hidden sm:block absolute -left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" aria-hidden />
                    <p className="text-xs uppercase font-semibold text-brand-700">Recent (latest readings)</p>
                    <p className="text-3xl font-extrabold text-brand-900 mt-1">{o.data.recentAvg} <span className="text-base font-medium text-brand-700">{o.unit}</span></p>
                    <p className="text-sm text-brand-800 mt-1">{o.data.recentValues.join(" · ")}</p>
                  </div>
                  <div className={`rounded-2xl border p-4 relative ${o.data.direction === "up" ? "bg-amber-50 border-amber-200" : o.data.direction === "down" ? "bg-sky-50 border-sky-200" : "bg-emerald-50 border-emerald-200"}`}>
                    <ArrowRight className="hidden sm:block absolute -left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" aria-hidden />
                    <p className="text-xs uppercase font-semibold text-slate-600">Trend</p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                      {o.data.direction === "up" ? <ArrowUpRight className="h-7 w-7" aria-hidden /> : o.data.direction === "down" ? <ArrowDownRight className="h-7 w-7" aria-hidden /> : <Minus className="h-7 w-7" aria-hidden />}
                      {o.data.direction === "up" ? "Upward" : o.data.direction === "down" ? "Downward" : "No clear change"}
                    </p>
                    <p className="text-sm text-slate-700 mt-1">Change {o.data.changePct} · {o.data.slopePerWeek} {o.unit}/week</p>
                  </div>
                </div>
              </Card>

              {/* Why */}
              <Card title="Why?" subtitle="Evidence the engine used" action={<ListChecks className="h-5 w-5 text-brand-600" aria-hidden />}>
                <ul className="space-y-2">
                  {o.evidence.map((e, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700"><span className="h-5 w-5 rounded-full bg-brand-100 text-brand-800 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>{e}</li>
                  ))}
                </ul>
              </Card>

              {/* Explanation */}
              <Card title="How this was calculated" action={<Lightbulb className="h-5 w-5 text-amber-500" aria-hidden />}>
                <p className="text-sm text-slate-700">{o.explanation}</p>
                <p className="text-sm text-slate-600 mt-3"><strong>Confidence ({o.confidence}):</strong> {o.confidenceReason}</p>
              </Card>

              {/* What you can do */}
              <Card title="What you can do" action={<HandHelping className="h-5 w-5 text-emerald-600" aria-hidden />}>
                <p className="text-sm text-slate-800">{o.suggestedAction}</p>
                <div className="mt-3 flex flex-col gap-2">
                  {o.category !== "insufficient_data" && <Link href={`/ask-doctor?metric=${o.metric}`} className="btn-primary !min-h-[40px] text-sm">Ask your doctor</Link>}
                  <Link href="/care" className="btn-secondary !min-h-[40px] text-sm">Book or schedule care</Link>
                  {o.category === "urgent_attention" && <Link href="/emergency" className="btn-danger !min-h-[40px] text-sm">Emergency &amp; nearby care</Link>}
                </div>
              </Card>

              {/* Data used */}
              <Card className="lg:col-span-3" title="Data used" action={<Database className="h-5 w-5 text-slate-400" aria-hidden />}>
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs uppercase text-slate-500 font-semibold">Measurements analysed</dt><dd className="font-bold text-slate-900 text-lg">{o.data.count}</dd></div>
                  <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs uppercase text-slate-500 font-semibold">Date range</dt><dd className="font-bold text-slate-900">{o.data.dateRange.from ? `${formatDate(o.data.dateRange.from)} – ${formatDate(o.data.dateRange.to)}` : "—"}</dd></div>
                  <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs uppercase text-slate-500 font-semibold">Recent values</dt><dd className="font-bold text-slate-900">{o.data.recentValues.join(", ") || "—"}</dd></div>
                  <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs uppercase text-slate-500 font-semibold">Baseline values</dt><dd className="font-bold text-slate-900">{o.data.baselineValues.join(", ") || "—"}</dd></div>
                  <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs uppercase text-slate-500 font-semibold">Trend direction</dt><dd className="font-bold text-slate-900 capitalize">{o.data.direction === "flat" ? "No clear direction" : o.data.direction}</dd></div>
                  <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs uppercase text-slate-500 font-semibold">Rate of change</dt><dd className="font-bold text-slate-900">{o.data.slopePerWeek} {o.unit}/wk</dd></div>
                  <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs uppercase text-slate-500 font-semibold">Generated</dt><dd className="font-bold text-slate-900">{formatDate(o.generatedAt)}</dd></div>
                  <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs uppercase text-slate-500 font-semibold">Method</dt><dd className="font-bold text-slate-900">Prototype rules</dd></div>
                </dl>
              </Card>
            </div>
          )}
        </>
      )}

      <Alert tone="warn" title="Prototype/Demo Logic — Not for Clinical Use">{data.engine.disclaimer}</Alert>
      <DisclaimerBanner compact />
    </div>
  );
}
