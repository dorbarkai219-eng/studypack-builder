import { NextResponse } from "next/server";
import { activeStoreKind } from "@/lib/coursepack/store";

/**
 * Liveness probe. Returns 200 + a small JSON payload. Cheap, no
 * dependencies — safe to point a load balancer / uptime monitor at.
 * `store` reports the active persistence adapter (no secrets) so we can
 * confirm a durable Redis store is wired without guessing.
 */
export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "studypack-builder",
    store: activeStoreKind(),
    // Whether the paid AI features (import + tutor feedback) are configured.
    // Boolean only — never exposes the key itself.
    ai: Boolean(process.env.ANTHROPIC_API_KEY),
    timestamp: new Date().toISOString(),
  });
}
