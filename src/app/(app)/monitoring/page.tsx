"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryParam } from "@/lib/use-query-param";
import { Plus, Pencil, Trash2, Filter, Loader2 } from "lucide-react";
import { useApi, api } from "@/lib/use-api";
import { useToast } from "@/components/providers";
import { Card, PageHeader, Modal, Field, Alert, Spinner, ErrorState, EmptyState, Badge, DisclaimerBanner } from "@/components/ui";
import { BPChart, ValueChart, SERIES } from "@/components/charts";
import { formatDateTime, toDateInputValue, toTimeInputValue } from "@/lib/utils";
import { BP_BANDS, METRICS, type MetricType } from "@/lib/thresholds";

interface Measurement {
  id: string;
  type: MetricType;
  systolic: number | null;
  diastolic: number | null;
  value: number | null;
  unit: string;
  recordedAt: string;
  note: string | null;
  source: string;
}
interface Symptom {
  id: string;
  name: string;
  severity: string;
  recordedAt: string;
  note: string | null;
}

const TYPES: { key: MetricType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "bp", label: "Blood pressure" },
  { key: "weight", label: "Weight" },
  { key: "heart_rate", label: "Heart rate" },
  { key: "glucose", label: "Glucose" },
  { key: "temperature", label: "Temperature" },
];

export default function MonitoringPage() {
  const addParam = useQueryParam("add");
  const { toast } = useToast();
  const [type, setType] = useState<MetricType | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (type !== "all") q.set("type", type);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    return `/api/measurements?${q.toString()}`;
  }, [type, from, to]);
  const list = useApi<Measurement[]>(query);
  const symptoms = useApi<Symptom[]>("/api/symptoms");
  const [modal, setModal] = useState<null | { mode: "add" } | { mode: "edit"; m: Measurement }>(null);
  const [symptomModal, setSymptomModal] = useState(false);

  useEffect(() => {
    if (addParam === "1") setModal({ mode: "add" });
  }, [addParam]);

  const items = list.data ?? [];
  const bp = items.filter((m) => m.type === "bp");
  const series = (t: MetricType) => items.filter((m) => m.type === t).map((m) => ({ date: m.recordedAt, value: m.value }));

  async function remove(m: Measurement) {
    if (!confirm("Delete this measurement?")) return;
    try {
      await api(`/api/measurements/${m.id}`, { method: "DELETE" });
      toast("Measurement deleted", "success");
      list.reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }
  async function removeSymptom(s: Symptom) {
    if (!confirm("Delete this symptom entry?")) return;
    try {
      await api(`/api/symptoms?id=${s.id}`, { method: "DELETE" });
      symptoms.reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Health Monitoring"
        subtitle="Record and review your measurements over time. Regular readings give the trend engine a clearer picture."
        action={
          <>
            <button onClick={() => setSymptomModal(true)} className="btn-secondary !min-h-[40px]">Log symptom</button>
            <button onClick={() => setModal({ mode: "add" })} className="btn-primary !min-h-[40px]">
              <Plus className="h-4 w-4" aria-hidden /> Add measurement
            </button>
          </>
        }
      />

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <p className="label"><Filter className="inline h-4 w-4 mr-1" aria-hidden />Measurement type</p>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map((t) => (
                <button key={t.key} onClick={() => setType(t.key)} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${type === t.key ? "bg-brand-600 text-white border-brand-600" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"}`} aria-pressed={type === t.key}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="From" htmlFor="from"><input id="from" type="date" className="input !py-1.5" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="To" htmlFor="to"><input id="to" type="date" className="input !py-1.5" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          </div>
          {(from || to) && <button onClick={() => { setFrom(""); setTo(""); }} className="btn-ghost !min-h-[40px] text-sm">Clear dates</button>}
        </div>
      </Card>

      {list.loading && !list.data ? <Spinner /> : list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : null}

      {/* Charts */}
      {list.data && (
        <div className="grid lg:grid-cols-2 gap-4">
          {(type === "all" || type === "bp") && (
            <Card title="Blood pressure" subtitle="mmHg · dashed = prototype attention band" className="lg:col-span-2">
              <BPChart data={bp.map((m) => ({ date: m.recordedAt, systolic: m.systolic, diastolic: m.diastolic }))} attentionSys={BP_BANDS.attention.systolic} attentionDia={BP_BANDS.attention.diastolic} />
            </Card>
          )}
          {(type === "all" || type === "weight") && <Card title="Weight" subtitle="kg"><ValueChart data={series("weight")} name="Weight" unit="kg" color={SERIES.a} /></Card>}
          {(type === "all" || type === "heart_rate") && <Card title="Heart rate" subtitle="bpm"><ValueChart data={series("heart_rate")} name="Heart rate" unit="bpm" color={SERIES.b} refLine={METRICS.heart_rate.attention?.max} /></Card>}
          {(type === "all" || type === "glucose") && <Card title="Blood glucose" subtitle="mmol/L"><ValueChart data={series("glucose")} name="Glucose" unit="mmol/L" color={SERIES.c} refLine={METRICS.glucose.attention?.max} /></Card>}
          {(type === "all" || type === "temperature") && <Card title="Temperature" subtitle="°C"><ValueChart data={series("temperature")} name="Temperature" unit="°C" color={SERIES.d} refLine={METRICS.temperature.attention?.max} domain={[35, 40]} /></Card>}
        </div>
      )}

      {/* Table */}
      {list.data && (
        <Card title="Measurement history" subtitle={`${items.length} record${items.length === 1 ? "" : "s"}`}>
          {items.length === 0 ? (
            <EmptyState title="No measurements match" description="Add a measurement or widen the filters." action={<button onClick={() => setModal({ mode: "add" })} className="btn-primary">Add measurement</button>} />
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                    <th className="px-4 sm:px-2 py-2">Date &amp; time</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Value</th>
                    <th className="px-2 py-2 hidden sm:table-cell">Note</th>
                    <th className="px-2 py-2 hidden sm:table-cell">Source</th>
                    <th className="px-2 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...items].reverse().map((m) => (
                    <tr key={m.id} className="border-b border-slate-100">
                      <td className="px-4 sm:px-2 py-2 whitespace-nowrap">{formatDateTime(m.recordedAt)}</td>
                      <td className="px-2 py-2">{METRICS[m.type].label}</td>
                      <td className="px-2 py-2 font-semibold whitespace-nowrap">{m.type === "bp" ? `${m.systolic}/${m.diastolic}` : m.value} {m.unit}</td>
                      <td className="px-2 py-2 hidden sm:table-cell text-slate-600 max-w-[220px] truncate">{m.note}</td>
                      <td className="px-2 py-2 hidden sm:table-cell"><Badge tone={m.source === "document" ? "brand" : m.source === "demo" ? "demo" : "neutral"}>{m.source}</Badge></td>
                      <td className="px-2 py-2 text-right whitespace-nowrap">
                        <button onClick={() => setModal({ mode: "edit", m })} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => remove(m)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Symptoms */}
      <Card title="Symptoms & notes" subtitle="Information to share with your care provider" action={<button onClick={() => setSymptomModal(true)} className="text-sm font-semibold text-brand-700 hover:underline">Log symptom</button>}>
        {symptoms.data?.length ? (
          <ul className="divide-y divide-slate-100">
            {symptoms.data.map((s) => (
              <li key={s.id} className="py-2 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{s.name} <Badge tone={s.severity === "severe" ? "danger" : s.severity === "moderate" ? "warn" : "neutral"}>{s.severity}</Badge></p>
                  <p className="text-sm text-slate-600">{formatDateTime(s.recordedAt)}{s.note ? ` · ${s.note}` : ""}</p>
                </div>
                <button onClick={() => removeSymptom(s)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" aria-label="Delete symptom"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No symptoms logged. If you have a danger sign, use the Danger Signs page instead.</p>
        )}
      </Card>

      <DisclaimerBanner compact />

      {modal && <MeasurementModal state={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); list.reload(); }} />}
      {symptomModal && <SymptomModal onClose={() => setSymptomModal(false)} onSaved={() => { setSymptomModal(false); symptoms.reload(); }} />}
    </div>
  );
}

function MeasurementModal({ state, onClose, onSaved }: { state: { mode: "add" } | { mode: "edit"; m: Measurement }; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const m = state.mode === "edit" ? state.m : null;
  const now = new Date();
  const [type, setType] = useState<MetricType>(m?.type ?? "bp");
  const [systolic, setSystolic] = useState(m?.systolic?.toString() ?? "");
  const [diastolic, setDiastolic] = useState(m?.diastolic?.toString() ?? "");
  const [value, setValue] = useState(m?.value?.toString() ?? "");
  const [date, setDate] = useState(toDateInputValue(m ? new Date(m.recordedAt) : now));
  const [time, setTime] = useState(toTimeInputValue(m ? new Date(m.recordedAt) : now));
  const [note, setNote] = useState(m?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const body = { type, systolic: type === "bp" ? Number(systolic) : null, diastolic: type === "bp" ? Number(diastolic) : null, value: type === "bp" ? null : Number(value), recordedAt: `${date}T${time}:00`, note };
    try {
      if (m) await api(`/api/measurements/${m.id}`, { method: "PUT", json: body });
      else await api("/api/measurements", { method: "POST", json: body });
      toast(m ? "Measurement updated" : "Measurement saved", "success");
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={m ? "Edit measurement" : "Add measurement"}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Type" htmlFor="mtype">
          <select id="mtype" className="input" value={type} onChange={(e) => setType(e.target.value as MetricType)} disabled={!!m}>
            {(Object.keys(METRICS) as MetricType[]).map((k) => <option key={k} value={k}>{METRICS[k].label} ({METRICS[k].unit})</option>)}
          </select>
        </Field>
        {type === "bp" ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Systolic (mmHg)" htmlFor="sys"><input id="sys" type="number" inputMode="numeric" className="input" required value={systolic} onChange={(e) => setSystolic(e.target.value)} placeholder="e.g. 118" /></Field>
            <Field label="Diastolic (mmHg)" htmlFor="dia"><input id="dia" type="number" inputMode="numeric" className="input" required value={diastolic} onChange={(e) => setDiastolic(e.target.value)} placeholder="e.g. 76" /></Field>
          </div>
        ) : (
          <Field label={`Value (${METRICS[type].unit})`} htmlFor="val"><input id="val" type="number" step="0.1" inputMode="decimal" className="input" required value={value} onChange={(e) => setValue(e.target.value)} /></Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" htmlFor="date"><input id="date" type="date" className="input" required value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Time" htmlFor="time"><input id="time" type="time" className="input" required value={time} onChange={(e) => setTime(e.target.value)} /></Field>
        </div>
        <Field label="Note (optional)" htmlFor="note"><input id="note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. after resting 5 minutes" maxLength={300} /></Field>
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save</button>
        </div>
      </form>
    </Modal>
  );
}

function SymptomModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [severity, setSeverity] = useState("mild");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api("/api/symptoms", { method: "POST", json: { name, severity, note, recordedAt: new Date().toISOString() } });
      toast("Symptom logged", "success");
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }
  return (
    <Modal open onClose={onClose} title="Log a symptom">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Symptom" htmlFor="sname"><input id="sname" className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Headache, swelling, nausea" list="symptom-list" /></Field>
        <datalist id="symptom-list">{["Headache", "Nausea", "Ankle swelling", "Back pain", "Heartburn", "Dizziness", "Fatigue", "Reduced baby movement"].map((s) => <option key={s} value={s} />)}</datalist>
        <Field label="Severity" htmlFor="sev">
          <select id="sev" className="input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option>
          </select>
        </Field>
        <Field label="Note (optional)" htmlFor="snote"><input id="snote" className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} /></Field>
        {severity === "severe" && <Alert tone="danger" title="Severe symptom?">If this could be a danger sign (severe headache, bleeding, vision changes, severe pain, reduced movement), please seek urgent medical care or call 999. Check the Danger Signs page.</Alert>}
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save</button>
        </div>
      </form>
    </Modal>
  );
}
