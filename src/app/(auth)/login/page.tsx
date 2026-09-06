"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryParam } from "@/lib/use-query-param";
import { Loader2 } from "lucide-react";
import { DemoButton } from "@/components/public-nav";
import { Alert, Field } from "@/components/ui";
import { api } from "@/lib/use-api";

export default function LoginPage() {
  const router = useRouter();
  const nextParam = useQueryParam("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api("/api/auth/login", { method: "POST", json: { email, password } });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="card p-6">
      <h1 className="text-2xl font-bold text-slate-900">Log in</h1>
      <p className="text-sm text-slate-600 mt-1">Welcome back. Your monitoring picks up where you left off.</p>
      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <Field label="Email" htmlFor="email">
          <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="password">
          <input id="password" type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <Alert tone="danger">{error}</Alert>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Log in
        </button>
      </form>
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
        <p className="relative text-center text-xs text-slate-500 bg-white inline-block left-1/2 -translate-x-1/2 px-2">or</p>
      </div>
      <DemoButton className="btn-secondary w-full" />
      <p className="text-xs text-slate-500 mt-2 text-center">Loads a synthetic demo patient (demo@materna.ai / demo1234). Not a real person.</p>
      <p className="mt-5 text-sm text-center text-slate-600">
        New here? <Link href="/register" className="font-semibold text-brand-700 underline">Create an account</Link>
      </p>
    </div>
  );
}
