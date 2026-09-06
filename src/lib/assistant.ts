/**
 * Materna AI Assistant.
 *
 * Two modes:
 *  1. LLM-backed (when ANTHROPIC_API_KEY is set) — Claude answers with a strict safety system prompt
 *     and the user's stored pregnancy context. Never diagnoses or prescribes.
 *  2. Prototype rule-based (default fallback) — deterministic, clearly labelled, uses the same context.
 *
 * Both modes append a persistent medical disclaimer and route emergency phrasing to urgent-care guidance.
 */
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./db";
import { getPregnancyContext } from "./pregnancy";
import { analyzeAll, type Observation } from "./trend-engine";
import { guideForWeek } from "./guide-data";
import { DANGER_SIGNS } from "./static-data";

export const ASSISTANT_DISCLAIMER =
  "Materna AI Assistant provides general pregnancy-health information only. It does not diagnose, prescribe, or replace your healthcare professional. If you are experiencing an emergency or danger sign, seek urgent medical care or call 999.";

export interface AssistantContext {
  name: string;
  week: number | null;
  trimester: number | null;
  daysToEdd: number | null;
  latest: Record<string, string>;
  observations: Observation[];
  documents: { title: string; docType: string; date: string | null }[];
  nextAppointment: string | null;
  reminders: string[];
  healthInfo: string | null;
}

export async function buildContext(userId: string): Promise<AssistantContext> {
  const [user, ctx, measurements, docs, appt, reminders] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    getPregnancyContext(userId),
    prisma.healthMeasurement.findMany({ where: { userId }, orderBy: { recordedAt: "asc" } }),
    prisma.medicalDocument.findMany({ where: { userId }, orderBy: { uploadedAt: "desc" }, take: 6 }),
    prisma.appointment.findFirst({ where: { userId, status: "scheduled", scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: "asc" } }),
    prisma.reminder.findMany({ where: { userId, active: true } }),
  ]);
  const latest: Record<string, string> = {};
  for (const m of measurements) {
    latest[m.type] = m.type === "bp" ? `${m.systolic}/${m.diastolic} mmHg (${m.recordedAt.toLocaleDateString("en-GB")})` : `${m.value} ${m.unit} (${m.recordedAt.toLocaleDateString("en-GB")})`;
  }
  return {
    name: user?.name ?? "there",
    week: ctx?.week ?? null,
    trimester: ctx?.trimester ?? null,
    daysToEdd: ctx?.daysToEdd ?? null,
    latest,
    observations: analyzeAll(measurements),
    documents: docs.map((d) => ({ title: d.title, docType: d.docType, date: d.documentDate?.toLocaleDateString("en-GB") ?? null })),
    nextAppointment: appt ? `${appt.type} on ${appt.scheduledAt.toLocaleString("en-GB")}${appt.facilityName ? " at " + appt.facilityName : ""}${appt.providerName ? " with " + appt.providerName : ""}` : null,
    reminders: reminders.map((r) => `${r.name} at ${r.time}`),
    healthInfo: ctx?.profile.healthInfo ?? null,
  };
}

const EMERGENCY_WORDS = ["bleeding", "severe pain", "can't breathe", "cannot breathe", "chest pain", "fit", "seizure", "convulsion", "unconscious", "no movement", "not moving", "blurred vision", "severe headache", "water broke", "waters broke", "emergency"];

function emergencyCheck(q: string) {
  const lower = q.toLowerCase();
  return EMERGENCY_WORDS.some((w) => lower.includes(w));
}

/** Deterministic prototype assistant — no external API required. */
export function ruleBasedAnswer(question: string, c: AssistantContext): string {
  const q = question.toLowerCase();
  const weekTxt = c.week ? `week ${c.week} (trimester ${c.trimester})` : "an unknown week (please complete your profile)";

  if (emergencyCheck(q)) {
    return `What you describe may be a danger sign. Please seek urgent medical care now: call 999 or go to the nearest facility with emergency obstetric care, and contact your emergency person. The Danger Signs page lists warning signs and the Emergency page has the facility directory. I cannot assess an emergency for you.`;
  }
  if (/(blood pressure|\bbp\b|pressure)/.test(q)) {
    const o = c.observations.find((x) => x.metric === "bp");
    if (!o || o.category === "insufficient_data") return `Based on the information you provided, there are not yet enough blood pressure readings for a trend. Your latest reading is ${c.latest.bp ?? "not recorded"}. Recording BP regularly, at a similar time each day after resting, gives your care provider a clearer picture.`;
    return `Based on the information you provided (${o.data.count} readings from ${fmt(o.data.dateRange.from)} to ${fmt(o.data.dateRange.to)}): ${o.summary} Your baseline averaged ${o.data.baselineAvg} ${o.unit} and your recent readings averaged ${o.data.recentAvg} ${o.unit}. ${o.suggestedAction} You can open "Why am I seeing this?" for the full explanation, or use "Ask Your Doctor" to prepare a question.`;
  }
  if (/weight/.test(q)) {
    const o = c.observations.find((x) => x.metric === "weight");
    return o
      ? `Based on your recorded weights: ${o.summary} (${o.data.count} readings; baseline ${o.data.baselineAvg} kg → recent ${o.data.recentAvg} kg). The appropriate weight-gain range varies from person to person, so this may be worth discussing with your healthcare professional at your next visit.`
      : `You have no weight readings recorded yet. Add them in Health Monitoring to see a trend.`;
  }
  if (/(sugar|glucose|diabet)/.test(q)) {
    const o = c.observations.find((x) => x.metric === "glucose");
    return o
      ? `Based on your recorded glucose values: ${o.summary} Latest: ${c.latest.glucose ?? "-"}. Glucose results, including any OGTT report in your Document Vault, should be interpreted by your healthcare professional.`
      : `No glucose readings are recorded. If you have a glucose test report, you can upload it to the Document Vault and add the values to your timeline after review.`;
  }
  if (/(headache|swelling|swollen|dizzy|vision)/.test(q)) {
    return `Headache, swelling, dizziness or vision changes in pregnancy can have many causes. If a headache is severe or does not go away, or you notice blurred vision, flashing lights or sudden swelling of the face or hands, treat it as a danger sign and seek urgent care. Otherwise, this may be worth discussing with your healthcare professional, especially alongside your blood pressure readings (latest: ${c.latest.bp ?? "not recorded"}).`;
  }
  if (/(appointment|visit|next)/.test(q)) {
    return c.nextAppointment ? `Your next scheduled appointment is: ${c.nextAppointment}. Bringing your BP log, reports and any questions from "Ask Your Doctor" can make the visit more useful.` : `You have no upcoming appointment recorded. You can book an online consultation (demo) or add an antenatal visit in Care Coordination.`;
  }
  if (/(remind|medicine|tablet|iron|calcium|supplement|dose)/.test(q)) {
    return c.reminders.length
      ? `Your active reminders are: ${c.reminders.join("; ")}. I can only remind you about items you or your prescription record have already entered — I cannot recommend, start, change or stop any medicine. Please discuss dosage questions with your healthcare professional.`
      : `You have no reminders set. You can add reminders for items your healthcare professional has advised in the Reminders page. I cannot recommend medicines myself.`;
  }
  if (/(report|document|test result|scan|ultrasound|haemoglobin|hemoglobin|hb\b)/.test(q)) {
    return c.documents.length
      ? `Your Document Vault contains: ${c.documents.map((d) => `${d.title}${d.date ? " (" + d.date + ")" : ""}`).join("; ")}. The vault can extract visible values for you to review and add to your timeline, but interpreting results is something to do with your healthcare professional.`
      : `Your Document Vault is empty. Upload reports or prescriptions to keep them organised and extract visible values for review.`;
  }
  if (/(baby|develop|size|movement|kick)/.test(q) && c.week) {
    const g = guideForWeek(c.week);
    return `At ${weekTxt}, general guidance says: ${g.baby} Size comparison this week: ${g.size}. ${c.week >= 28 ? "In the third trimester, paying attention to your baby's usual movement pattern each day is generally advised; a noticeable reduction is a reason to contact your provider promptly." : ""} This is general information, not individual advice.`;
  }
  if (/(sleep|stress|anxious|worried|sad|mood|feel)/.test(q)) {
    return `It is common to feel worried or tired during pregnancy. The Mental Wellbeing page lets you check in and see how things change over time. If low mood, stress or poor sleep continue, it may be helpful to talk with a qualified healthcare professional or a trusted person. If you ever feel unsafe, seek urgent help.`;
  }
  if (/(week|how far|trimester|due)/.test(q)) {
    const g = c.week ? guideForWeek(c.week) : null;
    return `You are in ${weekTxt}${c.daysToEdd != null ? `, about ${c.daysToEdd} days from your expected delivery date` : ""}. ${g ? `This week: ${g.body} Suggested: ${g.appointments}` : ""}`;
  }
  if (/(danger|warning|emergency|when should i)/.test(q)) {
    return `Danger signs that need urgent care include: ${DANGER_SIGNS.filter((d) => d.urgent).slice(0, 6).map((d) => d.label.toLowerCase()).join("; ")}. If any of these happen, call 999 or go to the nearest facility. The Danger Signs page has the full checklist.`;
  }
  if (/(eat|food|diet|nutrition)/.test(q)) {
    return `General guidance for ${weekTxt}: ${c.week ? guideForWeek(c.week).care : "eat a varied diet and stay hydrated."} Specific dietary advice, especially if you have a health condition, should come from your healthcare professional.`;
  }
  return `Based on the information you provided, you are in ${weekTxt}. I can help with general questions about your recorded blood pressure, weight, glucose, documents, appointments, reminders, danger signs, and week-by-week guidance. Try asking, for example, "How is my blood pressure trend?" or "What should I expect this week?" For anything specific to your care, please talk with your healthcare professional.`;
}

const SYSTEM_PROMPT = `You are Materna AI Assistant, a maternal-health information assistant inside a prototype monitoring app used in Bangladesh.

Hard rules (never break):
- Never diagnose a condition, never say the user "has" a condition.
- Never prescribe, recommend starting/stopping/changing any medicine or dose.
- Never claim clinical certainty. Never invent readings or results not present in the context.
- If the user describes anything that could be a danger sign (bleeding, severe headache, vision changes, severe abdominal pain, reduced fetal movement, fever, fits, breathing difficulty, waters breaking early), tell them clearly to seek urgent medical care now and call 999 (Bangladesh emergency), then stop.
- Frame everything as information to discuss with a qualified healthcare professional. Use phrases like "Based on the information you provided…" and "This may be worth discussing with your healthcare professional."
- Be warm, calm, plain-language, and concise (under 180 words). No markdown headers.
- The trend observations in context come from a transparent rule-based prototype, not a validated model; describe them as observations, not findings.`;

export async function llmAnswer(question: string, history: { role: "user" | "assistant"; content: string }[], c: AssistantContext): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const client = new Anthropic({ apiKey });
  const contextText = JSON.stringify(
    {
      name: c.name,
      gestationalWeek: c.week,
      trimester: c.trimester,
      daysToExpectedDelivery: c.daysToEdd,
      latestMeasurements: c.latest,
      trendObservations: c.observations.map((o) => ({ metric: o.metricLabel, category: o.category, summary: o.summary, suggestedAction: o.suggestedAction, data: { count: o.data.count, baselineAvg: o.data.baselineAvg, recentAvg: o.data.recentAvg } })),
      documents: c.documents,
      nextAppointment: c.nextAppointment,
      reminders: c.reminders,
      healthInfo: c.healthInfo,
      weekGuide: c.week ? guideForWeek(c.week) : null,
    },
    null,
    1
  );
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-5";
  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-8).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: question },
  ];
  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      { type: "text", text: `User context (may contain synthetic demo data):\n${contextText}` },
    ],
    messages,
  });
  if (response.stop_reason === "refusal") return null;
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  return text || null;
}

function fmt(iso: string) {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
}
