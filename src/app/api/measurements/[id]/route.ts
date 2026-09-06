import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, ok, parseBody, withErrors } from "@/lib/api-helpers";
import { measurementSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withErrors(async (req: Request, ctx: Ctx) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await ctx.params;
  const existing = await prisma.healthMeasurement.findFirst({ where: { id, userId: user.id } });
  if (!existing) return fail("Measurement not found", 404);
  const { data, error } = await parseBody(req, measurementSchema);
  if (error) return error;
  const item = await prisma.healthMeasurement.update({
    where: { id },
    data: {
      type: data.type,
      systolic: data.type === "bp" ? data.systolic : null,
      diastolic: data.type === "bp" ? data.diastolic : null,
      value: data.type === "bp" ? null : data.value,
      recordedAt: new Date(data.recordedAt),
      note: data.note || null,
    },
  });
  return ok(item);
});

export const DELETE = withErrors(async (_req: Request, ctx: Ctx) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await ctx.params;
  const r = await prisma.healthMeasurement.deleteMany({ where: { id, userId: user.id } });
  if (r.count === 0) return fail("Measurement not found", 404);
  return ok({ ok: true });
});
