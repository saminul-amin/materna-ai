import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, ok, parseBody, withErrors } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ status: z.enum(["scheduled", "completed", "cancelled"]) });

export const PATCH = withErrors(async (req: Request, ctx: Ctx) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await ctx.params;
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const r = await prisma.appointment.updateMany({ where: { id, userId: user.id }, data: { status: data.status } });
  if (r.count === 0) return fail("Not found", 404);
  return ok({ ok: true });
});

export const DELETE = withErrors(async (_req: Request, ctx: Ctx) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await ctx.params;
  const r = await prisma.appointment.deleteMany({ where: { id, userId: user.id } });
  if (r.count === 0) return fail("Not found", 404);
  return ok({ ok: true });
});
