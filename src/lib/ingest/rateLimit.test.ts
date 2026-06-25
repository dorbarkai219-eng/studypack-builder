// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimit } from "@/lib/ingest/rateLimit";

beforeEach(() => resetRateLimit());

describe("checkRateLimit (token bucket)", () => {
  const config = { capacity: 3, refillPerSecond: 1 };

  it("allows up to capacity bursts then rejects", () => {
    const t0 = 1_000_000;
    expect(checkRateLimit("ip-1", config, t0).ok).toBe(true);
    expect(checkRateLimit("ip-1", config, t0).ok).toBe(true);
    expect(checkRateLimit("ip-1", config, t0).ok).toBe(true);
    const fourth = checkRateLimit("ip-1", config, t0);
    expect(fourth.ok).toBe(false);
    expect(fourth.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("refills after time passes", () => {
    const t0 = 2_000_000;
    // drain
    checkRateLimit("ip-2", config, t0);
    checkRateLimit("ip-2", config, t0);
    checkRateLimit("ip-2", config, t0);
    expect(checkRateLimit("ip-2", config, t0).ok).toBe(false);
    // 2s later, ≥2 tokens back
    const later = t0 + 2_000;
    expect(checkRateLimit("ip-2", config, later).ok).toBe(true);
    expect(checkRateLimit("ip-2", config, later).ok).toBe(true);
  });

  it("buckets are per-key", () => {
    const t0 = 3_000_000;
    expect(checkRateLimit("a", config, t0).ok).toBe(true);
    expect(checkRateLimit("b", config, t0).ok).toBe(true);
    // each gets its own bucket
    for (let i = 0; i < 3; i++) checkRateLimit("a", config, t0);
    expect(checkRateLimit("a", config, t0).ok).toBe(false);
    expect(checkRateLimit("b", config, t0).ok).toBe(true);
  });
});
