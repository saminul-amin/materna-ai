import { z } from "zod";

/** Shared request schemas (kept out of route files, which may only export handlers). */
export const measurementSchema = z
  .object({
    type: z.enum(["bp", "heart_rate", "weight", "temperature", "glucose"]),
    systolic: z.coerce.number().int().min(50).max(260).optional().nullable(),
    diastolic: z.coerce.number().int().min(30).max(160).optional().nullable(),
    value: z.coerce.number().optional().nullable(),
    recordedAt: z.string().min(1),
    note: z.string().max(300).optional().or(z.literal("")),
  })
  .superRefine((d, ctx) => {
    if (d.type === "bp") {
      if (d.systolic == null || d.diastolic == null) ctx.addIssue({ code: "custom", message: "Blood pressure needs both systolic and diastolic values", path: ["systolic"] });
      else if (d.systolic <= d.diastolic) ctx.addIssue({ code: "custom", message: "Systolic must be higher than diastolic", path: ["systolic"] });
    } else {
      if (d.value == null || isNaN(d.value)) ctx.addIssue({ code: "custom", message: "A value is required", path: ["value"] });
      const ranges: Record<string, [number, number]> = { heart_rate: [30, 220], weight: [25, 250], temperature: [33, 43], glucose: [1, 35] };
      const [min, max] = ranges[d.type];
      if (d.value != null && (d.value < min || d.value > max)) ctx.addIssue({ code: "custom", message: `Value must be between ${min} and ${max}`, path: ["value"] });
    }
    if (isNaN(new Date(d.recordedAt).getTime())) ctx.addIssue({ code: "custom", message: "Invalid date/time", path: ["recordedAt"] });
    if (new Date(d.recordedAt).getTime() > Date.now() + 60 * 60 * 1000) ctx.addIssue({ code: "custom", message: "Date cannot be in the future", path: ["recordedAt"] });
  });


export const reminderSchema = z.object({
  name: z.string().trim().min(2).max(80),
  dose: z.string().trim().max(120).optional().or(z.literal("")),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  frequency: z.enum(["daily", "twice_daily", "weekly", "custom"]).default("daily"),
  active: z.boolean().optional(),
});

