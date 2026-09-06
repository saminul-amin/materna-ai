import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, ok, withErrors } from "@/lib/api-helpers";
import { demoExtraction, extractFromFile } from "@/lib/document-extraction";

type Ctx = { params: Promise<{ id: string }> };

/** Runs (or re-runs) extraction for a document and stores the result for review. */
export const POST = withErrors(async (_req: Request, ctx: Ctx) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await ctx.params;
  const doc = await prisma.medicalDocument.findFirst({ where: { id, userId: user.id } });
  if (!doc) return fail("Document not found", 404);

  const result = doc.isDemo
    ? demoExtraction(doc.demoKey || "", doc.documentDate ?? doc.uploadedAt, doc.demoText)
    : doc.storagePath
      ? await extractFromFile(doc.storagePath, doc.mimeType)
      : { method: "unavailable" as const, rawText: null, fields: [], note: "No stored file." };

  const status = result.method === "unavailable" ? "unavailable" : "extracted";
  await prisma.$transaction([
    prisma.extractedDocumentData.upsert({
      where: { documentId: doc.id },
      update: { method: result.method, rawText: result.rawText, fieldsJson: JSON.stringify(result.fields), extractedAt: new Date() },
      create: { documentId: doc.id, method: result.method, rawText: result.rawText, fieldsJson: JSON.stringify(result.fields) },
    }),
    prisma.medicalDocument.update({ where: { id: doc.id }, data: { extractionStatus: status } }),
  ]);
  return ok({ ...result, status });
});
