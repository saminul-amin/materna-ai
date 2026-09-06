"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { useApi, api } from "@/lib/use-api";
import { useLang, useToast } from "@/components/providers";
import { Card, PageHeader, Field, Alert, Spinner, ErrorState, Badge } from "@/components/ui";

interface Me { user: { name: string; email: string; phone: string | null; age: number | null; language: string; notificationsEnabled: boolean; isDemo: boolean; plan: string }; emergencyContacts: { name: string; relation: string; phone: string }[]; familyMembers: { id: string }[] }

export default function SettingsPage() {
  const me = useApi<Me>("/api/me");
  const { toast } = useToast();
  const { lang, setLang } = useLang();
  const router = useRouter();
  const [f, setF] = useState({ name: "", phone: "", age: "", notificationsEnabled: true, ecName: "", ecRelation: "", ecPhone: "" });
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (me.data) {
      const u = me.data.user;
      const ec = me.data.emergencyContacts[0];
      setF({ name: u.name, phone: u.phone ?? "", age: u.age?.toString() ?? "", notificationsEnabled: u.notificationsEnabled, ecName: ec?.name ?? "", ecRelation: ec?.relation ?? "", ecPhone: ec?.phone ?? "" });
    }
  }, [me.data]);

  async function save(section: string, payload: unknown) {
    setSaving(section);
    try {
      await api("/api/me", { method: "PUT", json: payload });
      toast("Saved", "success");
      me.reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(null);
    }
  }
  async function changeLang(l: "en" | "bn") {
    setLang(l);
    await save("lang", { language: l });
  }
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (me.loading && !me.data) return <Spinner />;
  if (me.error || !me.data) return <ErrorState message={me.error ?? "No data"} onRetry={me.reload} />;

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Profile, language, notifications, privacy, emergency contacts, sharing and subscription." />

      <Card title="Profile">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Name" htmlFor="sname"><input id="sname" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Phone" htmlFor="sphone"><input id="sphone" className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Age" htmlFor="sage"><input id="sage" type="number" className="input" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} /></Field>
        </div>
        <p className="text-sm text-slate-500 mt-2">Email: {me.data.user.email}</p>
        <div className="mt-3 flex gap-2"><button onClick={() => save("profile", { name: f.name, phone: f.phone, age: f.age ? Number(f.age) : null })} className="btn-primary" disabled={saving === "profile"}>{saving === "profile" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save profile</button><Link href="/profile" className="btn-secondary">Pregnancy details</Link></div>
      </Card>

      <Card title="Language" subtitle="Navigation and major UI elements are translated. Medical content remains in English in this MVP pending review.">
        <div className="flex gap-2">
          <button onClick={() => changeLang("en")} className={`btn ${lang === "en" ? "btn-primary" : "btn-secondary"}`} aria-pressed={lang === "en"}>English</button>
          <button onClick={() => changeLang("bn")} className={`btn ${lang === "bn" ? "btn-primary" : "btn-secondary"}`} aria-pressed={lang === "bn"}>বাংলা (Bangla)</button>
        </div>
      </Card>

      <Card title="Notifications">
        <label className="flex items-center gap-3"><input type="checkbox" className="h-5 w-5 accent-brand-600" checked={f.notificationsEnabled} onChange={(e) => { setF({ ...f, notificationsEnabled: e.target.checked }); save("notif", { notificationsEnabled: e.target.checked }); }} /><span>Show in-app notifications for appointments, reminders and new observations</span></label>
        <p className="text-xs text-slate-500 mt-2">Push/SMS notifications are a future production feature; this MVP shows notifications inside the app only.</p>
      </Card>

      <Card title="Emergency contact">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Name" htmlFor="ecn"><input id="ecn" className="input" value={f.ecName} onChange={(e) => setF({ ...f, ecName: e.target.value })} /></Field>
          <Field label="Relation" htmlFor="ecr"><input id="ecr" className="input" value={f.ecRelation} onChange={(e) => setF({ ...f, ecRelation: e.target.value })} /></Field>
          <Field label="Phone" htmlFor="ecp"><input id="ecp" className="input" value={f.ecPhone} onChange={(e) => setF({ ...f, ecPhone: e.target.value })} /></Field>
        </div>
        <button onClick={() => { if (!f.ecName || !f.ecPhone) return toast("Name and phone are required", "error"); save("ec", { emergencyContact: { name: f.ecName, relation: f.ecRelation || "Family", phone: f.ecPhone } }); }} className="btn-primary mt-3" disabled={saving === "ec"}>{saving === "ec" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save emergency contact</button>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Privacy">
          <p className="text-sm text-slate-700">This prototype uses synthetic/demo data. Passwords are hashed, routes are protected, and health data is not shared with companions by default.</p>
          <Link href="/privacy" className="text-sm font-semibold text-brand-700 underline mt-2 inline-block">Read privacy page</Link>
        </Card>
        <Card title="Family sharing">
          <p className="text-sm text-slate-700">{me.data.familyMembers.length} companion{me.data.familyMembers.length === 1 ? "" : "s"} added.</p>
          <Link href="/family" className="text-sm font-semibold text-brand-700 underline mt-2 inline-block">Manage sharing</Link>
        </Card>
        <Card title="Subscription">
          <p className="text-sm text-slate-700">Current plan: <Badge tone={me.data.user.plan === "free" ? "neutral" : "brand"}>{me.data.user.plan === "premium_demo" ? "Premium (demo)" : "Free Forever"}</Badge></p>
          <Link href="/pricing" className="text-sm font-semibold text-brand-700 underline mt-2 inline-block">Compare plans (demo)</Link>
        </Card>
      </div>

      {me.data.user.isDemo && <Alert tone="info">You are using the synthetic demo patient. Loading the demo again from the landing page resets all demo data.</Alert>}

      <Card>
        <button onClick={logout} className="btn-secondary"><LogOut className="h-4 w-4" aria-hidden /> Log out</button>
      </Card>
    </div>
  );
}
