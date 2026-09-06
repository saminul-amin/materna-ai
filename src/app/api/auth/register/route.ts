import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { fail, parseBody, withErrors } from "@/lib/api-helpers";
import { eddFromGestationalWeek } from "@/lib/utils";
import { BIRTH_PLAN_ITEMS } from "@/lib/birth-plan-items";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(6).max(100),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  age: z.coerce.number().int().min(13).max(60).optional(),
  status: z.enum(["pregnant", "planning", "postpartum"]).default("pregnant"),
  gestationalWeek: z.coerce.number().int().min(1).max(42).optional(),
  expectedDeliveryDate: z.string().optional().or(z.literal("")),
  gravida: z.coerce.number().int().min(1).max(20).default(1),
  para: z.coerce.number().int().min(0).max(20).default(0),
  previousHistory: z.string().max(1000).optional().or(z.literal("")),
  healthInfo: z.string().max(2000).optional().or(z.literal("")),
  emergencyName: z.string().trim().max(80).optional().or(z.literal("")),
  emergencyRelation: z.string().trim().max(40).optional().or(z.literal("")),
  emergencyPhone: z.string().trim().max(30).optional().or(z.literal("")),
});

export const POST = withErrors(async (req: Request) => {
  const { data, error } = await parseBody(req, schema);
  if (error) return error;

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) return fail("An account with this email already exists. Try logging in.", 409);

  let edd: Date;
  if (data.expectedDeliveryDate) {
    edd = new Date(data.expectedDeliveryDate);
    if (isNaN(edd.getTime())) return fail("Expected delivery date is invalid.", 422);
  } else if (data.gestationalWeek) {
    edd = eddFromGestationalWeek(data.gestationalWeek);
  } else {
    return fail("Please provide either the current gestational week or the expected delivery date.", 422);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      age: data.age ?? null,
      passwordHash,
      profile: {
        create: {
          status: data.status,
          expectedDeliveryDate: edd,
          gravida: data.gravida,
          para: data.para,
          healthInfo: data.healthInfo || null,
        },
      },
      emergencyContacts: data.emergencyName && data.emergencyPhone
        ? { create: { name: data.emergencyName, relation: data.emergencyRelation || "Family", phone: data.emergencyPhone } }
        : undefined,
      history: data.previousHistory
        ? { create: { year: new Date().getFullYear(), outcome: "other", notes: data.previousHistory } }
        : undefined,
      birthPlanItems: { create: BIRTH_PLAN_ITEMS.map((i, idx) => ({ key: i.key, label: i.label, order: idx })) },
    },
  });

  const token = await createSessionToken(user.id);
  const res = NextResponse.json({ ok: true, userId: user.id });
  setSessionCookie(res, token);
  return res;
});
