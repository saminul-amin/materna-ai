import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, ok, withErrors } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

/** Streams the stored file (owner only). Demo documents return their synthetic text. */
export const GET = withErrors(async (_req: Request, ctx: Ctx) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await ctx.params;
  const doc = await prisma.medicalDocument.findFirst({ where: { id, userId: user.id } });
  if (!doc) return fail("Document not found", 404);
  if (doc.isDemo) {
    return new NextResponse(doc.demoText ?? "", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  if (!doc.storagePath) return fail("File not available", 404);
  try {
    const data = await fs.readFile(doc.storagePath);
    return new NextResponse(data, {
      headers: { "Content-Type": doc.mimeType || "application/octet-stream", "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName || "document")}"` },
    });
  } catch {
    return fail("Stored file could not be read", 500);
  }
});

export const DELETE = withErrors(async (_req: Request, ctx: Ctx) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await ctx.params;
  const doc = await prisma.medicalDocument.findFirst({ where: { id, userId: user.id } });
  if (!doc) return fail("Document not found", 404);
  if (doc.storagePath) await fs.rm(doc.storagePath, { force: true }).catch(() => undefined);
  await prisma.medicalDocument.delete({ where: { id } });
  return ok({ ok: true });
});
