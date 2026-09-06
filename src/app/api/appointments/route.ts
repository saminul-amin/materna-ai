import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, ok, parseBody, withErrors } from "@/lib/api-helpers";
import { DEMO_PROVIDERS } from "@/lib/static-data";

const schema = z.object({
  kind: z.enum(["online", "offline"]),
  type: z.enum(["antenatal", "test", "vaccination", "follow_up", "consultation"]),
  providerId: z.string().optional(),
  facilityName: z.string().trim().max(120).optional().or(z.literal("")),
  date: z.string().min(1),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().max(400).optional().or(z.literal("")),
});

export const GET = withErrors(async () => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const items = await prisma.appointment.findMany({ where: { userId: user.id }, orderBy: { scheduledAt: "asc" } });
  return ok(items);
});

export const POST = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const scheduledAt = new Date(`${data.date}T${data.time}:00`);
  if (isNaN(scheduledAt.getTime())) return fail("Invalid date or time.", 422);
  if (scheduledAt.getTime() < Date.now() - 60_000) return fail("Please choose a future date and time.", 422);

  let providerName: string | null = null;
  if (data.kind === "online") {
    const p = DEMO_PROVIDERS.find((x) => x.id === data.providerId);
    if (!p) return fail("Please select a provider.", 422);
    if (!p.slots.includes(data.time)) return fail("That time is not available for this provider.", 422);
    const clash = await prisma.appointment.findFirst({ where: { userId: user.id, scheduledAt, status: "scheduled" } });
    if (clash) return fail("You already have an appointment at that time.", 409);
    providerName = `${p.name} (fictional)`;
  }
  const item = await prisma.appointment.create({
    data: {
      userId: user.id,
      kind: data.kind,
      type: data.type,
      providerName,
      facilityName: data.kind === "offline" ? data.facilityName || null : null,
      scheduledAt,
      notes: data.notes || null,
    },
  });
  await prisma.notification.create({ data: { userId: user.id, title: "Appointment booked", body: `${data.kind === "online" ? "Online consultation" : "Appointment"} on ${scheduledAt.toLocaleString("en-GB")}` } });
  return ok(item, { status: 201 });
});
