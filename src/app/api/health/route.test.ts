// @vitest-environment node
import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns 200 + service identity", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.service).toBe("studypack-builder");
    expect(typeof json.timestamp).toBe("string");
  });
});
