import { THRESHOLD_DISCLAIMER } from "@/lib/thresholds";

export const metadata = { title: "Safety & Disclaimer" };

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Safety &amp; Medical Disclaimer</h1>
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <p className="font-semibold text-lg">Materna AI is a prototype for maternal health monitoring and decision support. It is not a diagnostic system, does not prescribe treatment, and does not replace qualified healthcare professionals or antenatal care.</p>
      </div>

      <h2 className="mt-10 text-xl font-bold text-slate-900">How AI is used</h2>
      <ul className="mt-3 list-disc pl-5 space-y-2 text-slate-700">
        <li>AI-generated observations are <strong>information</strong>, not diagnosis. They describe patterns in the readings you entered and suggest discussing them with a qualified healthcare professional.</li>
        <li>The trend engine is a <strong>transparent prototype</strong> that combines baseline comparison, moving averages, rate of change and repeated-reading logic. It is not a clinically validated machine-learning model and no accuracy figure is claimed.</li>
        <li>Every observation shows the evidence and the data it used on the “Why am I seeing this?” page.</li>
        <li>The AI Assistant provides general information only. It never diagnoses, prescribes, or advises stopping medication. Without an external language-model key it runs as a clearly labelled rule-based prototype.</li>
      </ul>

      <h2 className="mt-10 text-xl font-bold text-slate-900">Prototype thresholds</h2>
      <p className="mt-3 text-slate-700">{THRESHOLD_DISCLAIMER}</p>
      <p className="mt-2 text-slate-700">The thresholds live in one configuration file so they can be reviewed and formally mapped to appropriate clinical guidance before any real-world use.</p>

      <h2 className="mt-10 text-xl font-bold text-slate-900">Emergencies</h2>
      <p className="mt-3 text-slate-700">If you experience a danger sign such as heavy bleeding, severe headache, blurred vision, severe abdominal pain, reduced baby movement, fits, or breathing difficulty: <strong>seek urgent medical care</strong>. In Bangladesh, call <strong>999</strong>. Materna AI does not attempt to diagnose emergencies.</p>

      <h2 className="mt-10 text-xl font-bold text-slate-900">No fake claims</h2>
      <p className="mt-3 text-slate-700">This MVP contains no clinical validation, research statistics, patient outcomes, hospital or pharmacy partnerships, real doctor identities, government or WHO endorsement, user numbers, AI accuracy figures, or real payment transactions. Anything simulated is labelled <em>Demo</em>, <em>Prototype</em>, or <em>Synthetic Data</em>.</p>
    </div>
  );
}
