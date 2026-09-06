import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, ok, parseBody, withErrors } from "@/lib/api-helpers";
import { analyzeAll } from "@/lib/trend-engine";
import { generateDoctorQuestion } from "@/lib/ask-doctor";
import { getPregnancyContext } from "@/lib/pregnancy";

export const GET = withErrors(async () => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const items = await prisma.doctorQuestion.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return ok(items);
});

/** Generate a suggested question from a current observation (does not save). */
const genSchema = z.object({ metric: z.string() });
export const PUT = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { data, error } = await parseBody(req, genSchema);
  if (error) return error;
  const [ctx, measurements] = await Promise.all([getPregnancyContext(user.id), prisma.healthMeasurement.findMany({ where: { userId: user.id }, orderBy: { recordedAt: "asc" } })]);
  const obs = analyzeAll(measurements).find((o) => o.metric === data.metric);
  if (!obs) return fail("No observation available for that metric yet.", 404);
  return ok({ question: generateDoctorQuestion(obs, ctx?.week ?? 0), observation: obs });
});

const saveSchema = z.object({ metric: z.string().optional(), question: z.string().trim().min(5).max(1000) });
export const POST = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { data, error } = await parseBody(req, saveSchema);
  if (error) return error;
  const item = await prisma.doctorQuestion.create({ data: { userId: user.id, metric: data.metric ?? null, question: data.question, status: "draft" } });
  return ok(item, { status: 201 });
});

const patchSchema = z.object({ id: z.string(), status: z.enum(["draft", "asked", "answered"]).optional(), question: z.string().trim().min(5).max(1000).optional() });
export const PATCH = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { data, error } = await parseBody(req, patchSchema);
  if (error) return error;
  const r = await prisma.doctorQuestion.updateMany({ where: { id: data.id, userId: user.id }, data: { status: data.status, question: data.question } });
  if (r.count === 0) return fail("Not found", 404);
  return ok({ ok: true });
});

export const DELETE = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("Missing id");
  const r = await prisma.doctorQuestion.deleteMany({ where: { id, userId: user.id } });
  if (r.count === 0) return fail("Not found", 404);
  return ok({ ok: true });
});
