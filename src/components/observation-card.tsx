"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, ShieldAlert, AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";
import type { Observation } from "@/lib/trend-engine";
import { CATEGORY_META } from "@/lib/trend-engine";
import { Badge } from "./ui";
import { cn } from "@/lib/utils";

export function CategoryIcon({ category, className }: { category: Observation["category"]; className?: string }) {
  const c = cn("h-5 w-5", className);
  switch (category) {
    case "urgent_attention":
      return <ShieldAlert className={cn(c, "text-red-600")} aria-hidden />;
    case "needs_attention":
      return <AlertTriangle className={cn(c, "text-orange-600")} aria-hidden />;
    case "increasing":
      return <ArrowUpRight className={cn(c, "text-amber-600")} aria-hidden />;
    case "decreasing":
      return <ArrowDownRight className={cn(c, "text-sky-600")} aria-hidden />;
    case "stable":
      return <CheckCircle2 className={cn(c, "text-emerald-600")} aria-hidden />;
    default:
      return <HelpCircle className={cn(c, "text-slate-400")} aria-hidden />;
  }
}

export function ObservationCard({ o, compact }: { o: Observation; compact?: boolean }) {
  const meta = CATEGORY_META[o.category];
  return (
    <article className={cn("card p-4 sm:p-5", o.category === "urgent_attention" && "border-red-300", o.category === "needs_attention" && "border-orange-200")}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <CategoryIcon category={o.category} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge className={meta.badge}>{meta.label}</Badge>
            <span className="text-xs text-slate-500">{o.metricLabel}</span>
            <span className="text-xs text-slate-400">· {o.data.count} readings</span>
          </div>
          <h3 className="font-semibold text-slate-900 leading-snug">{o.title}</h3>
          <p className="text-sm text-slate-700 mt-1">{o.summary}</p>
          {!compact && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1 text-slate-600">
                Baseline <strong>{o.data.baselineAvg}</strong> <ArrowRight className="h-3.5 w-3.5" aria-hidden /> Recent <strong>{o.data.recentAvg}</strong> {o.unit}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-600">
                {o.data.direction === "up" ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : o.data.direction === "down" ? <ArrowDownRight className="h-4 w-4" aria-hidden /> : <Minus className="h-4 w-4" aria-hidden />}
                {o.data.direction === "flat" ? "No clear direction" : o.data.direction === "up" ? "Upward" : "Downward"}
              </span>
              <Badge tone="neutral">Confidence: {o.confidence}</Badge>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/explain?metric=${o.metric}`} className="btn-secondary !min-h-[38px] !py-1.5 text-sm">
              Why am I seeing this?
            </Link>
            {o.category !== "insufficient_data" && (
              <Link href={`/ask-doctor?metric=${o.metric}`} className="btn-ghost !min-h-[38px] !py-1.5 text-sm">
                Ask your doctor
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
