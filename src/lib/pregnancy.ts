import { prisma } from "./db";
import { gestationalWeekFromEdd, daysPregnantFromEdd, trimesterOf } from "./utils";

export async function getPregnancyContext(userId: string) {
  const profile = await prisma.pregnancyProfile.findUnique({ where: { userId } });
  if (!profile) return null;
  const week = gestationalWeekFromEdd(profile.expectedDeliveryDate);
  const days = daysPregnantFromEdd(profile.expectedDeliveryDate);
  return {
    profile,
    week,
    dayOfWeek: days % 7,
    trimester: trimesterOf(week),
    daysToEdd: Math.max(0, 280 - days),
  };
}
