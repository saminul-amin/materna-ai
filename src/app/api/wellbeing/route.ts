import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, ok, parseBody, withErrors } from "@/lib/api-helpers";
import { wellbeingPattern } from "@/lib/wellbeing";

const schema = z.object({
  mood: z.coerce.number().int().min(1).max(5),
  stress: z.coerce.number().int().min(1).max(5),
  sleep: z.coerce.number().int().min(1).max(5),
  note: z.string().max(300).optional().or(z.literal("")),
});

export const GET = withErrors(async () => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const items = await prisma.mentalWellbeing.findMany({ where: { userId: user.id }, orderBy: { recordedAt: "asc" } });
  return ok({ items, pattern: wellbeingPattern(items) });
});

export const POST = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const item = await prisma.mentalWellbeing.create({ data: { userId: user.id, mood: data.mood, stress: data.stress, sleep: data.sleep, note: data.note || null, recordedAt: new Date() } });
  return ok(item, { status: 201 });
});

export const DELETE = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("Missing id");
  const r = await prisma.mentalWellbeing.deleteMany({ where: { id, userId: user.id } });
  if (r.count === 0) return fail("Not found", 404);
  return ok({ ok: true });
});
