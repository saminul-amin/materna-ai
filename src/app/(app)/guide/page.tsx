"use client";

import { useEffect, useState } from "react";
import { useQueryParam } from "@/lib/use-query-param";
import { ChevronLeft, ChevronRight, Baby, HeartPulse, Stethoscope, CalendarCheck, Brain, ClipboardList } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { Card, PageHeader, Badge, Spinner, DisclaimerBanner } from "@/components/ui";
import { PregnancyTimeline } from "@/components/pregnancy-timeline";
import { guideForWeek } from "@/lib/guide-data";

export default function GuidePage() {
  const wanted = useQueryParam("week");
  const me = useApi<{ week: number | null }>("/api/me");
  const [week, setWeek] = useState<number>(0);
  useEffect(() => {
    if (week || wanted === undefined) return;
    const fromUrl = Number(wanted);
    if (fromUrl >= 1 && fromUrl <= 40) setWeek(fromUrl);
    else if (me.data?.week) setWeek(me.data.week);
    else if (me.data && !me.data.week) setWeek(12);
  }, [me.data, week, wanted]);
  if (!week) return <Spinner />;
  const g = guideForWeek(week);
  const current = me.data?.week ?? null;
  const tri = week <= 13 ? 1 : week <= 27 ? 2 : 3;

  return (
    <div className="space-y-5">
      <PageHeader title="Week-by-Week Guide" subtitle="General pregnancy information for weeks 1–40. This is educational guidance, not individualized medical treatment." action={current ? <button onClick={() => setWeek(current)} className="btn-secondary !min-h-[40px]">Go to my week ({current})</button> : undefined} />

      <Card><PregnancyTimeline currentWeek={week} linkWeeks={false} /></Card>

      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setWeek(Math.max(1, week - 1))} disabled={week <= 1} className="btn-secondary !min-h-[40px]"><ChevronLeft className="h-4 w-4" aria-hidden /> Week {week - 1}</button>
        <div className="text-center">
          <p className="text-2xl font-extrabold text-slate-900">Week {week}</p>
          <div className="flex justify-center gap-1.5 mt-1"><Badge tone="neutral">Trimester {tri}</Badge>{current === week && <Badge tone="brand">Current week</Badge>}</div>
        </div>
        <button onClick={() => setWeek(Math.min(40, week + 1))} disabled={week >= 40} className="btn-secondary !min-h-[40px]">Week {week + 1} <ChevronRight className="h-4 w-4" aria-hidden /></button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Baby development" action={<Baby className="h-5 w-5 text-brand-600" aria-hidden />}>
          <p className="text-sm text-slate-500 mb-1">About the size of: <strong className="text-slate-800">{g.size}</strong></p>
          <p className="text-slate-800">{g.baby}</p>
        </Card>
        <Card title="Your body & physical wellbeing" action={<HeartPulse className="h-5 w-5 text-rose-500" aria-hidden />}><p className="text-slate-800">{g.body}</p></Card>
        <Card title="General care guidance" action={<Stethoscope className="h-5 w-5 text-brand-600" aria-hidden />}><p className="text-slate-800">{g.care}</p></Card>
        <Card title="Appointments & reminders" action={<CalendarCheck className="h-5 w-5 text-brand-600" aria-hidden />}><p className="text-slate-800">{g.appointments}</p></Card>
        <Card title="Mental wellbeing" action={<Brain className="h-5 w-5 text-violet-600" aria-hidden />}><p className="text-slate-800">{g.mental}</p></Card>
        {g.birthPrep && <Card title="Birth preparation" action={<ClipboardList className="h-5 w-5 text-emerald-600" aria-hidden />}><p className="text-slate-800">{g.birthPrep}</p></Card>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 40 }, (_, i) => i + 1).map((w) => (
          <button key={w} onClick={() => setWeek(w)} className={`h-9 w-9 rounded-lg text-sm font-semibold border ${w === week ? "bg-brand-600 text-white border-brand-600" : w === current ? "border-brand-400 text-brand-800 bg-brand-50" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`} aria-label={`Week ${w}`} aria-current={w === week ? "true" : undefined}>{w}</button>
        ))}
      </div>
      <DisclaimerBanner compact />
    </div>
  );
}
