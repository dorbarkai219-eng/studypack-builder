import { NextResponse } from "next/server";

/**
 * Liveness probe. Returns 200 + a small JSON payload. Cheap, no
 * dependencies — safe to point a load balancer / uptime monitor at.
 */
export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "studypack-builder",
    timestamp: new Date().toISOString(),
  });
}
