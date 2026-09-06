import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, withErrors } from "@/lib/api-helpers";
import { analyzeAll } from "@/lib/trend-engine";
import { THRESHOLD_DISCLAIMER, BP_BANDS, METRICS } from "@/lib/thresholds";

/** Runs the transparent trend engine over all stored measurements and persists a snapshot. */
export const GET = withErrors(async () => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const measurements = await prisma.healthMeasurement.findMany({ where: { userId: user.id }, orderBy: { recordedAt: "asc" } });
  const observations = analyzeAll(measurements);

  // Persist a snapshot per metric so other features (Ask Your Doctor, dashboard) can reference it.
  await Promise.all(
    observations.map((o) =>
      prisma.aiObservation.upsert({
        where: { userId_metric: { userId: user.id, metric: o.metric } },
        update: { category: o.category, title: o.title, summary: o.summary, evidenceJson: JSON.stringify(o.evidence), dataJson: JSON.stringify(o.data), createdAt: new Date() },
        create: { userId: user.id, metric: o.metric, category: o.category, title: o.title, summary: o.summary, evidenceJson: JSON.stringify(o.evidence), dataJson: JSON.stringify(o.data) },
      })
    )
  );

  return ok({
    observations,
    bpSeries: measurements.filter((m) => m.type === "bp" && m.systolic != null && m.diastolic != null).map((m) => ({ date: m.recordedAt, systolic: m.systolic, diastolic: m.diastolic })),
    engine: {
      name: "Materna prototype trend engine v0.1",
      methods: ["personal baseline vs recent average", "3-point moving average", "linear rate of change per week", "repeated readings inside prototype bands", "deterministic safety escalation"],
      disclaimer: THRESHOLD_DISCLAIMER,
      bpBands: BP_BANDS,
      metrics: METRICS,
    },
  });
});
