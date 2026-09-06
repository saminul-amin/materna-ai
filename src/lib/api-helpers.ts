import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const raw = await req.json();
    const data = schema.parse(raw);
    return { data, error: null };
  } catch (e) {
    if (e instanceof ZodError) {
      const msg = e.issues.map((i) => `${i.path.join(".") || "field"}: ${i.message}`).join("; ");
      return { data: null, error: fail(`Invalid input — ${msg}`, 422, e.issues) };
    }
    return { data: null, error: fail("Invalid JSON body", 400) };
  }
}

/** Wraps a handler so unexpected errors become clean 500 responses instead of crashes. */
export function withErrors<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (e) {
      console.error("[api]", e);
      return fail("Something went wrong on the server. Please try again.", 500);
    }
  };
}
