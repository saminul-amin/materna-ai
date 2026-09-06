"use client";

import Link from "next/link";
import { Activity, Baby, CalendarClock, FolderHeart, Pill, Phone, BookOpen, ArrowRight, Sparkles, Bell } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { Card, Stat, Spinner, ErrorState, EmptyState, DisclaimerBanner, Badge } from "@/components/ui";
import { BPChart } from "@/components/charts";
import { ObservationCard } from "@/components/observation-card";
import { formatDate, formatDateTime, relativeDays } from "@/lib/utils";
import type { Observation } from "@/lib/trend-engine";
import { BP_BANDS } from "@/lib/thresholds";
import type { WeekGuide } from "@/lib/guide-data";

interface Dash {
  user: { name: string; isDemo: boolean; plan: string };
  pregnancy: { week: number; trimester: number; daysToEdd: number; edd: string } | null;
  latest: Record<string, { systolic?: number | null; diastolic?: number | null; value?: number | null; unit: string; recordedAt: string } | null>;
  bpSeries: { date: string; systolic: number | null; diastolic: number | null }[];
  measurementCount: number;
  observations: Observation[];
  topObservation: Observation | null;
  nextAppointment: { type: string; kind: string; scheduledAt: string; facilityName?: string | null; providerName?: string | null } | null;
  nextReminder: { name: string; time: string; dose?: string | null } | null;
  reminderCount: number;
  notifications: { id: string; title: string; body: string }[];
  documentCount: number;
  guide: WeekGuide | null;
}

export default function DashboardPage() {
  const { data, loading, error, reload } = useApi<Dash>("/api/dashboard");
  if (loading) return <Spinner label="Loading your dashboard…" />;
  if (error || !data) return <ErrorState message={error ?? "No data"} onRetry={reload} />;

  const bp = data.latest.bp;
  const weight = data.latest.weight;
  const firstName = data.user.name.split(" ")[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Hello, {firstName}</h1>
          <p className="text-slate-600 mt-1">Here is how your pregnancy is being monitored.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/monitoring?add=1" className="btn-primary !min-h-[40px]">
            <Activity className="h-4 w-4" aria-hidden /> Add measurement
          </Link>
          <Link href="/emergency" className="btn-danger !min-h-[40px]">
            <Phone className="h-4 w-4" aria-hidden /> Emergency
          </Link>
        </div>
      </div>

      {data.user.isDemo && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm text-violet-900 font-medium">SYNTHETIC DEMO DATA — NOT A REAL PATIENT. Every reading, document and appointment shown here was generated for demonstration.</div>
      )}

      {!data.pregnancy ? (
        <Card>
          <EmptyState title="Complete your pregnancy profile" description="Add your expected delivery date or current week so Materna AI can place you on the timeline." action={<Link href="/profile" className="btn-primary">Open profile</Link>} icon={<Baby className="h-6 w-6" aria-hidden />} />
        </Card>
      ) : null}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <Stat label="Pregnancy week" value={data.pregnancy ? `Week ${data.pregnancy.week}` : "—"} sub={data.pregnancy ? `Trimester ${data.pregnancy.trimester} · EDD ${formatDate(data.pregnancy.edd)}` : "Set up profile"} tone="brand" />
        </Card>
        <Card className="!p-4">
          <Stat label="Next appointment" value={data.nextAppointment ? relativeDays(data.nextAppointment.scheduledAt) : "None"} sub={data.nextAppointment ? `${labelType(data.nextAppointment.type)} · ${formatDateTime(data.nextAppointment.scheduledAt)}` : <Link href="/care" className="underline">Book one</Link>} />
        </Card>
        <Card className="!p-4">
          <Stat label="Latest BP" value={bp ? `${bp.systolic}/${bp.diastolic}` : "—"} sub={bp ? `mmHg · ${relativeDays(bp.recordedAt)}` : "No reading yet"} tone={data.topObservation?.metric === "bp" && (data.topObservation.category === "needs_attention" || data.topObservation.category === "urgent_attention") ? "warn" : "neutral"} />
        </Card>
        <Card className="!p-4">
          <Stat label="Latest weight" value={weight ? `${weight.value} kg` : "—"} sub={weight ? relativeDays(weight.recordedAt) : "No reading yet"} />
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Chart */}
        <Card className="lg:col-span-2" title="Blood pressure trend" subtitle={`${data.bpSeries.length} readings · dashed line = prototype attention band`} action={<Link href="/monitoring" className="text-sm font-semibold text-brand-700 hover:underline">All measurements</Link>}>
          {data.bpSeries.length ? (
            <BPChart data={data.bpSeries} attentionSys={BP_BANDS.attention.systolic} attentionDia={BP_BANDS.attention.diastolic} />
          ) : (
            <EmptyState title="No blood pressure readings yet" description="Record a few readings to see your trend." action={<Link href="/monitoring?add=1" className="btn-primary">Add reading</Link>} />
          )}
        </Card>

        {/* AI summary */}
        <Card title="AI health trend summary" subtitle="Transparent prototype — not a diagnosis" action={<Sparkles className="h-5 w-5 text-brand-600" aria-hidden />}>
          {data.topObservation ? (
            <div>
              <p className="text-slate-800">{data.topObservation.summary}</p>
              <p className="text-sm text-slate-600 mt-2">{data.topObservation.suggestedAction}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/trends" className="btn-secondary !min-h-[38px] !py-1.5 text-sm">
                  View trends
                </Link>
                <Link href={`/explain?metric=${data.topObservation.metric}`} className="btn-primary !min-h-[38px] !py-1.5 text-sm">
                  Why am I seeing this?
                </Link>
              </div>
              {data.observations.length > 1 && <p className="text-xs text-slate-500 mt-3">{data.observations.length} metrics analysed · {data.measurementCount} measurements in total</p>}
            </div>
          ) : (
            <EmptyState title="No observations yet" description="Add at least 3 readings of any measurement to enable trend analysis." />
          )}
        </Card>
      </div>

      {data.topObservation && <ObservationCard o={data.topObservation} />}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/reminders" className="card p-4 hover:border-brand-300 transition">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase"><Pill className="h-4 w-4" aria-hidden /> Upcoming reminder</div>
          {data.nextReminder ? (
            <>
              <p className="font-semibold text-slate-900 mt-1">{data.nextReminder.name}</p>
              <p className="text-sm text-slate-600">{data.nextReminder.time}{data.nextReminder.dose ? ` · ${data.nextReminder.dose}` : ""}</p>
            </>
          ) : (
            <p className="text-sm text-slate-600 mt-1">No reminders yet</p>
          )}
        </Link>
        <Link href="/guide" className="card p-4 hover:border-brand-300 transition">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase"><BookOpen className="h-4 w-4" aria-hidden /> This week's guide</div>
          {data.guide ? (
            <>
              <p className="font-semibold text-slate-900 mt-1">Week {data.guide.week} · {data.guide.size}</p>
              <p className="text-sm text-slate-600 line-clamp-2">{data.guide.body}</p>
            </>
          ) : (
            <p className="text-sm text-slate-600 mt-1">Set your pregnancy week</p>
          )}
        </Link>
        <Link href="/documents" className="card p-4 hover:border-brand-300 transition">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase"><FolderHeart className="h-4 w-4" aria-hidden /> Document vault</div>
          <p className="font-semibold text-slate-900 mt-1">{data.documentCount} document{data.documentCount === 1 ? "" : "s"}</p>
          <p className="text-sm text-slate-600">Reports, prescriptions, scans</p>
        </Link>
        <Link href="/danger-signs" className="card p-4 border-red-200 bg-red-50/40 hover:border-red-300 transition">
          <div className="flex items-center gap-2 text-red-700 text-xs font-semibold uppercase"><Phone className="h-4 w-4" aria-hidden /> Emergency access</div>
          <p className="font-semibold text-slate-900 mt-1">Danger signs &amp; 999</p>
          <p className="text-sm text-slate-600">Check symptoms, call for help</p>
        </Link>
      </div>

      {data.notifications.length > 0 && (
        <Card title="Notifications" action={<Bell className="h-5 w-5 text-slate-400" aria-hidden />}>
          <ul className="divide-y divide-slate-100">
            {data.notifications.map((n) => (
              <li key={n.id} className="py-2">
                <p className="font-medium text-slate-900 text-sm">{n.title}</p>
                <p className="text-sm text-slate-600">{n.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Monitor → Understand → Act" subtitle="The Materna AI loop">
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          {[
            { h: "Monitor", p: "Log readings and upload reports", href: "/monitoring", icon: Activity },
            { h: "Understand", p: "See trends with clear explanations", href: "/explain", icon: Sparkles },
            { h: "Act", p: "Ask your doctor, book care, get help", href: "/care", icon: CalendarClock },
          ].map((s) => (
            <Link key={s.h} href={s.href} className="rounded-xl border border-slate-200 p-3 hover:border-brand-300 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-brand-600 shrink-0" aria-hidden />
              <div className="flex-1"><p className="font-semibold text-slate-900">{s.h}</p><p className="text-slate-600">{s.p}</p></div>
              <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden />
            </Link>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-2 text-xs text-slate-500"><Badge tone="neutral">Plan: {data.user.plan === "premium_demo" ? "Premium (demo)" : "Free"}</Badge></div>
      <DisclaimerBanner compact />
    </div>
  );
}

function labelType(t: string) {
  return { antenatal: "Antenatal visit", test: "Test", vaccination: "Vaccination", follow_up: "Follow-up", consultation: "Online consultation" }[t] ?? t;
}
