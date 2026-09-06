"use client";

import { useState } from "react";
import { Heart, Check } from "lucide-react";

const AMOUNTS = [
  { amount: 300, label: "৳300", impact: "About one month of premium monitoring for one mother" },
  { amount: 900, label: "৳900", impact: "About one trimester of premium monitoring for one mother" },
  { amount: 2700, label: "৳2,700", impact: "About a full pregnancy of premium monitoring for one mother" },
];

export default function SponsorPage() {
  const [selected, setSelected] = useState(AMOUNTS[1]);
  const [custom, setCustom] = useState("");
  const [confirmed, setConfirmed] = useState<{ amount: number; ref: string } | null>(null);
  const amount = custom ? Number(custom) || 0 : selected.amount;
  const mothers = Math.max(0, Math.floor(amount / 2700 * 10) / 10);

  function simulate() {
    if (amount <= 0) return;
    setConfirmed({ amount, ref: `DEMO-${Date.now().toString(36).toUpperCase()}` });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <span className="inline-block rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800">Demo / Concept — no donations are currently collected</span>
      <h1 className="mt-4 text-3xl font-bold text-slate-900 flex items-center gap-2">
        <Heart className="h-7 w-7 text-rose-500" aria-hidden /> Sponsor a Mother
      </h1>
      <p className="mt-3 text-slate-700 max-w-2xl">In a future version, sponsorship and donation mechanisms could subsidise premium monitoring, document intelligence and consultation access for low-income mothers. This page demonstrates the concept only; no payment is processed and no funds are collected.</p>

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="card p-5">
          <p className="font-semibold text-slate-900">Choose an example amount</p>
          <div className="mt-3 grid gap-2">
            {AMOUNTS.map((a) => (
              <button key={a.amount} onClick={() => { setSelected(a); setCustom(""); }} className={`text-left rounded-xl border px-4 py-3 transition ${!custom && selected.amount === a.amount ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`} aria-pressed={!custom && selected.amount === a.amount}>
                <p className="font-bold text-slate-900">{a.label}</p>
                <p className="text-sm text-slate-600">{a.impact}</p>
              </button>
            ))}
          </div>
          <label className="label mt-4" htmlFor="custom">Or enter a custom amount (৳)</label>
          <input id="custom" className="input" type="number" min={0} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. 1500" />
          <button onClick={simulate} className="btn-primary w-full mt-4" disabled={amount <= 0}>
            Simulate sponsorship (demo)
          </button>
          <p className="text-xs text-slate-500 mt-2">Nothing is charged. This only shows what a confirmation could look like.</p>
        </div>
        <div className="card p-5">
          <p className="font-semibold text-slate-900">Illustrative impact</p>
          <p className="text-sm text-slate-500">Example figures based on a hypothetical ৳2,700 per full pregnancy. Not real outcomes.</p>
          <div className="mt-4 flex items-end gap-3">
            <p className="text-5xl font-extrabold text-brand-700">{mothers}</p>
            <p className="text-slate-700 pb-2">mother-pregnancies of premium monitoring (illustrative)</p>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-1.5" aria-hidden>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`h-8 rounded-lg ${i < Math.round(mothers) ? "bg-rose-400" : "bg-slate-100"}`} />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">Each block = one full-pregnancy sponsorship (illustrative).</p>

          {confirmed && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4" role="status">
              <p className="font-semibold text-emerald-900 flex items-center gap-2">
                <Check className="h-5 w-5" aria-hidden /> Simulated confirmation
              </p>
              <p className="text-sm text-emerald-900 mt-1">Reference {confirmed.ref} · Amount ৳{confirmed.amount.toLocaleString()} · <strong>DEMO — no money was transferred.</strong></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
