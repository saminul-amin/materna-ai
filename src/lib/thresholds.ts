/**
 * PROTOTYPE / DEMO LOGIC — NOT FOR CLINICAL USE.
 *
 * These values are configurable prototype thresholds used only to demonstrate how
 * Materna AI structures trend detection. Before any real-world use they must be
 * formally reviewed and mapped to appropriate clinical guidance by qualified
 * healthcare professionals. Nothing here constitutes a diagnosis or a clinical rule.
 */

export type MetricType = "bp" | "heart_rate" | "weight" | "temperature" | "glucose";

export interface MetricConfig {
  label: string;
  unit: string;
  /** Number of earliest readings used to form the personal baseline. */
  baselineCount: number;
  /** Number of most recent readings compared against the baseline. */
  recentCount: number;
  /** Relative change (recent avg vs baseline avg) considered a meaningful trend. */
  trendChangeRatio: number;
  /** Absolute change considered meaningful (used when ratio is not appropriate). */
  trendChangeAbs?: number;
  /** Prototype attention band (single reading) — "may be worth discussing". */
  attention?: { min?: number; max?: number };
  /** Prototype urgent band (single reading) — "seek urgent professional care". */
  urgent?: { min?: number; max?: number };
  /** Number of consecutive readings in the attention band to escalate a trend. */
  repeatCount: number;
}

export const METRICS: Record<MetricType, MetricConfig> = {
  bp: {
    label: "Blood pressure",
    unit: "mmHg",
    baselineCount: 4,
    recentCount: 3,
    trendChangeRatio: 0.06,
    trendChangeAbs: 8,
    repeatCount: 2,
  },
  heart_rate: {
    label: "Heart rate",
    unit: "bpm",
    baselineCount: 4,
    recentCount: 3,
    trendChangeRatio: 0.12,
    attention: { min: 50, max: 110 },
    urgent: { max: 130 },
    repeatCount: 2,
  },
  weight: {
    label: "Weight",
    unit: "kg",
    baselineCount: 3,
    recentCount: 3,
    trendChangeRatio: 0.04,
    repeatCount: 2,
  },
  temperature: {
    label: "Temperature",
    unit: "°C",
    baselineCount: 3,
    recentCount: 2,
    trendChangeRatio: 0.015,
    attention: { max: 37.8 },
    urgent: { max: 38.5 },
    repeatCount: 2,
  },
  glucose: {
    label: "Blood glucose",
    unit: "mmol/L",
    baselineCount: 3,
    recentCount: 3,
    trendChangeRatio: 0.12,
    attention: { max: 7.8 },
    urgent: { max: 11.1 },
    repeatCount: 2,
  },
};

/** Blood pressure prototype bands (systolic/diastolic), separately configurable. */
export const BP_BANDS = {
  attention: { systolic: 135, diastolic: 85 },
  urgent: { systolic: 160, diastolic: 110 },
  /** Rapid weekly rise considered worth discussing (mmHg per 7 days). */
  rapidRisePerWeek: { systolic: 6, diastolic: 4 },
};

/** Weight: rapid change over a short window (kg within 7 days) worth discussing. */
export const WEIGHT_RAPID_CHANGE_KG_PER_WEEK = 1.5;

export const THRESHOLD_DISCLAIMER =
  "Prototype/Demo Logic — Not for Clinical Use. Thresholds are configurable placeholders that must be reviewed and mapped to appropriate clinical guidance before real-world use.";
