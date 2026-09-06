import type { Observation } from "./trend-engine";

/** Generates a plain-language question a user can bring to a healthcare professional. */
export function generateDoctorQuestion(o: Observation, week: number): string {
  const range = o.data.dateRange.from
    ? `between ${fmt(o.data.dateRange.from)} and ${fmt(o.data.dateRange.to)}`
    : "recently";
  const metric = o.metricLabel.toLowerCase();
  switch (o.category) {
    case "urgent_attention":
      return `I am ${week} weeks pregnant. My latest ${metric} reading was ${o.data.recentValues[o.data.recentValues.length - 1]} ${o.unit}, which the monitoring app flagged as outside its expected range. Should I be seen urgently, and what should I watch for?`;
    case "needs_attention":
      return `I am ${week} weeks pregnant. Over ${o.data.count} readings ${range}, my ${metric} moved from an average of ${o.data.baselineAvg} to ${o.data.recentAvg} ${o.unit}, with the most recent readings ${o.data.recentValues.join(", ")}. Should I discuss this at my next appointment, or sooner? Is there anything I should monitor or change in the meantime?`;
    case "increasing":
      return `I am ${week} weeks pregnant. My recent ${metric} readings have been increasing compared with my earlier readings (average ${o.data.baselineAvg} → ${o.data.recentAvg} ${o.unit} over ${o.data.count} readings ${range}). Should I discuss this trend at my next appointment, and how often should I be measuring?`;
    case "decreasing":
      return `I am ${week} weeks pregnant. My recent ${metric} readings have been lower than my earlier readings (average ${o.data.baselineAvg} → ${o.data.recentAvg} ${o.unit}). Is this something we should look at at my next appointment?`;
    case "stable":
      return `I am ${week} weeks pregnant and my ${metric} readings have been steady (average around ${o.data.recentAvg} ${o.unit} over ${o.data.count} readings ${range}). Is the range I am seeing appropriate for me, and is my measuring routine sufficient?`;
    default:
      return `I am ${week} weeks pregnant and have started recording my ${metric} at home. How often should I measure, and what values would you like me to report?`;
  }
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
