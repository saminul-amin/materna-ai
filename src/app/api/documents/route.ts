import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, ok, withErrors } from "@/lib/api-helpers";

const ALLOWED = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain"]);
const MAX_BYTES = 8 * 1024 * 1024;
const DOC_TYPES = new Set(["lab_report", "prescription", "ultrasound", "other"]);

export const GET = withErrors(async () => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const docs = await prisma.medicalDocument.findMany({
    where: { userId: user.id },
    orderBy: { uploadedAt: "desc" },
    include: { extracted: true },
  });
  return ok(
    docs.map((d) => ({
      ...d,
      extracted: d.extracted ? { ...d.extracted, fields: JSON.parse(d.extracted.fieldsJson) } : null,
    }))
  );
});

export const POST = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Expected a multipart form upload.", 400);
  }
  const file = form.get("file");
  const title = String(form.get("title") || "").trim();
  const docType = String(form.get("docType") || "other");
  const documentDate = String(form.get("documentDate") || "");
  if (!(file instanceof File)) return fail("Please choose a file to upload.", 422);
  if (!title) return fail("Please give the document a title.", 422);
  if (!DOC_TYPES.has(docType)) return fail("Unknown document type.", 422);
  if (!ALLOWED.has(file.type)) return fail("Unsupported file type. Please upload a PDF, PNG, JPG, WEBP or TXT file.", 422);
  if (file.size > MAX_BYTES) return fail("File is larger than 8 MB.", 422);

  const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const storedName = `${user.id}_${Date.now()}_${safeName}`;
  const storagePath = path.join(uploadDir, storedName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(storagePath, bytes);

  const doc = await prisma.medicalDocument.create({
    data: {
      userId: user.id,
      title,
      docType,
      fileName: file.name,
      mimeType: file.type,
      storagePath,
      sizeBytes: file.size,
      documentDate: documentDate ? new Date(documentDate) : null,
      extractionStatus: "pending",
    },
  });
  return ok(doc, { status: 201 });
});
