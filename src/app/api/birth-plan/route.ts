import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, ok, parseBody, withErrors } from "@/lib/api-helpers";
import { BIRTH_PLAN_ITEMS } from "@/lib/birth-plan-items";

export const GET = withErrors(async () => {
  const { user, response } = await requireUser();
  if (!user) return response;
  let items = await prisma.birthPlanItem.findMany({ where: { userId: user.id }, orderBy: { order: "asc" } });
  if (items.length === 0) {
    await prisma.birthPlanItem.createMany({ data: BIRTH_PLAN_ITEMS.map((i, idx) => ({ userId: user.id, key: i.key, label: i.label, order: idx })) });
    items = await prisma.birthPlanItem.findMany({ where: { userId: user.id }, orderBy: { order: "asc" } });
  }
  const hints = Object.fromEntries(BIRTH_PLAN_ITEMS.map((i) => [i.key, i.hint]));
  return ok(items.map((i) => ({ ...i, hint: hints[i.key] ?? "" })));
});

const schema = z.object({ key: z.string(), done: z.boolean() });

export const PATCH = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const r = await prisma.birthPlanItem.updateMany({ where: { userId: user.id, key: data.key }, data: { done: data.done } });
  if (r.count === 0) return fail("Item not found", 404);
  return ok({ ok: true });
});
