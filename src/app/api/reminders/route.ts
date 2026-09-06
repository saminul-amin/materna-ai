import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, parseBody, withErrors } from "@/lib/api-helpers";
import { reminderSchema } from "@/lib/schemas";

export const GET = withErrors(async () => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const items = await prisma.reminder.findMany({ where: { userId: user.id }, orderBy: [{ active: "desc" }, { time: "asc" }] });
  return ok(items);
});

export const POST = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { data, error } = await parseBody(req, reminderSchema);
  if (error) return error;
  const item = await prisma.reminder.create({ data: { userId: user.id, name: data.name, dose: data.dose || null, time: data.time, frequency: data.frequency, active: data.active ?? true } });
  return ok(item, { status: 201 });
});
