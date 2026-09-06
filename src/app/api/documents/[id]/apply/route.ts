import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, ok, parseBody, withErrors } from "@/lib/api-helpers";
import type { ExtractedField } from "@/lib/document-extraction";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ fieldIds: z.array(z.string()).min(1) });

/**
 * Document → Timeline: adds user-confirmed extracted measurements to the health timeline.
 * Only fields the user explicitly selected are written; haemoglobin values are stored as a note-only
 * measurement type is not supported, so they are recorded as a symptom-style note on the timeline.
 */
export const POST = withErrors(async (req: Request, ctx: Ctx) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await ctx.params;
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const doc = await prisma.medicalDocument.findFirst({ where: { id, userId: user.id }, include: { extracted: true } });
  if (!doc || !doc.extracted) return fail("Run extraction first.", 400);
  const fields = JSON.parse(doc.extracted.fieldsJson) as ExtractedField[];
  const selected = fields.filter((f) => data.fieldIds.includes(f.id) && f.measurement);
  if (selected.length === 0) return fail("None of the selected items can be added to the timeline.", 422);

  const date = (f: ExtractedField) => (f.date ? new Date(f.date) : doc.documentDate ?? doc.uploadedAt);
  let added = 0;
  for (const f of selected) {
    const m = f.measurement!;
    if (m.type === "hemoglobin") {
      await prisma.symptom.create({ data: { userId: user.id, name: `Lab: Haemoglobin ${m.value} ${m.unit}`, severity: "mild", recordedAt: date(f), note: `From document "${doc.title}"` } });
      added++;
      continue;
    }
    await prisma.healthMeasurement.create({
      data: {
        userId: user.id,
        type: m.type,
        systolic: m.systolic ?? null,
        diastolic: m.diastolic ?? null,
        value: m.value ?? null,
        unit: m.unit,
        recordedAt: date(f),
        note: `From document "${doc.title}"`,
        source: "document",
      },
    });
    added++;
  }
  return ok({ added });
});
