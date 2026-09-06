"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Loader2, User } from "lucide-react";
import { api, useApi } from "@/lib/use-api";
import { Card, PageHeader, Alert, Badge } from "@/components/ui";

interface Msg { role: "user" | "assistant"; content: string; mode?: string }

const SUGGESTIONS = ["How is my blood pressure trend?", "What should I expect this week?", "What do my documents contain?", "When is my next appointment?", "What are the danger signs?", "I have been sleeping badly"];

export default function AssistantPage() {
  const info = useApi<{ mode: "llm" | "prototype"; disclaimer: string }>("/api/assistant");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setError(null);
    setInput("");
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next);
    setBusy(true);
    try {
      const r = await api<{ answer: string; mode: string }>("/api/assistant", { method: "POST", json: { message: q, history: msgs.map(({ role, content }) => ({ role, content })) } });
      setMsgs([...next, { role: "assistant", content: r.answer, mode: r.mode }]);
    } catch (e) {
      setError((e as Error).message);
      setMsgs(msgs);
      setInput(q);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Materna AI Assistant" subtitle="General pregnancy-health information using your pregnancy week, stored readings, documents and guidance." action={info.data && <Badge tone={info.data.mode === "llm" ? "brand" : "demo"}>{info.data.mode === "llm" ? "LLM-backed mode" : "Prototype rule-based mode"}</Badge>} />

      <Alert tone="warn" title="Medical disclaimer">{info.data?.disclaimer ?? "Materna AI Assistant provides general information only. It does not diagnose, prescribe, or replace your healthcare professional. If you are experiencing an emergency or danger sign, seek urgent medical care or call 999."}</Alert>

      <Card className="!p-0 overflow-hidden">
        <div className="h-[52vh] min-h-[320px] overflow-y-auto p-4 space-y-3 bg-slate-50">
          {msgs.length === 0 && (
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center"><Bot className="h-6 w-6" aria-hidden /></div>
              <p className="mt-3 font-semibold text-slate-900">Ask me about your pregnancy information</p>
              <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">I answer using what you have recorded. I never diagnose or prescribe. {info.data?.mode === "prototype" && "This prototype runs on transparent rules — no external AI service is connected."}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm hover:border-brand-400">{s}</button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0"><Bot className="h-4 w-4" aria-hidden /></div>}
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
                {m.content}
                {m.role === "assistant" && <p className="mt-2 text-[11px] text-slate-500">{m.mode === "llm" ? "LLM-backed answer" : "Prototype rule-based answer"} · general information, not medical advice</p>}
              </div>
              {m.role === "user" && <div className="h-8 w-8 rounded-full bg-slate-300 text-white flex items-center justify-center shrink-0"><User className="h-4 w-4" aria-hidden /></div>}
            </div>
          ))}
          {busy && <div className="flex gap-2"><div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center"><Bot className="h-4 w-4" aria-hidden /></div><div className="rounded-2xl bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-500 inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Thinking…</div></div>}
          {error && <Alert tone="danger">{error}</Alert>}
          <div ref={bottom} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 p-3 border-t border-slate-200 bg-white">
          <input aria-label="Your question" className="input flex-1" placeholder="Ask a question…" value={input} onChange={(e) => setInput(e.target.value)} maxLength={1500} disabled={busy} />
          <button type="submit" className="btn-primary !px-4" disabled={busy || !input.trim()} aria-label="Send"><Send className="h-5 w-5" aria-hidden /></button>
        </form>
      </Card>
      <p className="text-xs text-slate-500">If you are experiencing an emergency or danger sign, seek urgent medical care or call 999.</p>
    </div>
  );
}
