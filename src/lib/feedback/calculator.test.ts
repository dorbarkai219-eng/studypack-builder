// @vitest-environment node
import { describe, it, expect } from "vitest";
import { calculate } from "@/lib/feedback/calculator";

describe("calculate (deterministic math)", () => {
  it("evaluates simple arithmetic", () => {
    expect(calculate("1800 + 220 - 430")).toMatchObject({ ok: true, result: "1590" });
    expect(calculate("(100 * (1 - 0.03/0.15)) / (0.09 - 0.03)")).toMatchObject({
      ok: true,
    });
  });

  it("trims float noise", () => {
    expect(calculate("0.1 + 0.2").result).toBe("0.3");
  });

  it("handles sqrt and pi", () => {
    const r = calculate("sqrt(2)");
    expect(r.ok).toBe(true);
    expect(Number(r.result)).toBeCloseTo(Math.SQRT2, 8);
  });

  it("rejects empty / oversize expressions", () => {
    expect(calculate("").ok).toBe(false);
    expect(calculate("   ").ok).toBe(false);
    expect(calculate("1+".repeat(2000) + "1").ok).toBe(false);
  });

  it("blocks import (defence-in-depth)", () => {
    const r = calculate('import({a: 1}, "math")');
    expect(r.ok).toBe(false);
  });

  it("returns ok=false for non-finite results without throwing", () => {
    expect(calculate("1/0").ok).toBe(false); // Infinity
    expect(calculate("0/0").ok).toBe(false); // NaN
  });

  it("surfaces parse errors as ok:false", () => {
    expect(calculate("hello world").ok).toBe(false);
  });
});
