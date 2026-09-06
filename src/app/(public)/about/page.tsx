import Link from "next/link";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose-slate">
      <h1 className="text-3xl font-bold text-slate-900">About Materna AI</h1>
      <p className="mt-4 text-lg text-slate-700">Materna AI is a maternal-health monitoring and decision-support platform. It helps a pregnant woman keep her health information together across the whole pregnancy, notice understandable trends in that information, and connect what she sees to the right next step with a qualified healthcare professional.</p>

      <h2 className="mt-10 text-xl font-bold text-slate-900">What it is</h2>
      <ul className="mt-3 list-disc pl-5 space-y-1 text-slate-700">
        <li>A longitudinal record of blood pressure, weight, heart rate, glucose, symptoms and documents</li>
        <li>A transparent trend engine that explains its observations</li>
        <li>A document vault that turns reports into reviewable, structured information</li>
        <li>Care coordination: questions for your doctor, consultations, appointments</li>
        <li>Emergency access: danger signs, 999, emergency contact, facility directory</li>
        <li>Everyday wellbeing: week-by-week guidance, mental wellbeing check-ins, birth preparedness, reminders</li>
      </ul>

      <h2 className="mt-10 text-xl font-bold text-slate-900">What it is not</h2>
      <ul className="mt-3 list-disc pl-5 space-y-1 text-slate-700">
        <li>Not an AI doctor or an autonomous diagnostic system</li>
        <li>Not a prescription system</li>
        <li>Not a replacement for antenatal care</li>
        <li>Not a clinically validated medical device</li>
      </ul>

      <h2 className="mt-10 text-xl font-bold text-slate-900">Current MVP vs future production</h2>
      <div className="mt-3 grid sm:grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="font-semibold text-brand-800">Current MVP (this prototype)</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 space-y-1">
            <li>Monitoring, trend detection, explainability</li>
            <li>Document intelligence (demo extraction + PDF text)</li>
            <li>Care coordination with demo providers</li>
            <li>Emergency access with demo facility directory</li>
            <li>Week-by-week guidance, wellbeing, reminders</li>
            <li>Synthetic demo patient</li>
          </ul>
        </div>
        <div className="card p-4">
          <p className="font-semibold text-slate-800">Future production (not yet available)</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 space-y-1">
            <li>Clinical validation of trend logic and thresholds</li>
            <li>Real healthcare-provider, pharmacy and lab integrations</li>
            <li>EHR interoperability</li>
            <li>Production-grade security and large-scale deployment</li>
            <li>Formal regulatory and compliance review</li>
          </ul>
        </div>
      </div>

      <p className="mt-10 text-sm text-slate-500">
        See also: <Link href="/safety" className="underline">Safety &amp; Disclaimer</Link> · <Link href="/privacy" className="underline">Privacy</Link> · <Link href="/architecture" className="underline">AI Architecture</Link>
      </p>
    </div>
  );
}
