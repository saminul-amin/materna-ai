"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Plus, Trash2, Loader2, CalendarClock, Pill, Phone } from "lucide-react";
import { useApi, api } from "@/lib/use-api";
import { useToast } from "@/components/providers";
import { Card, PageHeader, Modal, Field, Alert, Spinner, ErrorState, Stat, Badge, DisclaimerBanner } from "@/components/ui";
import { PregnancyTimeline } from "@/components/pregnancy-timeline";
import { formatDate, formatDateTime, toDateInputValue, relativeDays } from "@/lib/utils";

interface Me {
  user: { name: string; email: string; phone: string | null; age: number | null; isDemo: boolean };
  profile: { status: string; expectedDeliveryDate: string; gravida: number; para: number; healthInfo: string | null; bloodGroup: string | null; heightCm: number | null; prePregnancyWeightKg: number | null } | null;
  week: number | null;
  trimester: number | null;
  daysToEdd: number | null;
  emergencyContacts: { id: string; name: string; relation: string; phone: string }[];
  history: { id: string; year: number; outcome: string; notes: string | null }[];
}
interface Appt { id: string; type: string; kind: string; scheduledAt: string; status: string; facilityName: string | null; providerName: string | null }
interface Reminder { id: string; name: string; time: string; dose: string | null; active: boolean }

const OUTCOME: Record<string, string> = { live_birth: "Live birth", miscarriage: "Miscarriage", stillbirth: "Stillbirth", ongoing: "Ongoing", other: "Other / notes" };

export default function ProfilePage() {
  const me = useApi<Me>("/api/me");
  const appts = useApi<Appt[]>("/api/appointments");
  const reminders = useApi<Reminder[]>("/api/reminders");
  const { toast } = useToast();
  const [edit, setEdit] = useState(false);
  const [addHist, setAddHist] = useState(false);

  if (me.loading && !me.data) return <Spinner />;
  if (me.error || !me.data) return <ErrorState message={me.error ?? "No data"} onRetry={me.reload} />;
  const d = me.data;
  const upcoming = (appts.data ?? []).filter((a) => a.status === "scheduled" && new Date(a.scheduledAt) > new Date()).slice(0, 4);

  async function removeHist(id: string) {
    if (!confirm("Remove this history entry?")) return;
    try {
      await api(`/api/history?id=${id}`, { method: "DELETE" });
      me.reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Pregnancy Profile" subtitle="Your pregnancy at a glance — timeline, history, key information and contacts." action={<button onClick={() => setEdit(true)} className="btn-primary !min-h-[40px]"><Pencil className="h-4 w-4" aria-hidden /> Edit profile</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4"><Stat label="Current week" value={d.week ? `Week ${d.week}` : "—"} sub={d.trimester ? `Trimester ${d.trimester}` : "Set your EDD"} tone="brand" /></Card>
        <Card className="!p-4"><Stat label="Expected delivery" value={d.profile ? formatDate(d.profile.expectedDeliveryDate) : "—"} sub={d.daysToEdd != null ? `${d.daysToEdd} days to go` : ""} /></Card>
        <Card className="!p-4"><Stat label="Pregnancies / births" value={d.profile ? `G${d.profile.gravida} P${d.profile.para}` : "—"} sub="Gravida / Para" /></Card>
        <Card className="!p-4"><Stat label="Blood group" value={d.profile?.bloodGroup ?? "—"} sub={d.profile?.heightCm ? `Height ${d.profile.heightCm} cm` : ""} /></Card>
      </div>

      <Card title="Pregnancy timeline" subtitle="Week 1 → Week 40">
        {d.week ? <PregnancyTimeline currentWeek={d.week} /> : <Alert tone="info">Set your expected delivery date to place yourself on the timeline.</Alert>}
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Important health information">
          <p className="text-slate-800 whitespace-pre-wrap">{d.profile?.healthInfo || <span className="text-slate-500">Nothing recorded yet. Add anything your provider is monitoring, allergies, or relevant history.</span>}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div><dt className="text-slate-500">Status</dt><dd className="font-medium capitalize">{d.profile?.status ?? "—"}</dd></div>
            <div><dt className="text-slate-500">Pre-pregnancy weight</dt><dd className="font-medium">{d.profile?.prePregnancyWeightKg ? `${d.profile.prePregnancyWeightKg} kg` : "—"}</dd></div>
            <div><dt className="text-slate-500">Age</dt><dd className="font-medium">{d.user.age ?? "—"}</dd></div>
            <div><dt className="text-slate-500">Phone</dt><dd className="font-medium">{d.user.phone ?? "—"}</dd></div>
          </dl>
        </Card>

        <Card title="Previous pregnancy history" action={<button onClick={() => setAddHist(true)} className="text-sm font-semibold text-brand-700 hover:underline inline-flex items-center gap-1"><Plus className="h-4 w-4" aria-hidden /> Add</button>}>
          {d.history.length === 0 ? (
            <p className="text-sm text-slate-500">No previous pregnancies recorded.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.history.map((h) => (
                <li key={h.id} className="py-2 flex items-start justify-between gap-2">
                  <div><p className="font-medium text-slate-900">{h.year} · {OUTCOME[h.outcome] ?? h.outcome}</p>{h.notes && <p className="text-sm text-slate-600">{h.notes}</p>}</div>
                  <button onClick={() => removeHist(h.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Emergency contact" action={<Phone className="h-5 w-5 text-red-600" aria-hidden />}>
          {d.emergencyContacts.length === 0 ? (
            <p className="text-sm text-slate-500">No emergency contact yet. <button onClick={() => setEdit(true)} className="underline font-medium">Add one</button>.</p>
          ) : (
            d.emergencyContacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2">
                <div><p className="font-semibold text-slate-900">{c.name}</p><p className="text-sm text-slate-600">{c.relation} · {c.phone}</p></div>
                <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="btn-danger !min-h-[40px] text-sm"><Phone className="h-4 w-4" aria-hidden /> Call</a>
              </div>
            ))
          )}
        </Card>

        <Card title="Upcoming appointments" action={<Link href="/care" className="text-sm font-semibold text-brand-700 hover:underline">Manage</Link>}>
          {upcoming.length === 0 ? <p className="text-sm text-slate-500">No upcoming appointments.</p> : (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((a) => (
                <li key={a.id} className="py-2 flex items-center gap-3">
                  <CalendarClock className="h-5 w-5 text-brand-600 shrink-0" aria-hidden />
                  <div className="flex-1 min-w-0"><p className="font-medium text-slate-900 capitalize">{a.type.replace("_", " ")} <Badge tone="neutral">{a.kind}</Badge></p><p className="text-sm text-slate-600 truncate">{formatDateTime(a.scheduledAt)} · {a.facilityName || a.providerName}</p></div>
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">{relativeDays(a.scheduledAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Current reminders" action={<Link href="/reminders" className="text-sm font-semibold text-brand-700 hover:underline">Manage</Link>}>
          {(reminders.data ?? []).filter((r) => r.active).length === 0 ? <p className="text-sm text-slate-500">No active reminders.</p> : (
            <ul className="divide-y divide-slate-100">
              {(reminders.data ?? []).filter((r) => r.active).map((r) => (
                <li key={r.id} className="py-2 flex items-center gap-3">
                  <Pill className="h-5 w-5 text-brand-600 shrink-0" aria-hidden />
                  <div className="flex-1"><p className="font-medium text-slate-900">{r.name}</p><p className="text-sm text-slate-600">{r.time}{r.dose ? ` · ${r.dose}` : ""}</p></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <DisclaimerBanner compact />

      {edit && <EditProfileModal me={d} onClose={() => setEdit(false)} onSaved={() => { setEdit(false); me.reload(); }} />}
      {addHist && <HistoryModal onClose={() => setAddHist(false)} onSaved={() => { setAddHist(false); me.reload(); }} />}
    </div>
  );
}

function EditProfileModal({ me, onClose, onSaved }: { me: Me; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const p = me.profile;
  const ec = me.emergencyContacts[0];
  const [f, setF] = useState({
    name: me.user.name, phone: me.user.phone ?? "", age: me.user.age?.toString() ?? "",
    status: p?.status ?? "pregnant", edd: p ? toDateInputValue(new Date(p.expectedDeliveryDate)) : "", gravida: p?.gravida.toString() ?? "1", para: p?.para.toString() ?? "0",
    healthInfo: p?.healthInfo ?? "", bloodGroup: p?.bloodGroup ?? "", heightCm: p?.heightCm?.toString() ?? "", prePregnancyWeightKg: p?.prePregnancyWeightKg?.toString() ?? "",
    ecName: ec?.name ?? "", ecRelation: ec?.relation ?? "", ecPhone: ec?.phone ?? "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api("/api/me", {
        method: "PUT",
        json: {
          name: f.name, phone: f.phone, age: f.age ? Number(f.age) : null,
          profile: { status: f.status, expectedDeliveryDate: f.edd || undefined, gravida: Number(f.gravida), para: Number(f.para), healthInfo: f.healthInfo, bloodGroup: f.bloodGroup, heightCm: f.heightCm ? Number(f.heightCm) : null, prePregnancyWeightKg: f.prePregnancyWeightKg ? Number(f.prePregnancyWeightKg) : null },
          emergencyContact: f.ecName && f.ecPhone ? { name: f.ecName, relation: f.ecRelation || "Family", phone: f.ecPhone } : undefined,
        },
      });
      toast("Profile updated", "success");
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Edit profile" wide>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Name" htmlFor="pname"><input id="pname" className="input" value={f.name} onChange={set("name")} required /></Field>
          <Field label="Phone" htmlFor="pphone"><input id="pphone" className="input" value={f.phone} onChange={set("phone")} /></Field>
          <Field label="Age" htmlFor="page"><input id="page" type="number" className="input" value={f.age} onChange={set("age")} /></Field>
        </div>
        <div className="grid sm:grid-cols-4 gap-3">
          <Field label="Status" htmlFor="pstatus"><select id="pstatus" className="input" value={f.status} onChange={set("status")}><option value="pregnant">Pregnant</option><option value="planning">Planning</option><option value="postpartum">Postpartum</option></select></Field>
          <Field label="Expected delivery date" htmlFor="pedd"><input id="pedd" type="date" className="input" value={f.edd} onChange={set("edd")} /></Field>
          <Field label="Gravida" htmlFor="pg"><input id="pg" type="number" min={1} className="input" value={f.gravida} onChange={set("gravida")} /></Field>
          <Field label="Para" htmlFor="pp"><input id="pp" type="number" min={0} className="input" value={f.para} onChange={set("para")} /></Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Blood group" htmlFor="pbg"><input id="pbg" className="input" value={f.bloodGroup} onChange={set("bloodGroup")} placeholder="e.g. B+" /></Field>
          <Field label="Height (cm)" htmlFor="ph"><input id="ph" type="number" className="input" value={f.heightCm} onChange={set("heightCm")} /></Field>
          <Field label="Pre-pregnancy weight (kg)" htmlFor="pw"><input id="pw" type="number" step="0.1" className="input" value={f.prePregnancyWeightKg} onChange={set("prePregnancyWeightKg")} /></Field>
        </div>
        <Field label="Important health information" htmlFor="phi"><textarea id="phi" className="input" rows={3} value={f.healthInfo} onChange={set("healthInfo")} /></Field>
        <fieldset className="grid sm:grid-cols-3 gap-3">
          <legend className="text-sm font-bold text-slate-900 mb-1">Emergency contact</legend>
          <Field label="Name" htmlFor="ecn"><input id="ecn" className="input" value={f.ecName} onChange={set("ecName")} /></Field>
          <Field label="Relation" htmlFor="ecr"><input id="ecr" className="input" value={f.ecRelation} onChange={set("ecRelation")} /></Field>
          <Field label="Phone" htmlFor="ecp"><input id="ecp" className="input" value={f.ecPhone} onChange={set("ecPhone")} /></Field>
        </fieldset>
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save</button>
        </div>
      </form>
    </Modal>
  );
}

function HistoryModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [year, setYear] = useState(String(new Date().getFullYear() - 1));
  const [outcome, setOutcome] = useState("live_birth");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api("/api/history", { method: "POST", json: { year: Number(year), outcome, notes } });
      toast("History added", "success");
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }
  return (
    <Modal open onClose={onClose} title="Add previous pregnancy">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Year" htmlFor="hy"><input id="hy" type="number" className="input" value={year} onChange={(e) => setYear(e.target.value)} /></Field>
          <Field label="Outcome" htmlFor="ho"><select id="ho" className="input" value={outcome} onChange={(e) => setOutcome(e.target.value)}>{Object.entries(OUTCOME).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        </div>
        <Field label="Notes" htmlFor="hn" hint="E.g. complications noted by your provider, type of delivery."><textarea id="hn" className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex gap-2 justify-end"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary" disabled={saving}>Save</button></div>
      </form>
    </Modal>
  );
}
