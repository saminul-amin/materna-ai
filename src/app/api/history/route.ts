import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, ok, parseBody, withErrors } from "@/lib/api-helpers";

const schema = z.object({
  year: z.coerce.number().int().min(1970).max(2100),
  outcome: z.enum(["live_birth", "miscarriage", "stillbirth", "ongoing", "other"]),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const POST = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const item = await prisma.pregnancyHistory.create({ data: { userId: user.id, year: data.year, outcome: data.outcome, notes: data.notes || null } });
  return ok(item, { status: 201 });
});

export const DELETE = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("Missing id");
  const r = await prisma.pregnancyHistory.deleteMany({ where: { id, userId: user.id } });
  if (r.count === 0) return fail("Not found", 404);
  return ok({ ok: true });
});
