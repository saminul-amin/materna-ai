"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, FileText, ScanText, Trash2, CheckCircle2, Loader2, Eye, ArrowRight } from "lucide-react";
import { useApi, api } from "@/lib/use-api";
import { useToast } from "@/components/providers";
import { Card, PageHeader, Modal, Field, Alert, Spinner, ErrorState, EmptyState, Badge, DemoBadge, DisclaimerBanner } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { ExtractedField } from "@/lib/document-extraction";

interface Doc {
  id: string;
  title: string;
  docType: string;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  isDemo: boolean;
  documentDate: string | null;
  extractionStatus: string;
  uploadedAt: string;
  extracted: { method: string; rawText: string | null; fields: ExtractedField[]; extractedAt: string } | null;
}

const TYPE_LABEL: Record<string, string> = { lab_report: "Lab report", prescription: "Prescription", ultrasound: "Ultrasound", other: "Other" };

export default function DocumentsPage() {
  const { data, loading, error, reload } = useApi<Doc[]>("/api/documents");
  const { toast } = useToast();
  const [upload, setUpload] = useState(false);
  const [selected, setSelected] = useState<Doc | null>(null);

  async function remove(d: Doc) {
    if (!confirm(`Delete "${d.title}"?`)) return;
    try {
      await api(`/api/documents/${d.id}`, { method: "DELETE" });
      toast("Document deleted", "success");
      if (selected?.id === d.id) setSelected(null);
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Medical Document Vault" subtitle="Keep reports, prescriptions and scans together. Extract visible information, review it, and add it to your health timeline — only after you confirm." action={<button onClick={() => setUpload(true)} className="btn-primary !min-h-[40px]"><Upload className="h-4 w-4" aria-hidden /> Upload document</button>} />

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 flex flex-wrap items-center gap-2">
        <span className="font-semibold">Workflow:</span>
        <span className="inline-flex items-center gap-1">Medical report <ArrowRight className="h-3.5 w-3.5" aria-hidden /></span>
        <span className="inline-flex items-center gap-1">Extract information <ArrowRight className="h-3.5 w-3.5" aria-hidden /></span>
        <span className="inline-flex items-center gap-1">Review <ArrowRight className="h-3.5 w-3.5" aria-hidden /></span>
        <span>Add to timeline</span>
      </div>

      {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : null}

      {data && (
        <div className="grid lg:grid-cols-5 gap-4">
          <Card className="lg:col-span-2" title="Documents" subtitle={`${data.length} stored`}>
            {data.length === 0 ? (
              <EmptyState title="Your vault is empty" description="Upload a PDF, image or text file to get started." action={<button onClick={() => setUpload(true)} className="btn-primary">Upload</button>} icon={<FileText className="h-6 w-6" aria-hidden />} />
            ) : (
              <ul className="divide-y divide-slate-100 -mx-2">
                {data.map((d) => (
                  <li key={d.id}>
                    <button onClick={() => setSelected(d)} className={`w-full text-left px-2 py-3 rounded-xl hover:bg-slate-50 ${selected?.id === d.id ? "bg-brand-50" : ""}`} aria-current={selected?.id === d.id}>
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 truncate">{d.title}</p>
                          <p className="text-xs text-slate-500">{TYPE_LABEL[d.docType]} · {d.documentDate ? formatDate(d.documentDate) : formatDate(d.uploadedAt)}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {d.isDemo && <DemoBadge label="DEMO DATA" />}
                            <Badge tone={d.extractionStatus === "extracted" ? "success" : d.extractionStatus === "unavailable" ? "warn" : "neutral"}>{d.extractionStatus === "extracted" ? "Extracted" : d.extractionStatus === "unavailable" ? "OCR unavailable" : "Not extracted"}</Badge>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="lg:col-span-3">
            {selected ? (
              <DocumentDetail key={selected.id} doc={selected} onDelete={() => remove(selected)} onChanged={async () => { await reload(); }} />
            ) : (
              <Card><EmptyState title="Select a document" description="Choose a document to preview it and extract information." icon={<Eye className="h-6 w-6" aria-hidden />} /></Card>
            )}
          </div>
        </div>
      )}

      <DisclaimerBanner compact />
      {upload && <UploadModal onClose={() => setUpload(false)} onSaved={() => { setUpload(false); reload(); }} />}
    </div>
  );
}

function DocumentDetail({ doc, onDelete, onChanged }: { doc: Doc; onDelete: () => void; onChanged: () => Promise<void> }) {
  const { toast } = useToast();
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<{ method: string; rawText: string | null; fields: ExtractedField[]; note: string } | null>(doc.extracted ? { ...doc.extracted, note: "" } : null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<number | null>(null);
  const preview = useApi<string>(null);
  void preview;
  const [text, setText] = useState<string | null>(null);
  const [showText, setShowText] = useState(false);

  async function loadText() {
    if (text !== null) return setShowText((s) => !s);
    const res = await fetch(`/api/documents/${doc.id}`);
    if (doc.isDemo || doc.mimeType === "text/plain") setText(await res.text());
    else setText("");
    setShowText(true);
  }

  async function extract() {
    setExtracting(true);
    setApplied(null);
    try {
      const r = await api<{ method: string; rawText: string | null; fields: ExtractedField[]; note: string }>(`/api/documents/${doc.id}/extract`, { method: "POST" });
      setResult(r);
      setChosen([]);
      toast(r.method === "unavailable" ? "Extraction not available for this file" : "Information extracted — please review", r.method === "unavailable" ? "info" : "success");
      await onChanged();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setExtracting(false);
    }
  }

  async function apply() {
    setApplying(true);
    try {
      const r = await api<{ added: number }>(`/api/documents/${doc.id}/apply`, { method: "POST", json: { fieldIds: chosen } });
      setApplied(r.added);
      setChosen([]);
      toast(`${r.added} item${r.added === 1 ? "" : "s"} added to your health timeline`, "success");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setApplying(false);
    }
  }

  const addable = result?.fields.filter((f) => f.measurement) ?? [];

  return (
    <div className="space-y-4">
      <Card title={doc.title} subtitle={`${TYPE_LABEL[doc.docType]} · ${doc.documentDate ? formatDate(doc.documentDate) : "date not set"}${doc.fileName ? ` · ${doc.fileName}` : ""}${doc.sizeBytes ? ` · ${(doc.sizeBytes / 1024).toFixed(0)} KB` : ""}`} action={<button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-50 text-red-600" aria-label="Delete document"><Trash2 className="h-4 w-4" /></button>}>
        {doc.isDemo && <Alert tone="info" className="mb-3"><strong>DEMO DATA.</strong> This is a synthetic document created for demonstration. It is not a real report or a real patient.</Alert>}
        <div className="flex flex-wrap gap-2">
          {(doc.isDemo || doc.mimeType === "text/plain") ? (
            <button onClick={loadText} className="btn-secondary !min-h-[40px] text-sm"><Eye className="h-4 w-4" aria-hidden /> {showText ? "Hide" : "Preview"} document</button>
          ) : (
            <a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer" className="btn-secondary !min-h-[40px] text-sm"><Eye className="h-4 w-4" aria-hidden /> Open file</a>
          )}
          <button onClick={extract} className="btn-primary !min-h-[40px] text-sm" disabled={extracting}>
            {extracting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ScanText className="h-4 w-4" aria-hidden />} {result ? "Re-extract" : "Extract information"}
          </button>
        </div>
        {showText && text !== null && (
          <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 max-h-64 overflow-auto">{text || "Preview not available for this file type. Use Open file."}</pre>
        )}
      </Card>

      {result && (
        <Card title="Extracted information" subtitle={result.method === "demo" ? "Demo extraction mode (predefined mapping — not real OCR)" : result.method === "pdf_text" ? "Text extraction from file (no OCR); only clear pattern matches are shown" : "Extraction unavailable"}>
          {result.method === "demo" && <Badge tone="demo" className="mb-3">DEMO EXTRACTION</Badge>}
          {result.note && <p className="text-sm text-slate-600 mb-3">{result.note}</p>}
          {result.fields.length === 0 ? (
            <Alert tone="warn">No structured information could be identified. The document is safely stored; you can add values manually in Health Monitoring.</Alert>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200"><th className="py-2 pr-2">Add</th><th className="py-2 pr-2">Item</th><th className="py-2 pr-2">Value</th><th className="py-2 pr-2">Date</th><th className="py-2">Category</th></tr></thead>
                <tbody>
                  {result.fields.map((f) => (
                    <tr key={f.id} className="border-b border-slate-100">
                      <td className="py-2 pr-2">{f.measurement ? <input type="checkbox" aria-label={`Select ${f.label}`} checked={chosen.includes(f.id)} onChange={(e) => setChosen(e.target.checked ? [...chosen, f.id] : chosen.filter((x) => x !== f.id))} className="h-5 w-5 accent-brand-600" /> : <span className="text-slate-300">—</span>}</td>
                      <td className="py-2 pr-2 font-medium text-slate-900">{f.label}</td>
                      <td className="py-2 pr-2 text-slate-800">{f.value}</td>
                      <td className="py-2 pr-2 text-slate-600 whitespace-nowrap">{f.date ? formatDate(f.date) : "—"}</td>
                      <td className="py-2"><Badge tone="neutral">{f.category}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {addable.length > 0 && (
            <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-3">
              <p className="text-sm text-brand-900 font-medium">Review the ticked items. Only what you confirm will be added to your health timeline.</p>
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                <button onClick={apply} disabled={chosen.length === 0 || applying} className="btn-primary !min-h-[40px] text-sm">
                  {applying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />} Confirm &amp; add {chosen.length > 0 ? `${chosen.length} item${chosen.length === 1 ? "" : "s"}` : ""} to timeline
                </button>
                {applied !== null && <Link href="/monitoring" className="text-sm font-semibold text-brand-700 underline">View timeline ({applied} added)</Link>}
              </div>
            </div>
          )}
          {result.rawText && (
            <details className="mt-3">
              <summary className="text-sm font-medium text-slate-700 cursor-pointer">Show extracted text</summary>
              <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 max-h-64 overflow-auto">{result.rawText}</pre>
            </details>
          )}
        </Card>
      )}
    </div>
  );
}

function UploadModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("lab_report");
  const [date, setDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) return setError("Please choose a file.");
    if (!title.trim()) return setError("Please give the document a title.");
    setSaving(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title);
    fd.append("docType", docType);
    fd.append("documentDate", date);
    try {
      const res = await fetch("/api/documents", { method: "POST", body: fd });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Upload failed");
      toast("Document uploaded", "success");
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Upload a document">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Title" htmlFor="dtitle"><input id="dtitle" className="input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Blood test report, 20 weeks" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type" htmlFor="dtype">
            <select id="dtype" className="input" value={docType} onChange={(e) => setDocType(e.target.value)}>
              <option value="lab_report">Lab / test report</option><option value="prescription">Prescription</option><option value="ultrasound">Ultrasound / scan</option><option value="other">Other</option>
            </select>
          </Field>
          <Field label="Document date" htmlFor="ddate"><input id="ddate" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        </div>
        <Field label="File" htmlFor="dfile" hint="PDF, PNG, JPG, WEBP or TXT · up to 8 MB. PDFs with selectable text can be extracted; images are stored (OCR not available in this prototype).">
          <input id="dfile" type="file" accept="application/pdf,image/png,image/jpeg,image/webp,text/plain" className="input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Field>
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Upload</button>
        </div>
      </form>
    </Modal>
  );
}
