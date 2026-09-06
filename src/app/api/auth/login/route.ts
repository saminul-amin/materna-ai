import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { fail, parseBody, withErrors } from "@/lib/api-helpers";

const schema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

export const POST = withErrors(async (req: Request) => {
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (!user) return fail("Email or password is incorrect.", 401);
  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) return fail("Email or password is incorrect.", 401);
  const token = await createSessionToken(user.id);
  const res = NextResponse.json({ ok: true });
  setSessionCookie(res, token);
  return res;
});
