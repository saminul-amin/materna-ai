"use client";

import { useState } from "react";
import { Video, CalendarClock, Loader2, Check, XCircle, Trash2 } from "lucide-react";
import { useApi, api } from "@/lib/use-api";
import { useToast } from "@/components/providers";
import { Card, PageHeader, Field, Alert, Spinner, ErrorState, Badge, DemoBadge, EmptyState, DisclaimerBanner } from "@/components/ui";
import { DEMO_PROVIDERS, DEMO_FACILITIES } from "@/lib/static-data";
import { formatDateTime, toDateInputValue, addDays, relativeDays } from "@/lib/utils";

interface Appt { id: string; kind: string; type: string; providerName: string | null; facilityName: string | null; scheduledAt: string; status: string; notes: string | null }
const TYPE_LABEL: Record<string, string> = { antenatal: "Antenatal visit", test: "Test", vaccination: "Vaccination", follow_up: "Follow-up", consultation: "Online consultation" };

export default function CarePage() {
  const list = useApi<Appt[]>("/api/appointments");
  const { toast } = useToast();
  const [tab, setTab] = useState<"online" | "offline">("online");

  async function setStatus(a: Appt, status: string) {
    try {
      await api(`/api/appointments/${a.id}`, { method: "PATCH", json: { status } });
      toast(status === "cancelled" ? "Appointment cancelled" : "Marked as completed", "success");
      list.reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }
  async function remove(a: Appt) {
    if (!confirm("Delete this appointment?")) return;
    try {
      await api(`/api/appointments/${a.id}`, { method: "DELETE" });
      list.reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  const upcoming = (list.data ?? []).filter((a) => a.status === "scheduled" && new Date(a.scheduledAt) >= new Date());
  const past = (list.data ?? []).filter((a) => !(a.status === "scheduled" && new Date(a.scheduledAt) >= new Date())).reverse();

  return (
    <div className="space-y-5">
      <PageHeader title="Care Coordination" subtitle="Book a demo online consultation or schedule an offline antenatal visit, test, vaccination or follow-up." />

      <div className="flex gap-2" role="tablist">
        <button role="tab" aria-selected={tab === "online"} onClick={() => setTab("online")} className={`btn ${tab === "online" ? "btn-primary" : "btn-secondary"}`}><Video className="h-4 w-4" aria-hidden /> Online consultation</button>
        <button role="tab" aria-selected={tab === "offline"} onClick={() => setTab("offline")} className={`btn ${tab === "offline" ? "btn-primary" : "btn-secondary"}`}><CalendarClock className="h-4 w-4" aria-hidden /> Offline appointment</button>
      </div>

      {tab === "online" ? <OnlineBooking onBooked={list.reload} /> : <OfflineBooking onBooked={list.reload} />}

      <Card title="Upcoming appointments" subtitle={`${upcoming.length} scheduled`}>
        {list.loading && !list.data ? <Spinner /> : list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : upcoming.length === 0 ? <EmptyState title="Nothing scheduled" description="Book a consultation or add an appointment above." /> : (
          <ul className="divide-y divide-slate-100">
            {upcoming.map((a) => (
              <li key={a.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{TYPE_LABEL[a.type]} <Badge tone={a.kind === "online" ? "brand" : "neutral"}>{a.kind}</Badge></p>
                  <p className="text-sm text-slate-600">{formatDateTime(a.scheduledAt)} · {relativeDays(a.scheduledAt)}{a.providerName ? ` · ${a.providerName}` : ""}{a.facilityName ? ` · ${a.facilityName}` : ""}</p>
                  {a.notes && <p className="text-sm text-slate-500">{a.notes}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setStatus(a, "completed")} className="btn-secondary !min-h-[36px] !py-1 text-xs"><Check className="h-3.5 w-3.5" aria-hidden /> Done</button>
                  <button onClick={() => setStatus(a, "cancelled")} className="btn-secondary !min-h-[36px] !py-1 text-xs"><XCircle className="h-3.5 w-3.5" aria-hidden /> Cancel</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {past.length > 0 && (
        <Card title="Past & cancelled">
          <ul className="divide-y divide-slate-100">
            {past.map((a) => (
              <li key={a.id} className="py-2 flex items-center gap-2 text-sm">
                <div className="flex-1"><span className="font-medium text-slate-800">{TYPE_LABEL[a.type]}</span> <span className="text-slate-500">· {formatDateTime(a.scheduledAt)}</span> <Badge tone={a.status === "completed" ? "success" : a.status === "cancelled" ? "warn" : "neutral"}>{a.status}</Badge></div>
                <button onClick={() => remove(a)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <DisclaimerBanner compact />
    </div>
  );
}

function OnlineBooking({ onBooked }: { onBooked: () => void }) {
  const { toast } = useToast();
  const [provider, setProvider] = useState<string | null>(null);
  const [date, setDate] = useState(toDateInputValue(addDays(new Date(), 1)));
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const p = DEMO_PROVIDERS.find((x) => x.id === provider);

  async function book() {
    setError(null);
    if (!p) return setError("Please select a provider.");
    if (!time) return setError("Please select a time slot.");
    setSaving(true);
    try {
      await api("/api/appointments", { method: "POST", json: { kind: "online", type: "consultation", providerId: p.id, date, time, notes } });
      setDone(`Booked with ${p.name} (fictional) on ${date} at ${time}.`);
      toast("Demo consultation booked", "success");
      setTime("");
      onBooked();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Online consultation" subtitle="Demo providers — fictional profiles for demonstration; no real clinician or partnership is implied." action={<DemoBadge label="Demo providers" />}>
      <div className="grid md:grid-cols-3 gap-3">
        {DEMO_PROVIDERS.map((pr) => (
          <button key={pr.id} onClick={() => { setProvider(pr.id); setTime(""); setDone(null); }} className={`text-left rounded-2xl border p-4 transition ${provider === pr.id ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`} aria-pressed={provider === pr.id}>
            <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center">{pr.name.split(" ").slice(-1)[0][0]}</div>
            <p className="mt-2 font-semibold text-slate-900">{pr.name}</p>
            <p className="text-sm text-slate-600">{pr.specialty}</p>
            <p className="text-xs text-slate-500 mt-1">{pr.languages.join(", ")} · {pr.fee}</p>
            <Badge tone="demo" className="mt-2">Fictional</Badge>
          </button>
        ))}
      </div>
      {p && (
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <Field label="Date" htmlFor="odate"><input id="odate" type="date" className="input" value={date} min={toDateInputValue(new Date())} onChange={(e) => setDate(e.target.value)} /></Field>
          <div>
            <p className="label">Available slots</p>
            <div className="flex flex-wrap gap-1.5">
              {p.slots.map((s) => (
                <button key={s} onClick={() => setTime(s)} className={`rounded-lg border px-3 py-2 text-sm font-medium ${time === s ? "bg-brand-600 text-white border-brand-600" : "bg-white border-slate-300 hover:bg-slate-50"}`} aria-pressed={time === s}>{s}</button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2"><Field label="Reason / notes (optional)" htmlFor="onotes"><input id="onotes" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Rising blood pressure readings" /></Field></div>
          {error && <div className="sm:col-span-2"><Alert tone="danger">{error}</Alert></div>}
          {done && <div className="sm:col-span-2"><Alert tone="success" title="Booking confirmed (demo)">{done} No real consultation will take place.</Alert></div>}
          <div className="sm:col-span-2"><button onClick={book} disabled={saving} className="btn-primary w-full sm:w-auto">{saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Confirm booking</button></div>
        </div>
      )}
    </Card>
  );
}

function OfflineBooking({ onBooked }: { onBooked: () => void }) {
  const { toast } = useToast();
  const [type, setType] = useState("antenatal");
  const [facility, setFacility] = useState(DEMO_FACILITIES[1].name + " (fictional)");
  const [date, setDate] = useState(toDateInputValue(addDays(new Date(), 3)));
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api("/api/appointments", { method: "POST", json: { kind: "offline", type, facilityName: facility, date, time, notes } });
      toast("Appointment added", "success");
      setNotes("");
      onBooked();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Offline appointment" subtitle="Schedule a visit at a facility. Facility names are from the demo directory or your own entry.">
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3" noValidate>
        <Field label="Type" htmlFor="atype"><select id="atype" className="input" value={type} onChange={(e) => setType(e.target.value)}><option value="antenatal">Antenatal visit</option><option value="test">Test</option><option value="vaccination">Vaccination</option><option value="follow_up">Follow-up</option></select></Field>
        <Field label="Facility" htmlFor="afac"><input id="afac" className="input" list="facilities" value={facility} onChange={(e) => setFacility(e.target.value)} /><datalist id="facilities">{DEMO_FACILITIES.map((f) => <option key={f.id} value={`${f.name} (fictional)`} />)}</datalist></Field>
        <Field label="Date" htmlFor="adate"><input id="adate" type="date" className="input" value={date} min={toDateInputValue(new Date())} onChange={(e) => setDate(e.target.value)} required /></Field>
        <Field label="Time" htmlFor="atime"><input id="atime" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} required /></Field>
        <div className="sm:col-span-2"><Field label="Notes (optional)" htmlFor="anotes"><input id="anotes" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Bring BP log and reports" /></Field></div>
        {error && <div className="sm:col-span-2"><Alert tone="danger">{error}</Alert></div>}
        <div className="sm:col-span-2"><button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">{saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Schedule appointment</button></div>
      </form>
    </Card>
  );
}
