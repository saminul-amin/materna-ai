"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function PregnancyTimeline({ currentWeek, linkWeeks = true }: { currentWeek: number; linkWeeks?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-week="${currentWeek}"]`);
    if (el && ref.current) {
      ref.current.scrollTo({ left: el.offsetLeft - ref.current.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
    }
  }, [currentWeek]);
  const weeks = Array.from({ length: 40 }, (_, i) => i + 1);
  const tri = (w: number) => (w <= 13 ? 1 : w <= 27 ? 2 : 3);
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2 px-1">
        <span>1st trimester · wk 1–13</span>
        <span>2nd · wk 14–27</span>
        <span>3rd · wk 28–40</span>
      </div>
      <div ref={ref} className="timeline-scroll overflow-x-auto pb-2">
        <ol className="flex gap-1.5 min-w-max" aria-label="Pregnancy timeline, weeks 1 to 40">
          {weeks.map((w) => {
            const past = w < currentWeek;
            const now = w === currentWeek;
            const cls = cn(
              "flex flex-col items-center justify-center rounded-lg text-xs font-semibold h-11 w-9 transition border",
              now ? "bg-brand-600 text-white border-brand-700 scale-110 shadow" : past ? (tri(w) === 1 ? "bg-brand-100 text-brand-800 border-brand-200" : tri(w) === 2 ? "bg-brand-200 text-brand-900 border-brand-300" : "bg-brand-300 text-brand-900 border-brand-400") : "bg-white text-slate-500 border-slate-200"
            );
            const content = (
              <>
                <span className="text-[9px] uppercase leading-none opacity-70">wk</span>
                <span>{w}</span>
              </>
            );
            return (
              <li key={w} data-week={w} aria-current={now ? "step" : undefined}>
                {linkWeeks ? (
                  <Link href={`/guide?week=${w}`} className={cls} aria-label={`Week ${w}${now ? " (current week)" : ""}`}>
                    {content}
                  </Link>
                ) : (
                  <div className={cls}>{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
      <p className="text-xs text-slate-500 mt-1">
        Week <strong className="text-brand-700">{currentWeek}</strong> highlighted. Tap a week to open the guide.
      </p>
    </div>
  );
}
