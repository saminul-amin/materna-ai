import { ArrowDown, Database, Activity, BarChart3, Sparkles, GitBranch, CalendarClock, Phone, Building2, Video, Pill, RefreshCw, FileText, ScanText, ListChecks, UserCheck, Clock } from "lucide-react";

export const metadata = { title: "AI Architecture" };

const LAYERS = [
  { icon: Database, title: "User Health Data", text: "Blood pressure, weight, heart rate, glucose, symptoms, pregnancy history, documents", tone: "bg-slate-50 border-slate-200 text-slate-800" },
  { icon: Activity, title: "Health Monitoring Layer", text: "Validated entry, longitudinal timeline, filtering, charts", tone: "bg-brand-50 border-brand-200 text-brand-900" },
  { icon: BarChart3, title: "Trend & Anomaly Analysis", text: "Baseline vs recent · moving averages · rate of change · repeated readings · configurable prototype bands", tone: "bg-brand-50 border-brand-200 text-brand-900" },
  { icon: Sparkles, title: "Explainability Layer", text: "Observation · evidence · trend · explanation · data used · confidence", tone: "bg-violet-50 border-violet-200 text-violet-900" },
  { icon: GitBranch, title: "Care Recommendation Logic", text: "Deterministic safety escalation: stable → increasing → needs attention → urgent attention", tone: "bg-amber-50 border-amber-200 text-amber-900" },
];

const ACTIONS = [
  { icon: Video, label: "Online consultation" },
  { icon: CalendarClock, label: "Offline appointment" },
  { icon: Building2, label: "Facility referral" },
  { icon: Phone, label: "Emergency access" },
  { icon: Pill, label: "Medicine workflow" },
];

const DOC_FLOW = [
  { icon: FileText, label: "Medical documents" },
  { icon: ScanText, label: "OCR / NLP (prototype: demo mapping + PDF text)" },
  { icon: ListChecks, label: "Structured information" },
  { icon: UserCheck, label: "User confirmation" },
  { icon: Clock, label: "Health timeline" },
];

export default function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">AI Architecture</h1>
      <p className="mt-2 text-slate-600 max-w-3xl">Materna AI is built as a pipeline of transparent layers. Every layer is inspectable; no layer makes a diagnosis. The prototype implements each layer with deterministic, explainable logic that can later be replaced by validated models without changing the product workflow.</p>

      <div className="mt-10 grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Monitoring → Understanding → Action</h2>
          <ol className="space-y-2">
            {LAYERS.map((l, i) => (
              <li key={l.title}>
                <div className={`rounded-2xl border p-4 flex gap-3 ${l.tone}`}>
                  <l.icon className="h-6 w-6 shrink-0" aria-hidden />
                  <div>
                    <p className="font-bold">{l.title}</p>
                    <p className="text-sm opacity-90">{l.text}</p>
                  </div>
                </div>
                {i < LAYERS.length && <ArrowDown className="h-5 w-5 text-slate-300 mx-auto my-1" aria-hidden />}
              </li>
            ))}
            <li>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-bold text-emerald-900">Care Action</p>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {ACTIONS.map((a) => (
                    <div key={a.label} className="rounded-xl bg-white border border-emerald-200 p-2 text-center">
                      <a.icon className="h-5 w-5 mx-auto text-emerald-700" aria-hidden />
                      <p className="text-[11px] font-semibold text-emerald-900 mt-1">{a.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <ArrowDown className="h-5 w-5 text-slate-300 mx-auto my-1" aria-hidden />
            </li>
            <li>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 flex gap-3">
                <RefreshCw className="h-6 w-6 text-brand-700 shrink-0" aria-hidden />
                <div>
                  <p className="font-bold text-slate-900">Continuous Monitoring</p>
                  <p className="text-sm text-slate-600">New readings, documents and check-ins re-enter the loop; observations are recomputed with every request.</p>
                </div>
              </div>
            </li>
          </ol>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Medical Document Intelligence</h2>
          <ol className="space-y-2">
            {DOC_FLOW.map((d, i) => (
              <li key={d.label}>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 flex items-center gap-3">
                  <span className="h-9 w-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                    <d.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="text-sm font-semibold text-slate-800">{d.label}</p>
                </div>
                {i < DOC_FLOW.length - 1 && <ArrowDown className="h-4 w-4 text-slate-300 mx-auto my-0.5" aria-hidden />}
              </li>
            ))}
          </ol>
          <div className="mt-6 card p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Prototype implementation notes</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Trend engine: transparent statistics, not a trained model. No accuracy claim.</li>
              <li>Thresholds are configuration, labelled “Prototype/Demo Logic — Not for Clinical Use”.</li>
              <li>Document extraction: demo mapping for synthetic documents, real PDF text extraction with conservative pattern matching for uploads; OCR unavailable state for images.</li>
              <li>Assistant: rule-based prototype by default; optional LLM mode with a strict safety system prompt.</li>
              <li>Human-in-the-loop: every document value must be confirmed; every observation links to “Ask Your Doctor”.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
