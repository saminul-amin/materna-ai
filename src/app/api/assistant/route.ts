import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { ok, parseBody, withErrors } from "@/lib/api-helpers";
import { ASSISTANT_DISCLAIMER, buildContext, llmAnswer, ruleBasedAnswer } from "@/lib/assistant";

const schema = z.object({
  message: z.string().trim().min(1).max(1500),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(3000) })).max(20).default([]),
});

export const POST = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const ctx = await buildContext(user.id);

  let mode: "llm" | "prototype" = "prototype";
  let answer: string | null = null;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      answer = await llmAnswer(data.message, data.history ?? [], ctx);
      if (answer) mode = "llm";
    } catch (e) {
      console.warn("[assistant] LLM unavailable, falling back to prototype:", (e as Error).message);
    }
  }
  if (!answer) answer = ruleBasedAnswer(data.message, ctx);

  return ok({ answer, mode, disclaimer: ASSISTANT_DISCLAIMER, contextSummary: { week: ctx.week, latestBp: ctx.latest.bp ?? null, observations: ctx.observations.length, documents: ctx.documents.length } });
});

export const GET = withErrors(async () => {
  const { user, response } = await requireUser();
  if (!user) return response;
  return ok({ mode: process.env.ANTHROPIC_API_KEY ? "llm" : "prototype", disclaimer: ASSISTANT_DISCLAIMER });
});
