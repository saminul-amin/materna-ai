import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, withErrors } from "@/lib/api-helpers";
import { getPregnancyContext } from "@/lib/pregnancy";
import { analyzeAll } from "@/lib/trend-engine";
import { guideForWeek } from "@/lib/guide-data";

export const GET = withErrors(async () => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const now = new Date();
  const [ctx, measurements, appointments, reminders, notifications, docsCount, wellbeing] = await Promise.all([
    getPregnancyContext(user.id),
    prisma.healthMeasurement.findMany({ where: { userId: user.id }, orderBy: { recordedAt: "asc" } }),
    prisma.appointment.findMany({ where: { userId: user.id, status: "scheduled", scheduledAt: { gte: new Date(now.getTime() - 3600_000) } }, orderBy: { scheduledAt: "asc" }, take: 3 }),
    prisma.reminder.findMany({ where: { userId: user.id, active: true }, orderBy: { time: "asc" } }),
    prisma.notification.findMany({ where: { userId: user.id, read: false }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.medicalDocument.count({ where: { userId: user.id } }),
    prisma.mentalWellbeing.findMany({ where: { userId: user.id }, orderBy: { recordedAt: "desc" }, take: 1 }),
  ]);

  const latest = (type: string) => [...measurements].reverse().find((m) => m.type === type) ?? null;
  const observations = analyzeAll(measurements);
  const week = ctx?.week ?? null;

  // Next reminder relative to the current time of day
  const hhmm = now.toTimeString().slice(0, 5);
  const nextReminder = reminders.find((r) => r.time >= hhmm) ?? reminders[0] ?? null;

  return ok({
    user: { name: user.name, isDemo: user.isDemo, plan: user.plan },
    pregnancy: ctx ? { week: ctx.week, trimester: ctx.trimester, daysToEdd: ctx.daysToEdd, edd: ctx.profile.expectedDeliveryDate } : null,
    latest: { bp: latest("bp"), weight: latest("weight"), heart_rate: latest("heart_rate"), glucose: latest("glucose"), temperature: latest("temperature") },
    bpSeries: measurements.filter((m) => m.type === "bp").map((m) => ({ date: m.recordedAt, systolic: m.systolic, diastolic: m.diastolic })),
    weightSeries: measurements.filter((m) => m.type === "weight").map((m) => ({ date: m.recordedAt, value: m.value })),
    measurementCount: measurements.length,
    observations,
    topObservation: observations[0] ?? null,
    nextAppointment: appointments[0] ?? null,
    upcomingAppointments: appointments,
    nextReminder,
    reminderCount: reminders.length,
    notifications,
    documentCount: docsCount,
    guide: week ? guideForWeek(week) : null,
    latestWellbeing: wellbeing[0] ?? null,
  });
});
