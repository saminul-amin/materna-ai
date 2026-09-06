"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Users, Eye, Lock } from "lucide-react";
import { useApi, api } from "@/lib/use-api";
import { useToast } from "@/components/providers";
import { Card, PageHeader, Modal, Field, Alert, Spinner, ErrorState, EmptyState, Badge, Progress } from "@/components/ui";
import { formatDateTime, relativeDays } from "@/lib/utils";

interface Member { id: string; name: string; relation: string; phone: string | null; shareAppointments: boolean; shareReminders: boolean; shareEmergency: boolean; shareBirthPlan: boolean; shareHealthData: boolean }
interface Dash { nextAppointment: { type: string; scheduledAt: string; facilityName?: string | null; providerName?: string | null } | null; nextReminder: { name: string; time: string } | null; latest: { bp: { systolic: number; diastolic: number } | null } }
interface Me { emergencyContacts: { name: string; phone: string; relation: string }[] }
type BP = { done: boolean }[];

const SHARE_KEYS: { key: keyof Member; label: string; hint: string }[] = [
  { key: "shareAppointments", label: "Upcoming appointments", hint: "Date, time and place" },
  { key: "shareReminders", label: "Reminders", hint: "Medicine/supplement reminder names and times" },
  { key: "shareEmergency", label: "Emergency contact", hint: "So they know who else to call" },
  { key: "shareBirthPlan", label: "Birth-preparedness status", hint: "Checklist progress" },
  { key: "shareHealthData", label: "Health measurements (off by default)", hint: "Latest readings and AI observations — sensitive" },
];

export default function FamilyPage() {
  const list = useApi<Member[]>("/api/family");
  const dash = useApi<Dash>("/api/dashboard");
  const me = useApi<Me>("/api/me");
  const bp = useApi<BP>("/api/birth-plan");
  const { toast } = useToast();
  const [modal, setModal] = useState(false);
  const [preview, setPreview] = useState<Member | null>(null);

  async function toggle(m: Member, key: keyof Member) {
    try {
      await api("/api/family", { method: "PATCH", json: { id: m.id, [key]: !m[key] } });
      list.reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }
  async function remove(m: Member) {
    if (!confirm(`Remove ${m.name} from sharing?`)) return;
    try {
      await api(`/api/family?id=${m.id}`, { method: "DELETE" });
      if (preview?.id === m.id) setPreview(null);
      list.reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  const bpDone = (bp.data ?? []).filter((i) => i.done).length;
  const bpTotal = (bp.data ?? []).length;

  return (
    <div className="space-y-5">
      <PageHeader title="Family / Companion Sharing" subtitle="Add a trusted companion and choose exactly what they can see. Sensitive health data is never shared by default." action={<button onClick={() => setModal(true)} className="btn-primary !min-h-[40px]"><Plus className="h-4 w-4" aria-hidden /> Add companion</button>} />
      <Alert tone="info">In this MVP the shared view is previewed inside your own account. A future version would send an invitation to the companion's phone.</Alert>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Trusted companions">
          {list.loading && !list.data ? <Spinner /> : list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : list.data!.length === 0 ? <EmptyState title="No companions yet" description="Add your partner, a parent or a friend." icon={<Users className="h-6 w-6" aria-hidden />} action={<button onClick={() => setModal(true)} className="btn-primary">Add companion</button>} /> : (
            <ul className="space-y-3">
              {list.data!.map((m) => (
                <li key={m.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1"><p className="font-semibold text-slate-900">{m.name}</p><p className="text-sm text-slate-600">{m.relation}{m.phone ? ` · ${m.phone}` : ""}</p></div>
                    <button onClick={() => setPreview(m)} className="btn-secondary !min-h-[36px] !py-1 text-xs"><Eye className="h-3.5 w-3.5" aria-hidden /> Preview</button>
                    <button onClick={() => remove(m)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-2 grid sm:grid-cols-2 gap-1">
                    {SHARE_KEYS.map((s) => (
                      <label key={s.key} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={!!m[s.key]} onChange={() => toggle(m, s.key)} /> {s.label}{s.key === "shareHealthData" && <Lock className="h-3 w-3 text-slate-400" aria-hidden />}</label>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={preview ? `What ${preview.name} sees` : "Shared view preview"} subtitle="Only the items you switched on">
          {!preview ? <p className="text-sm text-slate-500">Select a companion and press Preview.</p> : (
            <div className="space-y-3 text-sm">
              {preview.shareAppointments && <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs uppercase font-semibold text-slate-500">Next appointment</p>{dash.data?.nextAppointment ? <p className="text-slate-900">{dash.data.nextAppointment.type.replace("_", " ")} · {formatDateTime(dash.data.nextAppointment.scheduledAt)} ({relativeDays(dash.data.nextAppointment.scheduledAt)}) · {dash.data.nextAppointment.facilityName || dash.data.nextAppointment.providerName}</p> : <p className="text-slate-500">None scheduled</p>}</div>}
              {preview.shareReminders && <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs uppercase font-semibold text-slate-500">Next reminder</p><p className="text-slate-900">{dash.data?.nextReminder ? `${dash.data.nextReminder.name} at ${dash.data.nextReminder.time}` : "None"}</p></div>}
              {preview.shareEmergency && <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs uppercase font-semibold text-slate-500">Emergency contact</p><p className="text-slate-900">{me.data?.emergencyContacts[0] ? `${me.data.emergencyContacts[0].name} (${me.data.emergencyContacts[0].relation}) · ${me.data.emergencyContacts[0].phone}` : "Not set"} · Emergency: 999</p></div>}
              {preview.shareBirthPlan && <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs uppercase font-semibold text-slate-500">Birth preparedness</p><p className="text-slate-900 mb-1">{bpDone} of {bpTotal} items complete</p><Progress value={bpTotal ? (bpDone / bpTotal) * 100 : 0} /></div>}
              {preview.shareHealthData ? <div className="rounded-xl bg-amber-50 border border-amber-200 p-3"><p className="text-xs uppercase font-semibold text-amber-700">Health data (explicitly shared)</p><p className="text-slate-900">Latest BP: {dash.data?.latest.bp ? `${dash.data.latest.bp.systolic}/${dash.data.latest.bp.diastolic} mmHg` : "—"}</p></div> : <p className="text-xs text-slate-500 inline-flex items-center gap-1"><Lock className="h-3 w-3" aria-hidden /> Health measurements are hidden from this companion.</p>}
              {!preview.shareAppointments && !preview.shareReminders && !preview.shareEmergency && !preview.shareBirthPlan && !preview.shareHealthData && <Badge tone="neutral">Nothing is shared</Badge>}
            </div>
          )}
        </Card>
      </div>

      {modal && <AddModal onClose={() => setModal(false)} onSaved={() => { setModal(false); list.reload(); }} />}
    </div>
  );
}

function AddModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api("/api/family", { method: "POST", json: { name, relation, phone } });
      toast("Companion added", "success");
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }
  return (
    <Modal open onClose={onClose} title="Add a trusted companion">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Name" htmlFor="fname"><input id="fname" className="input" required value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Relation" htmlFor="frel"><input id="frel" className="input" required value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Husband, mother…" /></Field>
          <Field label="Phone (optional)" htmlFor="fphone"><input id="fphone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        </div>
        <p className="text-xs text-slate-500">Appointments, reminders, emergency contact and birth-plan status are shared by default. Health measurements stay private unless you switch them on.</p>
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex gap-2 justify-end"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Add</button></div>
      </form>
    </Modal>
  );
}
