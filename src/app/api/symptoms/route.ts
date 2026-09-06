import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, ok, parseBody, withErrors } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().trim().min(2).max(60),
  severity: z.enum(["mild", "moderate", "severe"]).default("mild"),
  recordedAt: z.string().min(1),
  note: z.string().max(300).optional().or(z.literal("")),
});

export const GET = withErrors(async () => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const items = await prisma.symptom.findMany({ where: { userId: user.id }, orderBy: { recordedAt: "desc" } });
  return ok(items);
});

export const POST = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const d = new Date(data.recordedAt);
  if (isNaN(d.getTime())) return fail("Invalid date", 422);
  const item = await prisma.symptom.create({ data: { userId: user.id, name: data.name, severity: data.severity, recordedAt: d, note: data.note || null } });
  return ok(item, { status: 201 });
});

export const DELETE = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("Missing id");
  const r = await prisma.symptom.deleteMany({ where: { id, userId: user.id } });
  if (r.count === 0) return fail("Not found", 404);
  return ok({ ok: true });
});
