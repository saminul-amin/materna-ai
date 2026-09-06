"use client";

import Link from "next/link";
import { Activity, BarChart3, Sparkles, FolderHeart, CalendarClock, BookOpen, Phone, ArrowRight, ShieldCheck, Eye, Layers } from "lucide-react";
import { DemoButton } from "@/components/public-nav";
import { useLang } from "@/components/providers";

const FEATURES = [
  { icon: Activity, title: "Monitor pregnancy health", text: "Record blood pressure, weight, heart rate, glucose and symptoms in one timeline across the whole pregnancy." },
  { icon: BarChart3, title: "Detect health trends", text: "A transparent trend engine compares recent readings with your personal baseline instead of looking at one number in isolation." },
  { icon: Sparkles, title: "Explain every alert", text: "Every observation answers “Why am I seeing this?” with the evidence, the data used, and what you can do next." },
  { icon: FolderHeart, title: "Organise medical reports", text: "Keep reports and prescriptions in a vault, extract visible values, review them, and add them to your timeline." },
  { icon: CalendarClock, title: "Coordinate care", text: "Turn an observation into a question for your doctor, book a consultation, or schedule an antenatal visit." },
  { icon: BookOpen, title: "Guide every week", text: "Week 1 to 40 guidance for body, baby, care, appointments, mental wellbeing and birth preparation." },
  { icon: Phone, title: "Reach emergency help", text: "Danger-sign checklist, one-tap 999, emergency contact, and a facility directory when minutes matter." },
];

const STEPS = ["Track", "Analyze", "Explain", "Act", "Monitor"];

export default function LandingPage() {
  const { t } = useLang();
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-16 sm:pt-20 sm:pb-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-800 mb-5">
              <ShieldCheck className="h-4 w-4" aria-hidden /> Prototype MVP · Human-in-the-loop safety model
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">MATERNA AI</h1>
            <p className="mt-3 text-xl sm:text-2xl font-semibold text-brand-800">{t.tagline}</p>
            <p className="mt-4 text-lg text-slate-600">From First Trimester to Delivery — Monitoring, Care Coordination, Emergency Access, and Everyday Wellbeing in One Platform.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="btn-primary text-lg !px-6">
                {t.nav.getStarted} <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <DemoButton className="btn-secondary text-lg !px-6" label={t.nav.tryDemo} />
            </div>
            <p className="mt-3 text-xs text-slate-500">Try Demo loads a synthetic demo patient — not a real person. No sign-up needed.</p>
          </div>
          <div className="card p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Example observation (synthetic data)</p>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <BarChart3 className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Blood pressure trend is increasing</p>
                <p className="text-sm text-slate-600 mt-1">Your recent blood pressure readings show an upward trend compared with your earlier measurements. Consider discussing this trend with a qualified healthcare professional.</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ["Baseline", "110/70"],
                ["Recent", "132/85"],
                ["Direction", "Upward"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 py-2">
                  <p className="text-[11px] uppercase text-slate-500 font-semibold">{k}</p>
                  <p className="font-bold text-slate-900">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 p-3 text-sm">
              <p className="font-semibold text-slate-800 flex items-center gap-1">
                <Eye className="h-4 w-4 text-brand-600" aria-hidden /> Why am I seeing this?
              </p>
              <ul className="mt-1 text-slate-600 list-disc pl-5 space-y-0.5">
                <li>Recent readings are higher than your earlier baseline</li>
                <li>The latest readings show an upward pattern</li>
                <li>21 measurements over 10 weeks contributed</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="mx-auto max-w-6xl px-4 py-14 grid md:grid-cols-3 gap-6">
        {[
          { h: "Problem", p: "Pregnancy information and health records become fragmented between visits — paper reports, scattered readings, and alerts nobody explains." },
          { h: "Solution", p: "Materna AI continuously organises pregnancy information and identifies understandable health trends, then connects them to a care action." },
          { h: "Differentiator", p: "Explainable longitudinal AI + medical document intelligence + care actions in one platform. Don't just detect a trend — explain it and connect the next step." },
        ].map((b) => (
          <div key={b.h} className="card p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">{b.h}</p>
            <p className="mt-2 text-slate-700">{b.p}</p>
          </div>
        ))}
      </section>

      {/* What it does */}
      <section className="bg-white border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">What Materna AI does</h2>
          <p className="text-slate-600 mt-2 max-w-2xl">Seven connected capabilities, built around one workflow: health information and pregnancy history → AI analysis → explanation → care action → ongoing weekly guidance.</p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 p-5 hover:border-brand-300 transition">
                <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                  <f.icon className="h-5 w-5" aria-hidden />
                </div>
                <p className="mt-3 font-semibold text-slate-900">{f.title}</p>
                <p className="mt-1 text-sm text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Core workflow</h2>
        <p className="text-slate-600 mt-2">Every feature maps onto one loop.</p>
        <ol className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {STEPS.map((s, i) => (
            <li key={s} className="relative card p-4 text-center">
              <span className="text-xs font-semibold text-slate-400">Step {i + 1}</span>
              <p className="text-lg font-bold text-brand-800">{s}</p>
              {i < STEPS.length - 1 && <ArrowRight className="hidden sm:block absolute -right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" aria-hidden />}
            </li>
          ))}
        </ol>
        <div className="mt-6">
          <Link href="/architecture" className="inline-flex items-center gap-2 text-brand-700 font-semibold hover:underline">
            <Layers className="h-4 w-4" aria-hidden /> See the AI architecture
          </Link>
        </div>
      </section>

      {/* Safety */}
      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" aria-hidden /> Safety first
          </h2>
          <p className="mt-2 text-amber-900">Materna AI is a prototype for health monitoring and decision support. It does not diagnose, prescribe, or replace qualified healthcare professionals.</p>
          <p className="mt-2 text-sm text-amber-800">All AI-generated observations are information to help a pregnant woman decide when to discuss something with a qualified healthcare professional. Emergency symptoms are routed to urgent care, never to a diagnosis.</p>
          <Link href="/safety" className="mt-3 inline-block text-sm font-semibold underline text-amber-900">
            Read the full safety statement
          </Link>
        </div>
      </section>
    </div>
  );
}
