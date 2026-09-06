import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { withErrors } from "@/lib/api-helpers";
import { seedDemoPatient } from "@/lib/demo-data";

/** Loads (and resets) the synthetic demo patient and signs the browser in as that user. */
export const POST = withErrors(async () => {
  const userId = await seedDemoPatient();
  const token = await createSessionToken(userId);
  const res = NextResponse.json({ ok: true, userId });
  setSessionCookie(res, token);
  return res;
});
