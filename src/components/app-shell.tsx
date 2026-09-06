"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Activity, BarChart3, BookOpen, Bot, Brain, CalendarClock, ClipboardList, FileText, FolderHeart, HeartPulse, Home, LayoutDashboard, LogOut, Menu, MessageSquareText, Phone, Pill, Settings, ShieldAlert, ShoppingBag, Sparkles, Users, X, Baby, Languages, Layers,
} from "lucide-react";
import { useLang, useToast } from "./providers";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/use-api";

type NavKey = keyof ReturnType<typeof useLang>["t"]["nav"];
interface NavItem {
  href: string;
  key: NavKey;
  icon: typeof Home;
  group: "core" | "care" | "daily" | "more";
}

const NAV: NavItem[] = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard, group: "core" },
  { href: "/profile", key: "profile", icon: Baby, group: "core" },
  { href: "/monitoring", key: "monitoring", icon: Activity, group: "core" },
  { href: "/trends", key: "trends", icon: BarChart3, group: "core" },
  { href: "/explain", key: "explain", icon: Sparkles, group: "core" },
  { href: "/documents", key: "documents", icon: FolderHeart, group: "core" },
  { href: "/assistant", key: "assistant", icon: Bot, group: "care" },
  { href: "/ask-doctor", key: "askDoctor", icon: MessageSquareText, group: "care" },
  { href: "/care", key: "care", icon: CalendarClock, group: "care" },
  { href: "/emergency", key: "emergency", icon: Phone, group: "care" },
  { href: "/danger-signs", key: "dangerSigns", icon: ShieldAlert, group: "care" },
  { href: "/guide", key: "guide", icon: BookOpen, group: "daily" },
  { href: "/wellbeing", key: "wellbeing", icon: Brain, group: "daily" },
  { href: "/birth-plan", key: "birthPlan", icon: ClipboardList, group: "daily" },
  { href: "/reminders", key: "reminders", icon: Pill, group: "daily" },
  { href: "/medicine", key: "medicine", icon: ShoppingBag, group: "more" },
  { href: "/family", key: "family", icon: Users, group: "more" },
  { href: "/architecture", key: "architecture", icon: Layers, group: "more" },
  { href: "/settings", key: "settings", icon: Settings, group: "more" },
];

const GROUP_LABELS: Record<NavItem["group"], string> = { core: "Monitoring & AI", care: "Care & Safety", daily: "Everyday", more: "More" };

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const me = useApi<{ user: { name: string; isDemo: boolean; plan: string }; week: number | null }>("/api/me");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast("Logged out", "success");
    router.push("/");
    router.refresh();
  }

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav aria-label="Main navigation" className="flex flex-col gap-4">
      {(["core", "care", "daily", "more"] as const).map((g) => (
        <div key={g}>
          <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{GROUP_LABELS[g]}</p>
          <ul className="space-y-0.5">
            {NAV.filter((n) => n.group === g).map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "/");
              const Icon = n.icon;
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={onClick}
                    aria-current={active ? "page" : undefined}
                    className={cn("flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition", active ? "bg-brand-50 text-brand-800" : "text-slate-700 hover:bg-slate-100")}
                  >
                    <Icon className={cn("h-4.5 w-4.5 h-[18px] w-[18px]", active ? "text-brand-700" : "text-slate-400")} aria-hidden />
                    {t.nav[n.key]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-slate-200 bg-white">
        <div className="px-5 py-4 border-b border-slate-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-xl bg-brand-600 text-white flex items-center justify-center">
              <HeartPulse className="h-5 w-5" aria-hidden />
            </span>
            <span className="font-bold text-lg text-slate-900">{t.appName}</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks />
        </div>
        <div className="border-t border-slate-200 p-3">
          <button onClick={logout} className="btn-ghost w-full justify-start text-sm">
            <LogOut className="h-4 w-4" aria-hidden /> {t.nav.logout}
          </button>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 lg:pl-64">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/dashboard" className="lg:hidden font-bold text-slate-900">
              {t.appName}
            </Link>
            <div className="hidden lg:block text-sm text-slate-600 truncate">
              {me.data?.user ? (
                <>
                  <span className="font-medium text-slate-900">{me.data.user.name}</span>
                  {me.data.week && <span className="ml-2">· {t.common.week} {me.data.week}</span>}
                </>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {me.data?.user?.isDemo && (
              <span className="hidden sm:inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-800" title="Synthetic demo data — not a real patient">
                {t.common.demoData}
              </span>
            )}
            <button onClick={() => setLang(lang === "en" ? "bn" : "en")} className="btn-secondary !min-h-[36px] !py-1 !px-3 text-sm" aria-label="Toggle language">
              <Languages className="h-4 w-4" aria-hidden /> {lang === "en" ? "বাংলা" : "English"}
            </button>
            <Link href="/emergency" className="btn-danger !min-h-[36px] !py-1 !px-3 text-sm">
              <Phone className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">{t.nav.emergency}</span>
              <span className="sm:hidden">999</span>
            </Link>
          </div>
        </div>
        {me.data?.user?.isDemo && <div className="sm:hidden bg-violet-50 text-violet-800 text-[11px] font-semibold text-center py-1 border-t border-violet-100">{t.common.demoData}</div>}
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <span className="font-bold">{t.appName}</span>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavLinks onClick={() => setOpen(false)} />
            </div>
            <div className="border-t border-slate-200 p-3">
              <button onClick={logout} className="btn-ghost w-full justify-start text-sm">
                <LogOut className="h-4 w-4" aria-hidden /> {t.nav.logout}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="lg:pl-64 pb-20 lg:pb-8">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:py-6">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav aria-label="Quick navigation" className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 grid grid-cols-5">
        {[
          { href: "/dashboard", icon: Home, label: "Home" },
          { href: "/monitoring", icon: Activity, label: "Monitor" },
          { href: "/trends", icon: BarChart3, label: "Trends" },
          { href: "/documents", icon: FileText, label: "Vault" },
          { href: "/danger-signs", icon: ShieldAlert, label: "Danger" },
        ].map((n) => {
          const active = pathname.startsWith(n.href);
          const Icon = n.icon;
          return (
            <Link key={n.href} href={n.href} className={cn("flex flex-col items-center justify-center py-2 text-[11px] font-medium min-h-[56px]", active ? "text-brand-700" : "text-slate-500")} aria-current={active ? "page" : undefined}>
              <Icon className="h-5 w-5 mb-0.5" aria-hidden />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
