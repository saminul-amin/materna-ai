import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, ok, parseBody, withErrors } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  relation: z.string().trim().min(1).max(40),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  shareAppointments: z.boolean().default(true),
  shareReminders: z.boolean().default(true),
  shareEmergency: z.boolean().default(true),
  shareBirthPlan: z.boolean().default(true),
  shareHealthData: z.boolean().default(false),
});

export const GET = withErrors(async () => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const items = await prisma.familyMember.findMany({ where: { userId: user.id } });
  return ok(items);
});

export const POST = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const item = await prisma.familyMember.create({ data: { userId: user.id, ...data, phone: data.phone || null } });
  return ok(item, { status: 201 });
});

export const PATCH = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { data, error } = await parseBody(req, schema.partial().extend({ id: z.string() }));
  if (error) return error;
  const { id, ...rest } = data;
  const r = await prisma.familyMember.updateMany({ where: { id, userId: user.id }, data: { ...rest, phone: rest.phone === "" ? null : rest.phone } });
  if (r.count === 0) return fail("Not found", 404);
  return ok({ ok: true });
});

export const DELETE = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("Missing id");
  const r = await prisma.familyMember.deleteMany({ where: { id, userId: user.id } });
  if (r.count === 0) return fail("Not found", 404);
  return ok({ ok: true });
});
