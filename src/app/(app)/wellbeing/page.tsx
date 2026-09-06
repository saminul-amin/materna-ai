"use client";

import { useState } from "react";
import { Loader2, Trash2, Heart } from "lucide-react";
import { useApi, api } from "@/lib/use-api";
import { useToast } from "@/components/providers";
import { Card, PageHeader, Field, Alert, Spinner, ErrorState, DisclaimerBanner } from "@/components/ui";
import { WellbeingChart } from "@/components/charts";
import { formatDateTime } from "@/lib/utils";

interface Entry { id: string; mood: number; stress: number; sleep: number; note: string | null; recordedAt: string }
interface Res { items: Entry[]; pattern: { concern: boolean; message: string } }

const SCALE = [1, 2, 3, 4, 5];
const MOOD_LABEL = ["Very low", "Low", "Okay", "Good", "Very good"];
const STRESS_LABEL = ["Very calm", "Calm", "Some", "Stressed", "Very stressed"];
const SLEEP_LABEL = ["Very poor", "Poor", "Okay", "Good", "Very good"];

function Scale({ label, value, onChange, labels, id }: { label: string; value: number; onChange: (v: number) => void; labels: string[]; id: string }) {
  return (
    <div>
      <p className="label" id={id}>{label}</p>
      <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-labelledby={id}>
        {SCALE.map((v) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)} className={`rounded-xl border py-2 text-center ${value === v ? "bg-brand-600 text-white border-brand-600" : "bg-white border-slate-300 hover:bg-slate-50"}`}>
            <p className="font-bold">{v}</p>
            <p className="text-[10px] leading-tight">{labels[v - 1]}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WellbeingPage() {
  const { data, loading, error, reload } = useApi<Res>("/api/wellbeing");
  const { toast } = useToast();
  const [mood, setMood] = useState(3);
  const [stress, setStress] = useState(3);
  const [sleep, setSleep] = useState(3);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/wellbeing", { method: "POST", json: { mood, stress, sleep, note } });
      toast("Check-in saved", "success");
      setNote("");
      reload();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }
  async function remove(id: string) {
    if (!confirm("Delete this check-in?")) return;
    try {
      await api(`/api/wellbeing?id=${id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Mental Wellbeing" subtitle="A quick check-in on mood, stress and sleep. Over time, this shows how you are doing — it does not diagnose anything." />

      {data && <Alert tone={data.pattern.concern ? "warn" : "success"} title={data.pattern.concern ? "A gentle note" : "Looking steady"}>{data.pattern.message}{data.pattern.concern && " If you ever feel unsafe or hopeless, seek urgent help."}</Alert>}

      <div className="grid lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2" title="How are you today?" action={<Heart className="h-5 w-5 text-rose-500" aria-hidden />}>
          <form onSubmit={submit} className="space-y-4">
            <Scale id="mood" label="Mood" value={mood} onChange={setMood} labels={MOOD_LABEL} />
            <Scale id="stress" label="Stress level" value={stress} onChange={setStress} labels={STRESS_LABEL} />
            <Scale id="sleep" label="Sleep quality" value={sleep} onChange={setSleep} labels={SLEEP_LABEL} />
            <Field label="Anything on your mind? (optional)" htmlFor="wnote"><input id="wnote" className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} /></Field>
            <button type="submit" className="btn-primary w-full" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save check-in</button>
          </form>
        </Card>
        <Card className="lg:col-span-3" title="Your wellbeing over time" subtitle="1 = low · 5 = high (for stress, 5 = very stressed)">
          {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : <WellbeingChart data={(data?.items ?? []).map((e) => ({ date: e.recordedAt, mood: e.mood, stress: e.stress, sleep: e.sleep }))} />}
        </Card>
      </div>

      <Card title="Check-in history">
        {(data?.items ?? []).length === 0 ? <p className="text-sm text-slate-500">No check-ins yet.</p> : (
          <ul className="divide-y divide-slate-100">
            {[...(data?.items ?? [])].reverse().map((e) => (
              <li key={e.id} className="py-2 flex items-center gap-3 text-sm">
                <div className="flex-1"><p className="text-slate-900">Mood {e.mood} · Stress {e.stress} · Sleep {e.sleep}</p><p className="text-slate-500">{formatDateTime(e.recordedAt)}{e.note ? ` · ${e.note}` : ""}</p></div>
                <button onClick={() => remove(e.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <DisclaimerBanner compact />
    </div>
  );
}
