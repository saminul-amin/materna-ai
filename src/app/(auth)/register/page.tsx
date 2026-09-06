"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, Field } from "@/components/ui";
import { api } from "@/lib/use-api";
import { DemoButton } from "@/components/public-nav";

const initial = {
  name: "", email: "", password: "", phone: "", age: "",
  status: "pregnant", gestationalWeek: "", expectedDeliveryDate: "",
  gravida: "1", para: "0", previousHistory: "", healthInfo: "",
  emergencyName: "", emergencyRelation: "", emergencyPhone: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!f.gestationalWeek && !f.expectedDeliveryDate) {
      setError("Please enter either your current pregnancy week or the expected delivery date.");
      return;
    }
    setLoading(true);
    try {
      await api("/api/auth/register", { method: "POST", json: { ...f, age: f.age || undefined, gestationalWeek: f.gestationalWeek || undefined } });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="card p-6">
      <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
      <p className="text-sm text-slate-600 mt-1">For this prototype, please use synthetic or demo information. Only the fields needed for monitoring are collected.</p>
      <form onSubmit={submit} className="mt-5 space-y-5" noValidate>
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-900 mb-1">About you</legend>
          <Field label="Full name" htmlFor="name"><input id="name" className="input" required value={f.name} onChange={set("name")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age" htmlFor="age"><input id="age" type="number" min={13} max={60} className="input" value={f.age} onChange={set("age")} /></Field>
            <Field label="Phone" htmlFor="phone"><input id="phone" className="input" value={f.phone} onChange={set("phone")} placeholder="+880…" /></Field>
          </div>
          <Field label="Email" htmlFor="email"><input id="email" type="email" required autoComplete="email" className="input" value={f.email} onChange={set("email")} /></Field>
          <Field label="Password" htmlFor="password" hint="At least 6 characters"><input id="password" type="password" required minLength={6} autoComplete="new-password" className="input" value={f.password} onChange={set("password")} /></Field>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-900 mb-1">Pregnancy</legend>
          <Field label="Pregnancy status" htmlFor="status">
            <select id="status" className="input" value={f.status} onChange={set("status")}>
              <option value="pregnant">Currently pregnant</option>
              <option value="planning">Planning a pregnancy</option>
              <option value="postpartum">Recently gave birth</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Current week" htmlFor="week" hint="1–42"><input id="week" type="number" min={1} max={42} className="input" value={f.gestationalWeek} onChange={set("gestationalWeek")} /></Field>
            <Field label="Expected delivery date" htmlFor="edd" hint="Optional if week given"><input id="edd" type="date" className="input" value={f.expectedDeliveryDate} onChange={set("expectedDeliveryDate")} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total pregnancies (incl. this)" htmlFor="gravida"><input id="gravida" type="number" min={1} className="input" value={f.gravida} onChange={set("gravida")} /></Field>
            <Field label="Previous births" htmlFor="para"><input id="para" type="number" min={0} className="input" value={f.para} onChange={set("para")} /></Field>
          </div>
          <Field label="Previous pregnancy history" htmlFor="hist" hint="Optional. E.g. outcomes, complications noted by your provider."><textarea id="hist" className="input" rows={2} value={f.previousHistory} onChange={set("previousHistory")} /></Field>
          <Field label="Existing relevant health information" htmlFor="health" hint="Optional. E.g. conditions your provider is monitoring, allergies."><textarea id="health" className="input" rows={2} value={f.healthInfo} onChange={set("healthInfo")} /></Field>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-900 mb-1">Emergency contact</legend>
          <Field label="Name" htmlFor="ename"><input id="ename" className="input" value={f.emergencyName} onChange={set("emergencyName")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Relation" htmlFor="erel"><input id="erel" className="input" value={f.emergencyRelation} onChange={set("emergencyRelation")} placeholder="Husband, mother…" /></Field>
            <Field label="Phone" htmlFor="ephone"><input id="ephone" className="input" value={f.emergencyPhone} onChange={set("emergencyPhone")} /></Field>
          </div>
        </fieldset>

        {error && <Alert tone="danger">{error}</Alert>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Create account
        </button>
      </form>
      <div className="mt-4">
        <DemoButton className="btn-secondary w-full" label="Skip — Load Demo Patient instead" />
      </div>
      <p className="mt-5 text-sm text-center text-slate-600">
        Already registered? <Link href="/login" className="font-semibold text-brand-700 underline">Log in</Link>
      </p>
    </div>
  );
}
