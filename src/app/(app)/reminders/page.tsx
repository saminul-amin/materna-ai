"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, Loader2, Pill, BellOff, Bell } from "lucide-react";
import { useApi, api } from "@/lib/use-api";
import { useToast } from "@/components/providers";
import { Card, PageHeader, Modal, Field, Alert, Spinner, ErrorState, EmptyState, Badge } from "@/components/ui";

interface Reminder { id: string; name: string; dose: string | null; time: string; frequency: string; active: boolean; source: string }
const FREQ: Record<string, string> = { daily: "Daily", twice_daily: "Twice daily", weekly: "Weekly", custom: "Custom" };

export default function RemindersPage() {
  const { data, loading, error, reload } = useApi<Reminder[]>("/api/reminders");
  const { toast } = useToast();
  const [modal, setModal] = useState<null | { r?: Reminder }>(null);

  async function toggle(r: Reminder) {
    try {
      await api(`/api/reminders/${r.id}`, { method: "PATCH", json: { active: !r.active } });
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }
  async function remove(r: Reminder) {
    if (!confirm(`Delete reminder "${r.name}"?`)) return;
    try {
      await api(`/api/reminders/${r.id}`, { method: "DELETE" });
      toast("Reminder deleted", "success");
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Medication & Supplement Reminders" subtitle="Reminders only for items you or your prescription record have entered. Materna AI does not recommend medicines." action={<button onClick={() => setModal({})} className="btn-primary !min-h-[40px]"><Plus className="h-4 w-4" aria-hidden /> Add reminder</button>} />
      <Alert tone="info">Always follow the dose and timing advised by your healthcare professional. Do not start, stop or change any medicine based on this app.</Alert>
      {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : (data ?? []).length === 0 ? (
        <Card><EmptyState title="No reminders yet" description="Add the items your provider has advised so you never miss a dose." action={<button onClick={() => setModal({})} className="btn-primary">Add reminder</button>} icon={<Pill className="h-6 w-6" aria-hidden />} /></Card>
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {data!.map((r) => (
              <li key={r.id} className="py-3 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${r.active ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-400"}`}><Pill className="h-5 w-5" aria-hidden /></div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${r.active ? "text-slate-900" : "text-slate-400"}`}>{r.name} {r.source === "prescription" && <Badge tone="brand">From prescription record</Badge>}</p>
                  <p className="text-sm text-slate-600">{r.time} · {FREQ[r.frequency]}{r.dose ? ` · ${r.dose}` : ""}</p>
                </div>
                <button onClick={() => toggle(r)} className="p-2 rounded-lg hover:bg-slate-100" aria-label={r.active ? "Pause reminder" : "Activate reminder"} title={r.active ? "Pause" : "Activate"}>{r.active ? <Bell className="h-4 w-4 text-brand-700" /> : <BellOff className="h-4 w-4 text-slate-400" />}</button>
                <button onClick={() => setModal({ r })} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(r)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {modal && <ReminderModal r={modal.r} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
    </div>
  );
}

function ReminderModal({ r, onClose, onSaved }: { r?: Reminder; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState(r?.name ?? "");
  const [dose, setDose] = useState(r?.dose ?? "");
  const [time, setTime] = useState(r?.time ?? "09:00");
  const [frequency, setFrequency] = useState(r?.frequency ?? "daily");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (r) await api(`/api/reminders/${r.id}`, { method: "PATCH", json: { name, dose, time, frequency } });
      else await api("/api/reminders", { method: "POST", json: { name, dose, time, frequency } });
      toast(r ? "Reminder updated" : "Reminder added", "success");
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }
  return (
    <Modal open onClose={onClose} title={r ? "Edit reminder" : "Add reminder"}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Name" htmlFor="rname" hint="As written on your prescription or advised by your provider"><input id="rname" className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Iron + Folic acid" /></Field>
        <Field label="Dose / instructions" htmlFor="rdose"><input id="rdose" className="input" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 1 tablet after breakfast" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Time" htmlFor="rtime"><input id="rtime" type="time" className="input" required value={time} onChange={(e) => setTime(e.target.value)} /></Field>
          <Field label="Frequency" htmlFor="rfreq"><select id="rfreq" className="input" value={frequency} onChange={(e) => setFrequency(e.target.value)}>{Object.entries(FREQ).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        </div>
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex gap-2 justify-end"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save</button></div>
      </form>
    </Modal>
  );
}
