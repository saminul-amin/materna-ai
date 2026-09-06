"use client";

import Link from "next/link";
import { useApi, api } from "@/lib/use-api";
import { useToast } from "@/components/providers";
import { Card, PageHeader, Progress, Spinner, ErrorState, Alert } from "@/components/ui";

interface Item { id: string; key: string; label: string; done: boolean; hint: string }

export default function BirthPlanPage() {
  const { data, loading, error, reload, setData } = useApi<Item[]>("/api/birth-plan");
  const { toast } = useToast();
  const items = data ?? [];
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? (done / items.length) * 100 : 0;

  async function toggle(item: Item) {
    const next = items.map((i) => (i.key === item.key ? { ...i, done: !i.done } : i));
    setData(next);
    try {
      await api("/api/birth-plan", { method: "PATCH", json: { key: item.key, done: !item.done } });
    } catch (e) {
      toast((e as Error).message, "error");
      reload();
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Birth Preparedness" subtitle="A practical checklist so you, your family and your support person are ready before labour begins." />
      <Card>
        <div className="flex items-center justify-between mb-2"><p className="font-semibold text-slate-900">{done} of {items.length} complete</p><p className="text-sm text-slate-600">{Math.round(pct)}%</p></div>
        <Progress value={pct} />
        {pct === 100 && <Alert tone="success" className="mt-3">Your plan is complete. Review it with your support person and keep it up to date.</Alert>}
      </Card>
      {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {items.map((i) => (
              <li key={i.key}>
                <label className="flex items-start gap-3 py-3 cursor-pointer">
                  <input type="checkbox" checked={i.done} onChange={() => toggle(i)} className="mt-1 h-5 w-5 accent-brand-600" />
                  <div><p className={`font-medium ${i.done ? "line-through text-slate-400" : "text-slate-900"}`}>{i.label}</p><p className="text-sm text-slate-500">{i.hint}</p></div>
                </label>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <Link href="/settings" className="card p-4 hover:border-brand-300"><p className="font-semibold">Emergency contact</p><p className="text-slate-600">Set or update in Settings</p></Link>
        <Link href="/emergency" className="card p-4 hover:border-brand-300"><p className="font-semibold">Preferred facility</p><p className="text-slate-600">Browse the facility directory</p></Link>
        <Link href="/family" className="card p-4 hover:border-brand-300"><p className="font-semibold">Support person</p><p className="text-slate-600">Share your plan with family</p></Link>
      </div>
    </div>
  );
}
