"use client";

import { useEffect, useState } from "react";
import { useQueryParam } from "@/lib/use-query-param";
import { MessageSquareText, Sparkles, Loader2, Trash2, Copy, Check } from "lucide-react";
import { useApi, api } from "@/lib/use-api";
import { useToast } from "@/components/providers";
import { Card, PageHeader, Field, Alert, Spinner, ErrorState, Badge, DisclaimerBanner } from "@/components/ui";
import type { Observation } from "@/lib/trend-engine";
import { CATEGORY_META } from "@/lib/trend-engine";
import { formatDateTime } from "@/lib/utils";

interface Q { id: string; metric: string | null; question: string; status: string; createdAt: string }

export default function AskDoctorPage() {
  const wanted = useQueryParam("metric");
  const { toast } = useToast();
  const trends = useApi<{ observations: Observation[] }>("/api/trends");
  const list = useApi<Q[]>("/api/questions");
  const [metric, setMetric] = useState("");
  const [question, setQuestion] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!trends.data || wanted === undefined) return;
    const obsList = trends.data.observations;
    const preferred = wanted && obsList.find((o) => o.metric === wanted) ? wanted : null;
    if (!obsList.find((o) => o.metric === metric)) setMetric(preferred ?? obsList[0]?.metric ?? "");
  }, [trends.data, wanted, metric]);

  const obs = trends.data?.observations.find((o) => o.metric === metric);

  async function generate() {
    if (!metric) return;
    setGenerating(true);
    try {
      const r = await api<{ question: string }>("/api/questions", { method: "PUT", json: { metric } });
      setQuestion(r.question);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setGenerating(false);
    }
  }
  async function save() {
    if (question.trim().length < 5) return toast("Write a question first", "error");
    setSaving(true);
    try {
      await api("/api/questions", { method: "POST", json: { metric: metric || undefined, question } });
      toast("Saved — bring it to your next appointment", "success");
      setQuestion("");
      list.reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }
  async function setStatus(q: Q, status: string) {
    try {
      await api("/api/questions", { method: "PATCH", json: { id: q.id, status } });
      list.reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }
  async function remove(q: Q) {
    if (!confirm("Delete this question?")) return;
    try {
      await api(`/api/questions?id=${q.id}`, { method: "DELETE" });
      list.reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(question);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Copy not available", "error");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Ask Your Doctor" subtitle="Turn an AI observation into a clear question for a qualified healthcare professional. This connects AI analysis to human care." />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="1. Choose an observation" subtitle="Generated from your current trend analysis">
          {trends.loading && !trends.data ? <Spinner /> : trends.error ? <ErrorState message={trends.error} onRetry={trends.reload} /> : trends.data!.observations.length === 0 ? (
            <Alert tone="info">No observations yet. Record a few measurements first, or write your own question on the right.</Alert>
          ) : (
            <div className="space-y-2">
              {trends.data!.observations.map((o) => (
                <label key={o.metric} className={`flex gap-3 items-start rounded-xl border p-3 cursor-pointer ${metric === o.metric ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <input type="radio" name="metric" className="mt-1 h-4 w-4 accent-brand-600" checked={metric === o.metric} onChange={() => setMetric(o.metric)} />
                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-0.5"><Badge className={CATEGORY_META[o.category].badge}>{CATEGORY_META[o.category].label}</Badge><span className="text-xs text-slate-500">{o.metricLabel}</span></div>
                    <p className="text-sm font-medium text-slate-900">{o.title}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          <button onClick={generate} disabled={!obs || generating} className="btn-primary w-full mt-4">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />} Generate question
          </button>
        </Card>

        <Card title="2. Review and edit" subtitle="Make it yours — then save it for your appointment">
          <Field label="Question for your healthcare professional" htmlFor="q">
            <textarea id="q" className="input" rows={7} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Generate a question from an observation, or write your own…" maxLength={1000} />
          </Field>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={save} disabled={saving || question.trim().length < 5} className="btn-primary">{saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save question</button>
            <button onClick={copy} disabled={!question} className="btn-secondary">{copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} {copied ? "Copied" : "Copy"}</button>
          </div>
          {obs && <p className="text-xs text-slate-500 mt-3">The generated question quotes your own readings ({obs.data.count} measurements, baseline {obs.data.baselineAvg} → recent {obs.data.recentAvg} {obs.unit}). It never states a diagnosis.</p>}
        </Card>
      </div>

      <Card title="Saved questions" subtitle="Mark them as asked after your visit" action={<MessageSquareText className="h-5 w-5 text-brand-600" aria-hidden />}>
        {list.loading && !list.data ? <Spinner /> : (list.data ?? []).length === 0 ? <p className="text-sm text-slate-500">No saved questions yet.</p> : (
          <ul className="divide-y divide-slate-100">
            {list.data!.map((q) => (
              <li key={q.id} className="py-3 flex flex-col sm:flex-row sm:items-start gap-2">
                <div className="flex-1">
                  <p className="text-slate-900">{q.question}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatDateTime(q.createdAt)}{q.metric ? ` · ${q.metric}` : ""} · <Badge tone={q.status === "answered" ? "success" : q.status === "asked" ? "brand" : "neutral"}>{q.status}</Badge></p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {q.status === "draft" && <button onClick={() => setStatus(q, "asked")} className="btn-secondary !min-h-[36px] !py-1 text-xs">Mark asked</button>}
                  {q.status === "asked" && <button onClick={() => setStatus(q, "answered")} className="btn-secondary !min-h-[36px] !py-1 text-xs">Mark answered</button>}
                  <button onClick={() => remove(q)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <DisclaimerBanner compact />
    </div>
  );
}
