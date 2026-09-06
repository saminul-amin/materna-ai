import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, withErrors } from "@/lib/api-helpers";

export const GET = withErrors(async () => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const items = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 });
  return ok(items);
});

export const PATCH = withErrors(async () => {
  const { user, response } = await requireUser();
  if (!user) return response;
  await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  return ok({ ok: true });
});
