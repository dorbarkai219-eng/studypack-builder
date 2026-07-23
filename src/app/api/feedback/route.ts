import { NextResponse } from "next/server";
import { z } from "zod";
import { getPack } from "@/lib/coursepack/registry";
import { gradeSubmission } from "@/lib/feedback/grade";
import { checkRateLimit } from "@/lib/ingest/rateLimit";
import { getUserId } from "@/lib/auth/userId";

export const runtime = "nodejs";
// Grading is fast (~5-15s) compared to ingestion; 60s is plenty.
export const maxDuration = 60;

const RequestSchema = z.object({
  packId: z.string().regex(/^[a-z0-9][a-z0-9-]{1,40}$/),
  blockId: z.string(),
  itemId: z.string(),
  submission: z.string().min(1).max(20_000),
});

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  // Grading is cheaper than ingest but still a paid model call — rate limit
  // a bit more loosely than ingest.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const limit = checkRateLimit(`feedback:${userId}:${ip}`, {
    capacity: 10,
    refillPerSecond: 10 / 60,
  });
  if (!limit.ok)
    return NextResponse.json(
      { error: `Rate limited — retry in ${limit.retryAfterSeconds}s` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );

  const pack = await getPack(parsed.data.packId);
  if (!pack)
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  const block = pack.blocks.find((b) => b.id === parsed.data.blockId);
  if (!block)
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  if (!block.rubric)
    return NextResponse.json(
      { error: "This block has no rubric — practice not available" },
      { status: 422 },
    );
  const item = block.practiceItems.find((it) => it.id === parsed.data.itemId);
  if (!item)
    return NextResponse.json(
      { error: "Practice item not found on this block" },
      { status: 404 },
    );

  try {
    const feedback = await gradeSubmission({
      block: { id: block.id, title: block.title, framing: block.framing },
      rubric: block.rubric,
      item: {
        id: item.id,
        title: item.title,
        prompt: item.prompt,
        referenceSolution: item.referenceSolution,
      },
      submission: parsed.data.submission,
      outputLanguage: pack.course.outputLanguage,
    });
    return NextResponse.json({ ok: true, feedback });
  } catch (err) {
    // Log the real error server-side; return a generic message so internal
    // detail (paths, model names, SDK internals) never leaks to the client.
    console.error("[feedback/grade] failed:", err);
    const raw = err instanceof Error ? err.message : "";
    const isKeyIssue = /ANTHROPIC_API_KEY/.test(raw);
    return NextResponse.json(
      { error: isKeyIssue ? "שירות המשוב אינו מוגדר כרגע" : "מתן המשוב נכשל, נסה שוב" },
      { status: isKeyIssue ? 503 : 500 },
    );
  }
}
