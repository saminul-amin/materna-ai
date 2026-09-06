import Link from "next/link";
import { Check } from "lucide-react";

export const metadata = { title: "Free vs Premium" };

const FREE = ["Pregnancy profile", "Pregnancy timeline", "Basic measurement logging", "Week-by-week guide", "Danger-sign checklist", "Emergency directory", "Basic calendar", "Limited assistant"];
const PREMIUM = ["Full AI trend detection", "Explainable AI alerts", "Unlimited Document Vault", "Unlimited AI assistant", "Online consultation booking", "Pregnancy-history-informed context", "Family sharing", "Priority medicine / refill reminders"];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="text-center">
        <span className="inline-block rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800">Planned / MVP monetization demonstration</span>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Free Forever vs Premium</h1>
        <p className="mt-2 text-slate-600 max-w-2xl mx-auto">Core safety features stay free for every mother. Premium is a planned tier shown here to demonstrate the business model. No payment is processed in this MVP; the demo patient has all features enabled.</p>
      </div>
      <div className="mt-10 grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <p className="text-sm font-semibold text-brand-700 uppercase tracking-wide">Free Forever</p>
          <p className="mt-2 text-4xl font-extrabold text-slate-900">৳0</p>
          <p className="text-sm text-slate-500">Always free</p>
          <ul className="mt-6 space-y-2">
            {FREE.map((f) => (
              <li key={f} className="flex items-start gap-2 text-slate-700">
                <Check className="h-5 w-5 text-brand-600 shrink-0" aria-hidden /> {f}
              </li>
            ))}
          </ul>
          <Link href="/register" className="btn-secondary w-full mt-6">
            Get started free
          </Link>
        </div>
        <div className="card p-6 border-brand-300 ring-2 ring-brand-100">
          <p className="text-sm font-semibold text-brand-700 uppercase tracking-wide">Premium (planned)</p>
          <p className="mt-2 text-4xl font-extrabold text-slate-900">
            ৳— <span className="text-base font-medium text-slate-500">/ month</span>
          </p>
          <p className="text-sm text-slate-500">Pricing to be determined after validation</p>
          <ul className="mt-6 space-y-2">
            {PREMIUM.map((f) => (
              <li key={f} className="flex items-start gap-2 text-slate-700">
                <Check className="h-5 w-5 text-brand-600 shrink-0" aria-hidden /> {f}
              </li>
            ))}
          </ul>
          <button disabled className="btn-primary w-full mt-6" title="Not available in the MVP">
            Coming later — not available in MVP
          </button>
          <p className="mt-2 text-xs text-slate-500 text-center">Real payment processing is intentionally not implemented.</p>
        </div>
      </div>
      <p className="mt-8 text-center text-sm text-slate-600">
        Want to help subsidise access for low-income mothers? See <Link href="/sponsor" className="underline font-medium">Sponsor a Mother</Link> (concept).
      </p>
    </div>
  );
}
