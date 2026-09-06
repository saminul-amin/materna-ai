"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HeartPulse, Languages, Menu, X, Loader2 } from "lucide-react";
import { useLang, useToast } from "./providers";

export function DemoButton({ className = "btn-secondary", label }: { className?: string; label?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Could not load demo");
      toast("Demo patient loaded — synthetic data only", "success");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
      setLoading(false);
    }
  }
  return (
    <button onClick={load} disabled={loading} className={className}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {label ?? t.nav.demo}
    </button>
  );
}

export function PublicNav() {
  const { t, lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/about", label: t.nav.about },
    { href: "/architecture", label: t.nav.architecture },
    { href: "/pricing", label: t.nav.pricing },
    { href: "/sponsor", label: t.nav.sponsor },
    { href: "/safety", label: t.nav.safety },
  ];
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-9 w-9 rounded-xl bg-brand-600 text-white flex items-center justify-center">
            <HeartPulse className="h-5 w-5" aria-hidden />
          </span>
          <span className="font-bold text-lg text-slate-900">{t.appName}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700" aria-label="Public navigation">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand-700">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => setLang(lang === "en" ? "bn" : "en")} className="btn-ghost !min-h-[36px] !py-1 !px-3 text-sm" aria-label="Toggle language">
            <Languages className="h-4 w-4" aria-hidden /> {lang === "en" ? "বাংলা" : "English"}
          </button>
          <Link href="/login" className="btn-secondary !min-h-[40px]">
            {t.nav.login}
          </Link>
          <Link href="/register" className="btn-primary !min-h-[40px]">
            {t.nav.getStarted}
          </Link>
        </div>
        <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-2 font-medium text-slate-800">
              {l.label}
            </Link>
          ))}
          <button onClick={() => setLang(lang === "en" ? "bn" : "en")} className="btn-ghost justify-start text-sm">
            <Languages className="h-4 w-4" aria-hidden /> {lang === "en" ? "বাংলা" : "English"}
          </button>
          <div className="flex gap-2 pt-2">
            <Link href="/login" className="btn-secondary flex-1">
              {t.nav.login}
            </Link>
            <Link href="/register" className="btn-primary flex-1">
              {t.nav.getStarted}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  const { t } = useLang();
  return (
    <footer className="border-t border-slate-200 bg-white mt-16">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-bold text-slate-900 mb-2">{t.appName}</p>
          <p className="text-sm text-slate-600">{t.tagline}</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-slate-900 mb-2">Explore</p>
          <ul className="space-y-1 text-slate-600">
            <li><Link href="/about" className="hover:text-brand-700">{t.nav.about}</Link></li>
            <li><Link href="/architecture" className="hover:text-brand-700">{t.nav.architecture}</Link></li>
            <li><Link href="/pricing" className="hover:text-brand-700">{t.nav.pricing}</Link></li>
            <li><Link href="/sponsor" className="hover:text-brand-700">{t.nav.sponsor}</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-slate-900 mb-2">Trust</p>
          <ul className="space-y-1 text-slate-600">
            <li><Link href="/safety" className="hover:text-brand-700">{t.nav.safety}</Link></li>
            <li><Link href="/privacy" className="hover:text-brand-700">{t.nav.privacy}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-500">{t.common.disclaimer} Prototype MVP built for a university startup competition demonstration. Uses synthetic demo data only.</p>
      </div>
    </footer>
  );
}
