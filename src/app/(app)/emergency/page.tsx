"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Phone, MapPin, Search, Clock, ShieldAlert, Users } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { Card, PageHeader, Badge, DemoBadge, Alert } from "@/components/ui";
import { DEMO_FACILITIES } from "@/lib/static-data";

interface Me { emergencyContacts: { id: string; name: string; relation: string; phone: string }[]; familyMembers: { id: string; name: string; relation: string; phone: string | null }[] }

export default function EmergencyPage() {
  const me = useApi<Me>("/api/me");
  const [q, setQ] = useState("");
  const [only24, setOnly24] = useState(false);
  const results = useMemo(() => DEMO_FACILITIES.filter((f) => (!only24 || f.open24h) && (f.name + f.area + f.district + f.services.join(" ")).toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.distanceKm - b.distanceKm), [q, only24]);
  const ec = me.data?.emergencyContacts[0];

  return (
    <div className="space-y-5">
      <PageHeader title="Emergency & Nearby Care" subtitle="Fast access to emergency numbers, your emergency contact, and a facility directory." />

      <div className="grid sm:grid-cols-2 gap-3">
        <a href="tel:999" className="rounded-2xl bg-red-600 text-white p-5 flex items-center gap-4 hover:bg-red-700 shadow">
          <Phone className="h-9 w-9 shrink-0" aria-hidden />
          <div><p className="text-2xl font-extrabold">Call 999</p><p className="text-sm text-red-100">Bangladesh National Emergency Service</p></div>
        </a>
        {ec ? (
          <a href={`tel:${ec.phone.replace(/\s/g, "")}`} className="rounded-2xl bg-slate-900 text-white p-5 flex items-center gap-4 hover:bg-slate-800 shadow">
            <Users className="h-9 w-9 shrink-0" aria-hidden />
            <div><p className="text-xl font-extrabold">Call {ec.name}</p><p className="text-sm text-slate-300">{ec.relation} · {ec.phone}</p></div>
          </a>
        ) : (
          <Link href="/settings" className="rounded-2xl border-2 border-dashed border-slate-300 p-5 flex items-center gap-4 text-slate-600 hover:border-brand-400">
            <Users className="h-9 w-9 shrink-0" aria-hidden />
            <div><p className="font-bold">No emergency contact set</p><p className="text-sm">Add one in Settings</p></div>
          </Link>
        )}
      </div>

      <Alert tone="danger" title="Emergency guidance">
        If you have heavy bleeding, severe headache, blurred vision, severe abdominal pain, fits, difficulty breathing, or your baby is moving much less: <strong>seek urgent medical care now</strong>. Call 999 or go to the nearest facility with emergency obstetric care. Tell them you are pregnant and how many weeks. Do not wait for a routine appointment. See the <Link href="/danger-signs" className="underline font-semibold">Danger Signs checklist</Link>.
      </Alert>

      <Card title="Facility directory" subtitle="Demo directory — fictional facilities for demonstration. No real facility, location or partnership is represented." action={<DemoBadge label="Demo directory" />}>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden />
            <input aria-label="Search facilities" className="input !pl-9" placeholder="Search by name, area or service…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 px-2"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={only24} onChange={(e) => setOnly24(e.target.checked)} /> Open 24 hours</label>
        </div>
        {results.length === 0 ? <p className="text-sm text-slate-500 py-6 text-center">No facilities match your search.</p> : (
          <ul className="grid md:grid-cols-2 gap-3">
            {results.map((f) => (
              <li key={f.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{f.name} <span className="text-xs text-slate-400">(fictional)</span></p>
                    <p className="text-sm text-slate-600 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden /> {f.area}, {f.district} · {f.distanceKm} km (demo)</p>
                  </div>
                  <Badge tone={f.open24h ? "success" : "neutral"}><Clock className="h-3 w-3" aria-hidden /> {f.open24h ? "24h" : "Day hours"}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">{f.services.map((s) => <Badge key={s} tone="neutral">{s}</Badge>)}</div>
                <div className="mt-3 flex gap-2">
                  <a href={`tel:${f.phone.replace(/\s/g, "")}`} className="btn-primary !min-h-[40px] text-sm flex-1"><Phone className="h-4 w-4" aria-hidden /> Call (demo number)</a>
                  <Link href={`/care`} className="btn-secondary !min-h-[40px] text-sm">Book visit</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="What to tell the responder" action={<ShieldAlert className="h-5 w-5 text-red-600" aria-hidden />}>
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
          <li>That you are pregnant and how many weeks</li>
          <li>The symptom and when it started</li>
          <li>Your latest blood pressure reading if you have one</li>
          <li>Any known conditions or medicines (see your Pregnancy Profile)</li>
          <li>Your location and how to reach you</li>
        </ul>
      </Card>
    </div>
  );
}
