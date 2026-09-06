/**
 * Materna AI — Transparent prototype trend-analysis engine.
 *
 * This is deliberately NOT a black-box model. It combines:
 *  - personal baseline vs recent comparison
 *  - moving averages
 *  - rate of change (linear regression slope per week)
 *  - repeated readings inside configurable prototype bands
 *  - deterministic safety escalation
 *
 * Every observation carries the evidence and data used so it can be explained
 * on the "Why am I seeing this?" page. It never produces a diagnosis.
 *
 * PROTOTYPE / DEMO LOGIC — NOT FOR CLINICAL USE.
 */
import { BP_BANDS, METRICS, WEIGHT_RAPID_CHANGE_KG_PER_WEEK, type MetricType } from "./thresholds";

export type TrendCategory = "stable" | "increasing" | "decreasing" | "needs_attention" | "urgent_attention" | "insufficient_data";
export type Confidence = "low" | "moderate" | "high";

export interface Reading {
  id?: string;
  recordedAt: Date;
  systolic?: number | null;
  diastolic?: number | null;
  value?: number | null;
}

export interface SeriesStats {
  count: number;
  from: string;
  to: string;
  baselineValues: number[];
  recentValues: number[];
  baselineAvg: number;
  recentAvg: number;
  movingAvg: number[]; // 3-point moving average of the whole series
  slopePerWeek: number;
  changeAbs: number;
  changePct: number;
  direction: "up" | "down" | "flat";
  consecutiveAttention: number;
  maxValue: number;
  minValue: number;
}

export interface Observation {
  metric: MetricType;
  metricLabel: string;
  unit: string;
  category: TrendCategory;
  title: string;
  summary: string;
  evidence: string[];
  explanation: string;
  suggestedAction: string;
  confidence: Confidence;
  confidenceReason: string;
  data: {
    count: number;
    dateRange: { from: string; to: string };
    recentValues: string[];
    baselineValues: string[];
    baselineAvg: string;
    recentAvg: string;
    direction: "up" | "down" | "flat";
    slopePerWeek: string;
    changePct: string;
    series?: { systolic: SeriesStats; diastolic: SeriesStats };
    stats?: SeriesStats;
  };
  generatedAt: string;
}

function avg(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function round(x: number, d = 1) {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}

function movingAverage(xs: number[], window = 3) {
  return xs.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    return round(avg(xs.slice(start, i + 1)), 1);
  });
}

/** Least-squares slope in units per week using days since first reading. */
function slopePerWeek(points: { t: Date; v: number }[]) {
  if (points.length < 2) return 0;
  const t0 = points[0].t.getTime();
  const xs = points.map((p) => (p.t.getTime() - t0) / (7 * 24 * 3600 * 1000));
  const ys = points.map((p) => p.v);
  const mx = avg(xs);
  const my = avg(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

function computeStats(
  points: { t: Date; v: number }[],
  baselineCount: number,
  recentCount: number,
  changeRatio: number,
  changeAbs: number | undefined,
  inAttention: (v: number) => boolean
): SeriesStats {
  const values = points.map((p) => p.v);
  const baseline = values.slice(0, Math.min(baselineCount, Math.max(1, values.length - recentCount)));
  const recent = values.slice(-recentCount);
  const baselineAvg = avg(baseline);
  const recentAvg = avg(recent);
  const changeAbsVal = recentAvg - baselineAvg;
  const changePct = baselineAvg === 0 ? 0 : changeAbsVal / baselineAvg;
  const slope = slopePerWeek(points);

  const meaningful =
    Math.abs(changePct) >= changeRatio || (changeAbs !== undefined && Math.abs(changeAbsVal) >= changeAbs);
  let direction: "up" | "down" | "flat" = "flat";
  if (meaningful && changeAbsVal > 0 && slope > 0) direction = "up";
  else if (meaningful && changeAbsVal < 0 && slope < 0) direction = "down";

  let consecutive = 0;
  for (let i = values.length - 1; i >= 0; i--) {
    if (inAttention(values[i])) consecutive++;
    else break;
  }

  return {
    count: values.length,
    from: points[0].t.toISOString(),
    to: points[points.length - 1].t.toISOString(),
    baselineValues: baseline,
    recentValues: recent,
    baselineAvg: round(baselineAvg, 1),
    recentAvg: round(recentAvg, 1),
    movingAvg: movingAverage(values),
    slopePerWeek: round(slope, 2),
    changeAbs: round(changeAbsVal, 1),
    changePct: round(changePct * 100, 1),
    direction,
    consecutiveAttention: consecutive,
    maxValue: Math.max(...values),
    minValue: Math.min(...values),
  };
}

function confidenceFor(count: number, spanDays: number): { confidence: Confidence; reason: string } {
  if (count >= 8 && spanDays >= 21) return { confidence: "high", reason: `${count} readings over ${spanDays} days give a consistent picture.` };
  if (count >= 5 && spanDays >= 10) return { confidence: "moderate", reason: `${count} readings over ${spanDays} days — more readings would strengthen this observation.` };
  return { confidence: "low", reason: `Only ${count} readings over ${spanDays} days — this observation is tentative.` };
}

const DISCUSS = "Consider discussing this with a qualified healthcare professional, for example at your next antenatal visit.";
const URGENT = "This pattern is outside the prototype's expected range. Please seek urgent advice from a qualified healthcare professional or emergency service.";

export function analyzeBloodPressure(readings: Reading[]): Observation | null {
  const pts = readings
    .filter((r) => r.systolic != null && r.diastolic != null)
    .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  const cfg = METRICS.bp;
  const now = new Date().toISOString();

  if (pts.length < 3) {
    return {
      metric: "bp",
      metricLabel: cfg.label,
      unit: cfg.unit,
      category: "insufficient_data",
      title: "Not enough blood pressure readings yet",
      summary: `Add at least 3 blood pressure readings to enable trend analysis. Currently ${pts.length} recorded.`,
      evidence: [`${pts.length} reading(s) available; trend analysis needs a sequence of readings.`],
      explanation: "The prototype compares your recent readings with your earlier baseline, which requires several readings over time.",
      suggestedAction: "Record blood pressure regularly, ideally at a similar time of day.",
      confidence: "low",
      confidenceReason: "Insufficient data.",
      data: { count: pts.length, dateRange: { from: "", to: "" }, recentValues: [], baselineValues: [], baselineAvg: "-", recentAvg: "-", direction: "flat", slopePerWeek: "-", changePct: "-" },
      generatedAt: now,
    };
  }

  const sys = computeStats(
    pts.map((p) => ({ t: p.recordedAt, v: p.systolic! })),
    cfg.baselineCount, cfg.recentCount, cfg.trendChangeRatio, cfg.trendChangeAbs,
    (v) => v >= BP_BANDS.attention.systolic
  );
  const dia = computeStats(
    pts.map((p) => ({ t: p.recordedAt, v: p.diastolic! })),
    cfg.baselineCount, cfg.recentCount, cfg.trendChangeRatio, cfg.trendChangeAbs,
    (v) => v >= BP_BANDS.attention.diastolic
  );
  const latest = pts[pts.length - 1];
  const spanDays = Math.round((latest.recordedAt.getTime() - pts[0].recordedAt.getTime()) / 86400000);
  const { confidence, reason } = confidenceFor(pts.length, spanDays);

  const evidence: string[] = [];
  evidence.push(`${pts.length} readings analysed between ${fmt(sys.from)} and ${fmt(sys.to)}.`);
  evidence.push(`Baseline (first ${sys.baselineValues.length} readings) averaged ${sys.baselineAvg}/${dia.baselineAvg} mmHg.`);
  evidence.push(`Recent (last ${sys.recentValues.length} readings) averaged ${sys.recentAvg}/${dia.recentAvg} mmHg.`);
  evidence.push(`Change from baseline: ${signed(sys.changeAbs)} systolic (${signed(sys.changePct)}%), ${signed(dia.changeAbs)} diastolic (${signed(dia.changePct)}%).`);
  evidence.push(`Rate of change: ${signed(sys.slopePerWeek)} / ${signed(dia.slopePerWeek)} mmHg per week (linear trend).`);

  let category: TrendCategory = "stable";
  let title = "Blood pressure trend is stable";
  let summary = "Your recent blood pressure readings are similar to your earlier baseline. No notable trend was identified by the prototype.";
  let action = "Keep recording readings regularly and share them at your antenatal visits.";

  const urgentSingle = latest.systolic! >= BP_BANDS.urgent.systolic || latest.diastolic! >= BP_BANDS.urgent.diastolic;
  const attentionRepeat = sys.consecutiveAttention >= cfg.repeatCount || dia.consecutiveAttention >= cfg.repeatCount;
  const rising = sys.direction === "up" || dia.direction === "up";
  const rapid = sys.slopePerWeek >= BP_BANDS.rapidRisePerWeek.systolic || dia.slopePerWeek >= BP_BANDS.rapidRisePerWeek.diastolic;

  if (urgentSingle) {
    category = "urgent_attention";
    title = "Latest blood pressure reading is well above the prototype's expected range";
    summary = `Your latest reading (${latest.systolic}/${latest.diastolic} mmHg) is above the prototype urgent band (${BP_BANDS.urgent.systolic}/${BP_BANDS.urgent.diastolic}).`;
    evidence.push(`Latest reading ${latest.systolic}/${latest.diastolic} mmHg is at or above the configured urgent band.`);
    action = URGENT;
  } else if (attentionRepeat && rising) {
    category = "needs_attention";
    title = "Blood pressure readings are increasing and repeatedly above the prototype attention band";
    summary = `Your recent readings show an upward trend compared with your earlier baseline, and the last ${Math.max(sys.consecutiveAttention, dia.consecutiveAttention)} readings were at or above ${BP_BANDS.attention.systolic}/${BP_BANDS.attention.diastolic} mmHg.`;
    evidence.push(`${Math.max(sys.consecutiveAttention, dia.consecutiveAttention)} consecutive readings at or above the attention band (${BP_BANDS.attention.systolic}/${BP_BANDS.attention.diastolic}).`);
    action = DISCUSS + " Repeated readings above the prototype band are a reason not to wait for a routine visit if you also have symptoms such as severe headache or blurred vision.";
  } else if (attentionRepeat) {
    category = "needs_attention";
    title = "Repeated blood pressure readings above the prototype attention band";
    summary = `The last ${Math.max(sys.consecutiveAttention, dia.consecutiveAttention)} readings were at or above ${BP_BANDS.attention.systolic}/${BP_BANDS.attention.diastolic} mmHg.`;
    action = DISCUSS;
  } else if (rising && rapid) {
    category = "needs_attention";
    title = "Blood pressure is rising faster than expected compared with your baseline";
    summary = "Your recent readings are gradually increasing compared with your earlier baseline, and the rate of change is above the prototype's rapid-rise setting.";
    evidence.push(`Weekly rise exceeds the prototype rapid-rise setting (${BP_BANDS.rapidRisePerWeek.systolic}/${BP_BANDS.rapidRisePerWeek.diastolic} mmHg per week).`);
    action = DISCUSS;
  } else if (rising) {
    category = "increasing";
    title = "Blood pressure trend is increasing";
    summary = "Your recent blood pressure readings show an upward trend compared with your earlier measurements. Consider discussing this trend with a qualified healthcare professional.";
    action = DISCUSS;
  } else if (sys.direction === "down" && dia.direction === "down") {
    category = "decreasing";
    title = "Blood pressure trend is decreasing";
    summary = "Your recent readings are lower than your earlier baseline. This is information to share with your care provider, not a diagnosis.";
    action = "Mention this trend at your next antenatal visit, especially if you feel dizzy or faint.";
  }

  return {
    metric: "bp",
    metricLabel: cfg.label,
    unit: cfg.unit,
    category,
    title,
    summary,
    evidence,
    explanation:
      "This observation compares the average of your earliest readings (your personal baseline) with the average of your most recent readings, checks the direction and speed of change across all readings, and counts how many recent readings fall inside configurable prototype bands. It does not diagnose any condition.",
    suggestedAction: action,
    confidence,
    confidenceReason: reason,
    data: {
      count: pts.length,
      dateRange: { from: sys.from, to: sys.to },
      recentValues: pts.slice(-cfg.recentCount).map((p) => `${p.systolic}/${p.diastolic}`),
      baselineValues: pts.slice(0, sys.baselineValues.length).map((p) => `${p.systolic}/${p.diastolic}`),
      baselineAvg: `${sys.baselineAvg}/${dia.baselineAvg}`,
      recentAvg: `${sys.recentAvg}/${dia.recentAvg}`,
      direction: sys.direction !== "flat" ? sys.direction : dia.direction,
      slopePerWeek: `${signed(sys.slopePerWeek)}/${signed(dia.slopePerWeek)}`,
      changePct: `${signed(sys.changePct)}% / ${signed(dia.changePct)}%`,
      series: { systolic: sys, diastolic: dia },
    },
    generatedAt: now,
  };
}

export function analyzeSingleValue(metric: Exclude<MetricType, "bp">, readings: Reading[]): Observation | null {
  const cfg = METRICS[metric];
  const pts = readings
    .filter((r) => r.value != null)
    .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())
    .map((r) => ({ t: r.recordedAt, v: r.value! }));
  const now = new Date().toISOString();
  if (pts.length === 0) return null;
  if (pts.length < 3) {
    return {
      metric,
      metricLabel: cfg.label,
      unit: cfg.unit,
      category: "insufficient_data",
      title: `Not enough ${cfg.label.toLowerCase()} readings yet`,
      summary: `Add at least 3 readings to enable trend analysis. Currently ${pts.length} recorded.`,
      evidence: [`${pts.length} reading(s) available.`],
      explanation: "Trend analysis needs a sequence of readings to compare recent values with a baseline.",
      suggestedAction: `Record ${cfg.label.toLowerCase()} regularly.`,
      confidence: "low",
      confidenceReason: "Insufficient data.",
      data: { count: pts.length, dateRange: { from: "", to: "" }, recentValues: pts.map((p) => `${p.v}`), baselineValues: [], baselineAvg: "-", recentAvg: "-", direction: "flat", slopePerWeek: "-", changePct: "-" },
      generatedAt: now,
    };
  }

  const inAttention = (v: number) =>
    (cfg.attention?.max !== undefined && v >= cfg.attention.max) || (cfg.attention?.min !== undefined && v <= cfg.attention.min);
  const stats = computeStats(pts, cfg.baselineCount, cfg.recentCount, cfg.trendChangeRatio, cfg.trendChangeAbs, inAttention);
  const latest = pts[pts.length - 1];
  const spanDays = Math.round((latest.t.getTime() - pts[0].t.getTime()) / 86400000);
  const { confidence, reason } = confidenceFor(pts.length, spanDays);

  const evidence = [
    `${pts.length} readings analysed between ${fmt(stats.from)} and ${fmt(stats.to)}.`,
    `Baseline (first ${stats.baselineValues.length} readings) averaged ${stats.baselineAvg} ${cfg.unit}.`,
    `Recent (last ${stats.recentValues.length} readings) averaged ${stats.recentAvg} ${cfg.unit}.`,
    `Change from baseline: ${signed(stats.changeAbs)} ${cfg.unit} (${signed(stats.changePct)}%).`,
    `Rate of change: ${signed(stats.slopePerWeek)} ${cfg.unit} per week (linear trend).`,
  ];

  let category: TrendCategory = "stable";
  let title = `${cfg.label} trend is stable`;
  let summary = `Your recent ${cfg.label.toLowerCase()} readings are similar to your earlier baseline.`;
  let action = "Keep recording readings regularly and share them at your antenatal visits.";

  const urgentSingle =
    (cfg.urgent?.max !== undefined && latest.v >= cfg.urgent.max) || (cfg.urgent?.min !== undefined && latest.v <= cfg.urgent.min);

  if (urgentSingle) {
    category = "urgent_attention";
    title = `Latest ${cfg.label.toLowerCase()} reading is well outside the prototype's expected range`;
    summary = `Your latest reading (${latest.v} ${cfg.unit}) is outside the prototype urgent band.`;
    evidence.push(`Latest reading ${latest.v} ${cfg.unit} is outside the configured urgent band.`);
    action = URGENT;
  } else if (stats.consecutiveAttention >= cfg.repeatCount) {
    category = "needs_attention";
    title = `Repeated ${cfg.label.toLowerCase()} readings in the prototype attention band`;
    summary = `The last ${stats.consecutiveAttention} readings were inside the prototype attention band.`;
    evidence.push(`${stats.consecutiveAttention} consecutive readings inside the attention band.`);
    action = DISCUSS;
  } else if (metric === "weight") {
    // Weight in pregnancy is expected to increase gradually; flag only rapid change or loss.
    const last = pts.slice(-2);
    const daysApart = last.length === 2 ? (last[1].t.getTime() - last[0].t.getTime()) / 86400000 : 7;
    const perWeek = last.length === 2 ? ((last[1].v - last[0].v) / Math.max(1, daysApart)) * 7 : 0;
    if (Math.abs(perWeek) >= WEIGHT_RAPID_CHANGE_KG_PER_WEEK) {
      category = "needs_attention";
      title = perWeek > 0 ? "Weight changed quickly over a short period" : "Weight decreased quickly over a short period";
      summary = `Your weight changed by about ${signed(round(perWeek, 1))} kg per week between the last two readings, which is above the prototype's rapid-change setting.`;
      evidence.push(`Change between last two readings ≈ ${signed(round(perWeek, 1))} kg/week (setting: ${WEIGHT_RAPID_CHANGE_KG_PER_WEEK} kg/week).`);
      action = DISCUSS + " Sudden weight change can have many causes; a professional can interpret it alongside other findings.";
    } else if (stats.direction === "up") {
      category = "increasing";
      title = "Weight is increasing gradually";
      summary = "Your weight is increasing steadily compared with your earlier readings. Gradual weight gain is expected during pregnancy; your care provider can advise what range is appropriate for you.";
      action = "Share your weight history at antenatal visits.";
    } else if (stats.direction === "down") {
      category = "decreasing";
      title = "Weight trend is decreasing";
      summary = "Your recent weight readings are lower than your earlier baseline.";
      action = DISCUSS;
    }
  } else if (stats.direction === "up") {
    category = "increasing";
    title = `${cfg.label} trend is increasing`;
    summary = `Your recent ${cfg.label.toLowerCase()} readings are higher than your earlier baseline.`;
    action = DISCUSS;
  } else if (stats.direction === "down") {
    category = "decreasing";
    title = `${cfg.label} trend is decreasing`;
    summary = `Your recent ${cfg.label.toLowerCase()} readings are lower than your earlier baseline.`;
    action = DISCUSS;
  }

  return {
    metric,
    metricLabel: cfg.label,
    unit: cfg.unit,
    category,
    title,
    summary,
    evidence,
    explanation:
      "This observation compares the average of your earliest readings (baseline) with your most recent readings, checks the direction and speed of change, and counts recent readings inside configurable prototype bands. It does not diagnose any condition.",
    suggestedAction: action,
    confidence,
    confidenceReason: reason,
    data: {
      count: pts.length,
      dateRange: { from: stats.from, to: stats.to },
      recentValues: stats.recentValues.map((v) => `${v}`),
      baselineValues: stats.baselineValues.map((v) => `${v}`),
      baselineAvg: `${stats.baselineAvg}`,
      recentAvg: `${stats.recentAvg}`,
      direction: stats.direction,
      slopePerWeek: signed(stats.slopePerWeek),
      changePct: `${signed(stats.changePct)}%`,
      stats,
    },
    generatedAt: now,
  };
}

export function analyzeAll(measurements: { type: string; recordedAt: Date; systolic: number | null; diastolic: number | null; value: number | null }[]): Observation[] {
  const byType = (t: string) => measurements.filter((m) => m.type === t);
  const out: Observation[] = [];
  const bp = analyzeBloodPressure(byType("bp"));
  if (bp) out.push(bp);
  for (const m of ["weight", "heart_rate", "glucose", "temperature"] as const) {
    const o = analyzeSingleValue(m, byType(m));
    if (o) out.push(o);
  }
  const order: Record<TrendCategory, number> = { urgent_attention: 0, needs_attention: 1, increasing: 2, decreasing: 3, stable: 4, insufficient_data: 5 };
  return out.sort((a, b) => order[a.category] - order[b.category]);
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function signed(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

export const CATEGORY_META: Record<TrendCategory, { label: string; color: string; badge: string }> = {
  stable: { label: "Stable", color: "text-emerald-700", badge: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  increasing: { label: "Increasing", color: "text-amber-700", badge: "bg-amber-50 text-amber-800 border-amber-200" },
  decreasing: { label: "Decreasing", color: "text-sky-700", badge: "bg-sky-50 text-sky-800 border-sky-200" },
  needs_attention: { label: "Needs attention", color: "text-orange-700", badge: "bg-orange-50 text-orange-800 border-orange-200" },
  urgent_attention: { label: "Urgent attention", color: "text-red-700", badge: "bg-red-50 text-red-800 border-red-200" },
  insufficient_data: { label: "More data needed", color: "text-slate-600", badge: "bg-slate-50 text-slate-700 border-slate-200" },
};
