/**
 * SYNTHETIC DEMO DATA — NOT A REAL PATIENT.
 * All values below are invented for demonstration purposes only.
 * Dates are generated relative to "today" so the demo always looks current.
 */
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { addDays, eddFromGestationalWeek, startOfDay } from "./utils";
import { BIRTH_PLAN_ITEMS } from "./birth-plan-items";

export const DEMO_EMAIL = "demo@materna.ai";
export const DEMO_PASSWORD = "demo1234";
export const DEMO_WEEK = 30;

function at(daysAgo: number, hour = 8, minute = 30) {
  const d = addDays(startOfDay(new Date()), -daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export async function seedDemoPatient(): Promise<string> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: "Ayesha Rahman (Demo)", isDemo: true, passwordHash, age: 27, phone: "+880 1700-000000", plan: "premium_demo" },
    create: { email: DEMO_EMAIL, name: "Ayesha Rahman (Demo)", isDemo: true, passwordHash, age: 27, phone: "+880 1700-000000", plan: "premium_demo" },
  });
  const userId = user.id;

  // Reset all demo data so every "Load Demo Patient" produces the same canonical dataset.
  await prisma.$transaction([
    prisma.pregnancyProfile.deleteMany({ where: { userId } }),
    prisma.pregnancyHistory.deleteMany({ where: { userId } }),
    prisma.healthMeasurement.deleteMany({ where: { userId } }),
    prisma.symptom.deleteMany({ where: { userId } }),
    prisma.aiObservation.deleteMany({ where: { userId } }),
    prisma.medicalDocument.deleteMany({ where: { userId } }),
    prisma.appointment.deleteMany({ where: { userId } }),
    prisma.reminder.deleteMany({ where: { userId } }),
    prisma.mentalWellbeing.deleteMany({ where: { userId } }),
    prisma.emergencyContact.deleteMany({ where: { userId } }),
    prisma.medicineOrder.deleteMany({ where: { userId } }),
    prisma.familyMember.deleteMany({ where: { userId } }),
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.doctorQuestion.deleteMany({ where: { userId } }),
    prisma.birthPlanItem.deleteMany({ where: { userId } }),
  ]);

  await prisma.pregnancyProfile.create({
    data: {
      userId,
      status: "pregnant",
      expectedDeliveryDate: eddFromGestationalWeek(DEMO_WEEK),
      gravida: 2,
      para: 1,
      bloodGroup: "B+",
      heightCm: 158,
      prePregnancyWeightKg: 54,
      healthInfo: "Synthetic demo record. Previous pregnancy (2023) with raised blood pressure noted in the third trimester, resolved after delivery. No known allergies. Taking iron-folic acid and calcium as advised at antenatal clinic.",
    },
  });

  await prisma.pregnancyHistory.createMany({
    data: [
      { userId, year: 2023, outcome: "live_birth", notes: "Full-term vaginal delivery. Raised blood pressure noted at 34 weeks, monitored at clinic; resolved after birth. (Synthetic)" },
    ],
  });

  await prisma.emergencyContact.create({
    data: { userId, name: "Tanvir Rahman (Demo)", relation: "Husband", phone: "+880 1800-000000", isPrimary: true },
  });

  await prisma.familyMember.create({
    data: { userId, name: "Tanvir Rahman (Demo)", relation: "Husband", phone: "+880 1800-000000", shareHealthData: false },
  });

  // --- Blood pressure: ~10 weeks of readings. Stable baseline, then a gradual rise in the last ~3 weeks. ---
  const bp: [number, number, number][] = [
    // [daysAgo, systolic, diastolic]
    [70, 108, 68], [66, 110, 70], [63, 112, 70], [59, 109, 69], [56, 111, 71], [52, 110, 70],
    [49, 113, 72], [45, 112, 71], [42, 114, 73], [38, 113, 72], [35, 116, 74], [31, 115, 74],
    [28, 118, 76], [24, 120, 77], [21, 122, 78], [17, 124, 80], [14, 126, 81], [10, 128, 82],
    [7, 130, 84], [4, 132, 85], [1, 134, 86],
  ];
  await prisma.healthMeasurement.createMany({
    data: bp.map(([d, s, di]) => ({
      userId, type: "bp", systolic: s, diastolic: di, unit: "mmHg", recordedAt: at(d, 8, 15),
      source: "demo", note: d === 4 ? "Mild headache in the evening" : d === 1 ? "Measured after resting 5 min" : null,
    })),
  });

  // --- Weight: gradual expected increase ---
  const weight: [number, number][] = [
    [70, 60.2], [63, 60.8], [56, 61.3], [49, 61.9], [42, 62.6], [35, 63.1], [28, 63.8], [21, 64.4], [14, 65.0], [7, 65.7], [1, 66.1],
  ];
  await prisma.healthMeasurement.createMany({
    data: weight.map(([d, v]) => ({ userId, type: "weight", value: v, unit: "kg", recordedAt: at(d, 7, 45), source: "demo" })),
  });

  // --- Heart rate: stable ---
  const hr: [number, number][] = [[63, 78], [49, 80], [35, 82], [21, 84], [14, 83], [7, 86], [1, 85]];
  await prisma.healthMeasurement.createMany({
    data: hr.map(([d, v]) => ({ userId, type: "heart_rate", value: v, unit: "bpm", recordedAt: at(d, 8, 20), source: "demo" })),
  });

  // --- Glucose (fasting, occasional) ---
  const glucose: [number, number][] = [[56, 4.6], [35, 4.8], [14, 4.9], [3, 5.0]];
  await prisma.healthMeasurement.createMany({
    data: glucose.map(([d, v]) => ({ userId, type: "glucose", value: v, unit: "mmol/L", recordedAt: at(d, 7, 0), source: "demo", note: "Fasting" })),
  });

  // --- Temperature ---
  const temp: [number, number][] = [[30, 36.7], [15, 36.8], [2, 36.9]];
  await prisma.healthMeasurement.createMany({
    data: temp.map(([d, v]) => ({ userId, type: "temperature", value: v, unit: "°C", recordedAt: at(d, 20, 0), source: "demo" })),
  });

  // --- Symptoms ---
  await prisma.symptom.createMany({
    data: [
      { userId, name: "Headache", severity: "mild", recordedAt: at(9, 19, 0), note: "Evening, eased after rest" },
      { userId, name: "Ankle swelling", severity: "mild", recordedAt: at(5, 18, 30), note: "After a long day standing" },
      { userId, name: "Headache", severity: "mild", recordedAt: at(4, 20, 0), note: null },
      { userId, name: "Back pain", severity: "mild", recordedAt: at(12, 9, 0), note: null },
    ],
  });

  // --- Documents (synthetic) ---
  await prisma.medicalDocument.createMany({
    data: [
      {
        userId, title: "Antenatal blood test report (CBC)", docType: "lab_report", isDemo: true, demoKey: "cbc", documentDate: at(12),
        extractionStatus: "pending", mimeType: "text/plain",
        demoText: [
          "DEMO DATA — SYNTHETIC REPORT — NOT A REAL PATIENT",
          "Demo Diagnostic Centre (fictional)",
          `Patient: Ayesha Rahman (Demo)   Age: 27   Date: ${at(12).toLocaleDateString("en-GB")}`,
          "Test: Complete Blood Count",
          "Haemoglobin (Hb): 10.4 g/dL   (Lab reference: 11.0 - 15.0)",
          "Haematocrit: 32 %",
          "Platelets: 210 x10^9/L",
          "WBC: 8.9 x10^9/L",
          "Blood group: B Positive",
          "Remarks: Please review with treating physician. (Synthetic demo text)",
        ].join("\n"),
      },
      {
        userId, title: "Antenatal visit summary & prescription", docType: "prescription", isDemo: true, demoKey: "rx", documentDate: at(30),
        extractionStatus: "pending", mimeType: "text/plain",
        demoText: [
          "DEMO DATA — SYNTHETIC PRESCRIPTION — NOT A REAL PATIENT",
          "Demo Maternity Clinic (fictional)   Attending: Dr. Demo Provider (fictional)",
          `Date: ${at(30).toLocaleDateString("en-GB")}   Gestational age: ${DEMO_WEEK - 4} weeks`,
          "BP: 118/76 mmHg   Weight: 63.5 kg   Fundal height: appropriate for dates",
          "Rx:",
          "1. Iron + Folic acid tablet — 1 tablet daily after meals",
          "2. Calcium 500 mg — 1 tablet twice daily",
          "Advice: Continue routine antenatal visits. Next visit in 4 weeks. Report immediately if severe headache, visual disturbance, or reduced fetal movement.",
          "(Synthetic demo text)",
        ].join("\n"),
      },
      {
        userId, title: "Oral glucose tolerance test (OGTT)", docType: "lab_report", isDemo: true, demoKey: "ogtt", documentDate: at(35),
        extractionStatus: "pending", mimeType: "text/plain",
        demoText: [
          "DEMO DATA — SYNTHETIC REPORT — NOT A REAL PATIENT",
          "Demo Diagnostic Centre (fictional)",
          `Patient: Ayesha Rahman (Demo)   Date: ${at(35).toLocaleDateString("en-GB")}`,
          "Test: 75 g Oral Glucose Tolerance Test",
          "Fasting glucose: 4.7 mmol/L",
          "1-hour glucose: 8.1 mmol/L",
          "2-hour glucose: 6.9 mmol/L",
          "Remarks: For interpretation by treating physician. (Synthetic demo text)",
        ].join("\n"),
      },
      {
        userId, title: "Ultrasound scan summary (anomaly scan)", docType: "ultrasound", isDemo: true, demoKey: "usg", documentDate: at(65),
        extractionStatus: "pending", mimeType: "text/plain",
        demoText: [
          "DEMO DATA — SYNTHETIC REPORT — NOT A REAL PATIENT",
          "Demo Imaging Centre (fictional)",
          `Date: ${at(65).toLocaleDateString("en-GB")}   Gestational age by scan: ${DEMO_WEEK - 9} weeks 2 days`,
          "Single live intrauterine fetus. Fetal heart rate: 148 bpm.",
          "Placenta: posterior, upper segment. Amniotic fluid: normal volume.",
          "Estimated fetal weight: consistent with dates.",
          "Remarks: For interpretation by treating physician. (Synthetic demo text)",
        ].join("\n"),
      },
    ],
  });

  // --- Appointments ---
  await prisma.appointment.createMany({
    data: [
      { userId, kind: "offline", type: "antenatal", facilityName: "Demo Upazila Health Complex (fictional)", scheduledAt: at(-5, 10, 0), status: "scheduled", notes: "Routine third-trimester antenatal visit. Bring BP log." },
      { userId, kind: "offline", type: "test", facilityName: "Demo Diagnostic Centre (fictional)", scheduledAt: at(-12, 9, 0), status: "scheduled", notes: "Repeat haemoglobin test as advised." },
      { userId, kind: "offline", type: "antenatal", facilityName: "Demo Upazila Health Complex (fictional)", scheduledAt: at(30, 10, 0), status: "completed", notes: "Routine visit. BP 118/76." },
      { userId, kind: "online", type: "consultation", providerName: "Dr. Demo Provider A (fictional)", scheduledAt: at(16, 18, 0), status: "completed", notes: "Discussed mild headaches and sleep." },
    ],
  });

  // --- Reminders (linked to the synthetic prescription) ---
  await prisma.reminder.createMany({
    data: [
      { userId, name: "Iron + Folic acid", dose: "1 tablet after breakfast", time: "09:00", frequency: "daily", source: "prescription" },
      { userId, name: "Calcium 500 mg", dose: "1 tablet, morning and evening", time: "20:00", frequency: "twice_daily", source: "prescription" },
      { userId, name: "Record blood pressure", dose: "Sit and rest 5 minutes first", time: "08:00", frequency: "daily", source: "user" },
    ],
  });

  // --- Mental wellbeing check-ins: sleep gradually worsening ---
  const wb: [number, number, number, number, string | null][] = [
    // daysAgo, mood, stress, sleep, note
    [42, 4, 2, 4, null], [35, 4, 2, 4, null], [28, 4, 3, 3, "Busy week"], [21, 3, 3, 3, null], [14, 3, 3, 3, "Waking up at night"], [7, 3, 4, 2, "Worried about BP readings"], [2, 3, 4, 2, "Tired"],
  ];
  await prisma.mentalWellbeing.createMany({
    data: wb.map(([d, mood, stress, sleep, note]) => ({ userId, mood, stress, sleep, note, recordedAt: at(d, 21, 0) })),
  });

  // --- Birth preparedness ---
  await prisma.birthPlanItem.createMany({
    data: BIRTH_PLAN_ITEMS.map((item, i) => ({ userId, key: item.key, label: item.label, order: i, done: ["emergency_contact", "facility", "documents"].includes(item.key) })),
  });

  await prisma.notification.createMany({
    data: [
      { userId, title: "Antenatal visit in 5 days", body: "Bring your blood pressure log and recent reports." },
      { userId, title: "New AI observation", body: "Your blood pressure trend has changed. Open 'Why am I seeing this?' for the explanation." },
    ],
  });

  return userId;
}
