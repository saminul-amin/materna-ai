"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DICT, type Dict, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ---------------- Language ---------------- */
interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}
const LangContext = createContext<LangCtx>({ lang: "en", setLang: () => {}, t: DICT.en });

export function useLang() {
  return useContext(LangContext);
}

/* ---------------- Toasts ---------------- */
interface Toast {
  id: number;
  kind: "success" | "error" | "info";
  message: string;
}
interface ToastCtx {
  toast: (message: string, kind?: Toast["kind"]) => void;
}
const ToastContext = createContext<ToastCtx>({ toast: () => {} });
export function useToast() {
  return useContext(ToastContext);
}

export function Providers({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("materna_lang");
      if (saved === "bn" || saved === "en") setLangState(saved);
    } catch {}
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("materna_lang", l);
    } catch {}
    document.documentElement.lang = l;
  }, []);

  const toast = useCallback((message: string, kind: Toast["kind"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const langValue = useMemo(() => ({ lang, setLang, t: DICT[lang] }), [lang, setLang]);

  return (
    <LangContext.Provider value={langValue}>
      <ToastContext.Provider value={{ toast }}>
        {children}
        <div aria-live="polite" className="fixed bottom-20 md:bottom-6 right-4 z-[100] flex flex-col gap-2 max-w-sm">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={cn(
                "rounded-xl px-4 py-3 text-sm font-medium shadow-lg border",
                t.kind === "success" && "bg-emerald-50 border-emerald-200 text-emerald-900",
                t.kind === "error" && "bg-red-50 border-red-200 text-red-900",
                t.kind === "info" && "bg-white border-slate-200 text-slate-900"
              )}
            >
              {t.message}
            </div>
          ))}
        </div>
      </ToastContext.Provider>
    </LangContext.Provider>
  );
}
