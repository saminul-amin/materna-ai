import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, ok, parseBody, withErrors } from "@/lib/api-helpers";
import { getPregnancyContext } from "@/lib/pregnancy";

export const GET = withErrors(async () => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const ctx = await getPregnancyContext(user.id);
  const [history, familyMembers] = await Promise.all([
    prisma.pregnancyHistory.findMany({ where: { userId: user.id }, orderBy: { year: "desc" } }),
    prisma.familyMember.findMany({ where: { userId: user.id } }),
  ]);
  return ok({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, age: user.age, language: user.language, notificationsEnabled: user.notificationsEnabled, isDemo: user.isDemo, plan: user.plan },
    profile: ctx?.profile ?? null,
    week: ctx?.week ?? null,
    trimester: ctx?.trimester ?? null,
    daysToEdd: ctx?.daysToEdd ?? null,
    emergencyContacts: user.emergencyContacts,
    history,
    familyMembers,
  });
});

const updateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  age: z.coerce.number().int().min(13).max(60).optional().nullable(),
  language: z.enum(["en", "bn"]).optional(),
  notificationsEnabled: z.boolean().optional(),
  profile: z
    .object({
      status: z.enum(["pregnant", "planning", "postpartum"]).optional(),
      expectedDeliveryDate: z.string().optional(),
      gravida: z.coerce.number().int().min(1).max(20).optional(),
      para: z.coerce.number().int().min(0).max(20).optional(),
      healthInfo: z.string().max(2000).optional().or(z.literal("")),
      bloodGroup: z.string().max(5).optional().or(z.literal("")),
      heightCm: z.coerce.number().min(100).max(220).optional().nullable(),
      prePregnancyWeightKg: z.coerce.number().min(25).max(250).optional().nullable(),
    })
    .optional(),
  emergencyContact: z.object({ name: z.string().trim().min(1).max(80), relation: z.string().trim().max(40), phone: z.string().trim().min(3).max(30) }).optional(),
});

export const PUT = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { data, error } = await parseBody(req, updateSchema);
  if (error) return error;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      phone: data.phone === "" ? null : data.phone,
      age: data.age === undefined ? undefined : data.age,
      language: data.language,
      notificationsEnabled: data.notificationsEnabled,
    },
  });

  if (data.profile) {
    const p = data.profile;
    let edd: Date | undefined;
    if (p.expectedDeliveryDate) {
      edd = new Date(p.expectedDeliveryDate);
      if (isNaN(edd.getTime())) return fail("Expected delivery date is invalid.", 422);
    }
    await prisma.pregnancyProfile.upsert({
      where: { userId: user.id },
      update: { status: p.status, expectedDeliveryDate: edd, gravida: p.gravida, para: p.para, healthInfo: p.healthInfo === "" ? null : p.healthInfo, bloodGroup: p.bloodGroup === "" ? null : p.bloodGroup, heightCm: p.heightCm ?? undefined, prePregnancyWeightKg: p.prePregnancyWeightKg ?? undefined },
      create: { userId: user.id, status: p.status ?? "pregnant", expectedDeliveryDate: edd ?? new Date(Date.now() + 200 * 86400000), gravida: p.gravida ?? 1, para: p.para ?? 0, healthInfo: p.healthInfo || null, bloodGroup: p.bloodGroup || null, heightCm: p.heightCm ?? null, prePregnancyWeightKg: p.prePregnancyWeightKg ?? null },
    });
  }

  if (data.emergencyContact) {
    const existing = await prisma.emergencyContact.findFirst({ where: { userId: user.id, isPrimary: true } });
    if (existing) await prisma.emergencyContact.update({ where: { id: existing.id }, data: data.emergencyContact });
    else await prisma.emergencyContact.create({ data: { userId: user.id, ...data.emergencyContact, isPrimary: true } });
  }

  return ok({ ok: true });
});
