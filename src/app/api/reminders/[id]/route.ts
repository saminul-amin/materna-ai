import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, ok, parseBody, withErrors } from "@/lib/api-helpers";
import { reminderSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withErrors(async (req: Request, ctx: Ctx) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await ctx.params;
  const { data, error } = await parseBody(req, reminderSchema.partial());
  if (error) return error;
  const r = await prisma.reminder.updateMany({ where: { id, userId: user.id }, data: { ...data, dose: data.dose === "" ? null : data.dose } });
  if (r.count === 0) return fail("Not found", 404);
  return ok({ ok: true });
});

export const DELETE = withErrors(async (_req: Request, ctx: Ctx) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await ctx.params;
  const r = await prisma.reminder.deleteMany({ where: { id, userId: user.id } });
  if (r.count === 0) return fail("Not found", 404);
  return ok({ ok: true });
});
