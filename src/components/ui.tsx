"use client";

import { type ReactNode, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Info, Loader2, X, FlaskConical, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ children, className, title, action, subtitle }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode; subtitle?: ReactNode }) {
  return (
    <section className={cn("card p-4 sm:p-5", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 mb-3">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="text-slate-600 mt-1 max-w-3xl">{subtitle}</p>}
      </div>
      {action && <div className="flex gap-2 flex-wrap">{action}</div>}
    </div>
  );
}

export function Badge({ children, className, tone = "neutral" }: { children: ReactNode; className?: string; tone?: "neutral" | "brand" | "warn" | "danger" | "success" | "demo" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    brand: "bg-brand-50 text-brand-800 border-brand-200",
    warn: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-red-50 text-red-800 border-red-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    demo: "bg-violet-50 text-violet-800 border-violet-200",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", tones[tone], className)}>{children}</span>;
}

export function DemoBadge({ label = "Demo" }: { label?: string }) {
  return (
    <Badge tone="demo">
      <FlaskConical className="h-3 w-3" aria-hidden /> {label}
    </Badge>
  );
}

export function Alert({ children, tone = "info", title, className }: { children: ReactNode; tone?: "info" | "warn" | "danger" | "success"; title?: string; className?: string }) {
  const tones = {
    info: "bg-sky-50 border-sky-200 text-sky-900",
    warn: "bg-amber-50 border-amber-200 text-amber-900",
    danger: "bg-red-50 border-red-200 text-red-900",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  };
  const Icon = tone === "danger" ? ShieldAlert : tone === "warn" ? AlertTriangle : Info;
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-sm flex gap-3", tones[tone], className)}>
      <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
      <div>
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function Spinner({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-slate-500 text-sm py-6 justify-center", className)} role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> {label}
    </div>
  );
}

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="text-center py-10 px-4">
      <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center">{icon ?? <Info className="h-6 w-6" aria-hidden />}</div>
      <p className="font-semibold text-slate-900">{title}</p>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert tone="danger" title="Something went wrong">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 underline font-medium">
          Try again
        </button>
      )}
    </Alert>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className={cn("relative w-full bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint, error, htmlFor }: { label: string; children: ReactNode; hint?: string; error?: string; htmlFor?: string }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function DisclaimerBanner({ compact }: { compact?: boolean }) {
  return (
    <div className={cn("rounded-xl border border-amber-200 bg-amber-50 text-amber-900", compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm")}>
      <strong>Medical disclaimer:</strong> Materna AI is a prototype for maternal health monitoring and decision support. It is not a diagnostic system, does not prescribe treatment, and does not replace qualified healthcare professionals or antenatal care.{" "}
      <Link href="/safety" className="underline font-medium">
        Read more
      </Link>
    </div>
  );
}

export function Stat({ label, value, sub, tone = "neutral" }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "neutral" | "brand" | "warn" | "danger" }) {
  const tones = { neutral: "text-slate-900", brand: "text-brand-700", warn: "text-amber-700", danger: "text-red-700" };
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{label}</p>
      <p className={cn("text-2xl font-bold mt-1 leading-tight", tones[tone])}>{value}</p>
      {sub && <p className="text-sm text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("h-2.5 w-full rounded-full bg-slate-200 overflow-hidden", className)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${v}%` }} />
    </div>
  );
}
