/**
 * Medical document intelligence (prototype).
 *
 * - For synthetic demo documents: a clearly labelled DEMO extraction returns predefined fields.
 * - For uploaded PDFs: visible text is extracted with pdf-parse (no OCR) and simple patterns are
 *   detected. Nothing is invented — if a pattern is not found, no field is produced.
 * - For images: OCR is not available in this environment; the document is stored and marked
 *   "unavailable" so the user can still keep it in the vault.
 */
import fs from "node:fs/promises";

export interface ExtractedField {
  id: string;
  label: string;
  value: string;
  /** Machine-readable mapping to a health measurement, if any. */
  measurement?: { type: "bp" | "weight" | "glucose" | "heart_rate" | "temperature" | "hemoglobin"; systolic?: number; diastolic?: number; value?: number; unit: string };
  date?: string; // ISO
  category: "test" | "measurement" | "prescription" | "note" | "meta";
}

export interface ExtractionResult {
  method: "demo" | "pdf_text" | "unavailable";
  rawText: string | null;
  fields: ExtractedField[];
  note: string;
}

const DEMO_FIELDS: Record<string, (date: Date) => ExtractedField[]> = {
  cbc: (date) => [
    { id: "test", label: "Test name", value: "Complete Blood Count", category: "meta", date: date.toISOString() },
    { id: "hb", label: "Haemoglobin (Hb)", value: "10.4 g/dL", category: "test", date: date.toISOString(), measurement: { type: "hemoglobin", value: 10.4, unit: "g/dL" } },
    { id: "hct", label: "Haematocrit", value: "32 %", category: "test", date: date.toISOString() },
    { id: "plt", label: "Platelets", value: "210 x10^9/L", category: "test", date: date.toISOString() },
    { id: "bg", label: "Blood group", value: "B Positive", category: "meta" },
    { id: "rem", label: "Doctor notes", value: "Please review with treating physician.", category: "note" },
  ],
  rx: (date) => [
    { id: "bp", label: "Blood pressure at visit", value: "118/76 mmHg", category: "measurement", date: date.toISOString(), measurement: { type: "bp", systolic: 118, diastolic: 76, unit: "mmHg" } },
    { id: "wt", label: "Weight at visit", value: "63.5 kg", category: "measurement", date: date.toISOString(), measurement: { type: "weight", value: 63.5, unit: "kg" } },
    { id: "rx1", label: "Prescription item 1", value: "Iron + Folic acid — 1 tablet daily after meals", category: "prescription" },
    { id: "rx2", label: "Prescription item 2", value: "Calcium 500 mg — 1 tablet twice daily", category: "prescription" },
    { id: "adv", label: "Doctor advice", value: "Continue routine antenatal visits. Next visit in 4 weeks. Report immediately if severe headache, visual disturbance, or reduced fetal movement.", category: "note" },
  ],
  ogtt: (date) => [
    { id: "test", label: "Test name", value: "75 g Oral Glucose Tolerance Test", category: "meta", date: date.toISOString() },
    { id: "fast", label: "Fasting glucose", value: "4.7 mmol/L", category: "test", date: date.toISOString(), measurement: { type: "glucose", value: 4.7, unit: "mmol/L" } },
    { id: "h1", label: "1-hour glucose", value: "8.1 mmol/L", category: "test", date: date.toISOString() },
    { id: "h2", label: "2-hour glucose", value: "6.9 mmol/L", category: "test", date: date.toISOString() },
    { id: "rem", label: "Doctor notes", value: "For interpretation by treating physician.", category: "note" },
  ],
  usg: (date) => [
    { id: "test", label: "Scan", value: "Anomaly scan (mid-pregnancy ultrasound)", category: "meta", date: date.toISOString() },
    { id: "fhr", label: "Fetal heart rate", value: "148 bpm", category: "test", date: date.toISOString() },
    { id: "plac", label: "Placenta", value: "Posterior, upper segment", category: "test" },
    { id: "fluid", label: "Amniotic fluid", value: "Normal volume", category: "test" },
    { id: "rem", label: "Doctor notes", value: "For interpretation by treating physician.", category: "note" },
  ],
};

export function demoExtraction(demoKey: string, date: Date, rawText: string | null): ExtractionResult {
  const gen = DEMO_FIELDS[demoKey];
  return {
    method: "demo",
    rawText,
    fields: gen ? gen(date) : [],
    note: "DEMO DATA — extraction for this synthetic document uses a predefined demo mapping, not real OCR.",
  };
}

/** Simple, conservative pattern detection on real extracted text. Produces fields only for clear matches. */
export function detectFields(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const dateMatch = text.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/);
  let iso: string | undefined;
  if (dateMatch) {
    const parts = dateMatch[1].split(/[\/-]/).map(Number);
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const year = y < 100 ? 2000 + y : y;
      const dt = new Date(year, m - 1, d);
      if (!isNaN(dt.getTime())) iso = dt.toISOString();
    }
    fields.push({ id: "date", label: "Date found in document", value: dateMatch[1], category: "meta", date: iso });
  }
  const bp = text.match(/(?:BP|blood pressure)[^\d]{0,15}(\d{2,3})\s*\/\s*(\d{2,3})/i);
  if (bp) {
    fields.push({ id: "bp", label: "Blood pressure", value: `${bp[1]}/${bp[2]} mmHg`, category: "measurement", date: iso, measurement: { type: "bp", systolic: +bp[1], diastolic: +bp[2], unit: "mmHg" } });
  }
  const hb = text.match(/(?:Hb|Haemoglobin|Hemoglobin)[^\d]{0,15}(\d{1,2}(?:\.\d)?)\s*(g\/dL|gm\/dl|g%)/i);
  if (hb) fields.push({ id: "hb", label: "Haemoglobin", value: `${hb[1]} g/dL`, category: "test", date: iso, measurement: { type: "hemoglobin", value: +hb[1], unit: "g/dL" } });
  const wt = text.match(/(?:Weight|Wt)[^\d]{0,10}(\d{2,3}(?:\.\d)?)\s*kg/i);
  if (wt) fields.push({ id: "wt", label: "Weight", value: `${wt[1]} kg`, category: "measurement", date: iso, measurement: { type: "weight", value: +wt[1], unit: "kg" } });
  const glu = text.match(/(?:Fasting|Glucose|FBS)[^\d]{0,20}(\d{1,2}(?:\.\d)?)\s*mmol/i);
  if (glu) fields.push({ id: "glu", label: "Glucose", value: `${glu[1]} mmol/L`, category: "test", date: iso, measurement: { type: "glucose", value: +glu[1], unit: "mmol/L" } });
  const rx = text.match(/(?:Rx|Prescription)[:\s]+([^\n]{5,120})/i);
  if (rx) fields.push({ id: "rx", label: "Prescription line", value: rx[1].trim(), category: "prescription" });
  return fields;
}

export async function extractFromFile(storagePath: string, mimeType: string | null): Promise<ExtractionResult> {
  if (mimeType === "application/pdf") {
    try {
      const buf = await fs.readFile(storagePath);
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (b: Buffer) => Promise<{ text: string }>;
      const parsed = await pdfParse(buf);
      const text = (parsed.text || "").trim();
      if (!text) {
        return { method: "unavailable", rawText: null, fields: [], note: "No selectable text found in this PDF (it may be a scanned image). OCR is not available in this prototype environment." };
      }
      return { method: "pdf_text", rawText: text.slice(0, 8000), fields: detectFields(text), note: "Visible text extracted from the PDF. Only clearly matching patterns are shown; nothing is inferred." };
    } catch (e) {
      return { method: "unavailable", rawText: null, fields: [], note: `PDF text extraction failed: ${(e as Error).message}` };
    }
  }
  if (mimeType === "text/plain") {
    const text = (await fs.readFile(storagePath, "utf8")).trim();
    return { method: "pdf_text", rawText: text.slice(0, 8000), fields: detectFields(text), note: "Text file read directly. Only clearly matching patterns are shown." };
  }
  return { method: "unavailable", rawText: null, fields: [], note: "OCR for images is not available in this prototype environment. The document is stored safely in your vault; you can add its values manually in Health Monitoring." };
}
