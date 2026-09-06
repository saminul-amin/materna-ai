"use client";

import Link from "next/link";
import { useState } from "react";
import { Phone, ShieldAlert, Users, Building2, Info } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { Card, PageHeader, Alert } from "@/components/ui";
import { DANGER_SIGNS } from "@/lib/static-data";

interface Me { emergencyContacts: { name: string; relation: string; phone: string }[] }

export default function DangerSignsPage() {
  const me = useApi<Me>("/api/me");
  const [selected, setSelected] = useState<string[]>([]);
  const urgent = selected.some((id) => DANGER_SIGNS.find((d) => d.id === id)?.urgent);
  const ec = me.data?.emergencyContacts[0];
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="space-y-5">
      <PageHeader title="Danger Signs" subtitle="Tick anything you are experiencing right now. This is information to help you decide to seek care — it is not a diagnosis." />

      {urgent && (
        <div role="alert" className="rounded-2xl border-2 border-red-500 bg-red-50 p-5">
          <p className="text-2xl font-extrabold text-red-700 flex items-center gap-2"><ShieldAlert className="h-7 w-7" aria-hidden /> Seek urgent medical care.</p>
          <p className="text-red-900 mt-1">One or more of the signs you selected can be serious in pregnancy. Do not wait. Call 999 or go to the nearest facility with emergency obstetric care now, and tell them you are pregnant.</p>
          <div className="mt-4 grid sm:grid-cols-3 gap-2">
            <a href="tel:999" className="btn-danger"><Phone className="h-4 w-4" aria-hidden /> Call 999</a>
            {ec ? <a href={`tel:${ec.phone.replace(/\s/g, "")}`} className="btn-secondary"><Users className="h-4 w-4" aria-hidden /> Call {ec.name.split(" ")[0]}</a> : <Link href="/settings" className="btn-secondary"><Users className="h-4 w-4" aria-hidden /> Add emergency contact</Link>}
            <Link href="/emergency" className="btn-secondary"><Building2 className="h-4 w-4" aria-hidden /> Nearby facilities</Link>
          </div>
        </div>
      )}
      {!urgent && selected.length > 0 && (
        <Alert tone="warn" title="Worth discussing soon">The signs you selected are not on the urgent list, but they are worth discussing with your healthcare professional soon — sooner if they get worse. If you also develop any of the urgent signs, seek care immediately.</Alert>
      )}

      <Card title="Checklist" subtitle="Possible warning signs during pregnancy">
        <ul className="grid md:grid-cols-2 gap-2">
          {DANGER_SIGNS.map((d) => (
            <li key={d.id}>
              <label className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer ${selected.includes(d.id) ? (d.urgent ? "border-red-400 bg-red-50" : "border-amber-300 bg-amber-50") : "border-slate-200 hover:border-slate-300"}`}>
                <input type="checkbox" className="mt-1 h-5 w-5 accent-red-600" checked={selected.includes(d.id)} onChange={() => toggle(d.id)} />
                <div>
                  <p className="font-medium text-slate-900">{d.label}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{d.info}</p>
                  {d.urgent && <span className="text-[11px] font-bold uppercase text-red-700">Urgent</span>}
                </div>
              </label>
            </li>
          ))}
        </ul>
        {selected.length > 0 && <button onClick={() => setSelected([])} className="btn-ghost mt-3 text-sm">Clear selection</button>}
      </Card>

      <Alert tone="info">
        <span className="inline-flex items-start gap-2"><Info className="h-4 w-4 mt-0.5 shrink-0" aria-hidden /> Materna AI does not attempt to diagnose the cause of a danger sign. When in doubt, seek professional care. In Bangladesh, the national emergency number is <strong>999</strong>.</span>
      </Alert>
    </div>
  );
}
