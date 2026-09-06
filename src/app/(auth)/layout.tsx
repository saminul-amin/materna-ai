import Link from "next/link";
import { HeartPulse } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <span className="h-10 w-10 rounded-xl bg-brand-600 text-white flex items-center justify-center">
            <HeartPulse className="h-6 w-6" aria-hidden />
          </span>
          <span className="font-bold text-xl text-slate-900">Materna AI</span>
        </Link>
        {children}
        <p className="mt-6 text-center text-xs text-slate-500">Prototype MVP · Use synthetic/demo information only · <Link href="/safety" className="underline">Safety</Link> · <Link href="/privacy" className="underline">Privacy</Link></p>
      </div>
    </div>
  );
}
