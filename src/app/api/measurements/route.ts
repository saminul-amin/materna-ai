import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, ok, parseBody, withErrors } from "@/lib/api-helpers";
import { measurementSchema } from "@/lib/schemas";

const UNITS: Record<string, string> = { bp: "mmHg", heart_rate: "bpm", weight: "kg", temperature: "°C", glucose: "mmol/L" };

export const GET = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const items = await prisma.healthMeasurement.findMany({
    where: {
      userId: user.id,
      ...(type ? { type } : {}),
      ...(from || to ? { recordedAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to + "T23:59:59") } : {}) } } : {}),
    },
    orderBy: { recordedAt: "asc" },
  });
  return ok(items);
});

export const POST = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { data, error } = await parseBody(req, measurementSchema);
  if (error) return error;
  const item = await prisma.healthMeasurement.create({
    data: {
      userId: user.id,
      type: data.type,
      systolic: data.type === "bp" ? data.systolic : null,
      diastolic: data.type === "bp" ? data.diastolic : null,
      value: data.type === "bp" ? null : data.value,
      unit: UNITS[data.type],
      recordedAt: new Date(data.recordedAt),
      note: data.note || null,
      source: "manual",
    },
  });
  if (!item) return fail("Could not save measurement", 500);
  return ok(item, { status: 201 });
});
