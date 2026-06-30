// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/coursepack/registry", () => ({
  getPack: vi.fn(),
  listPacks: vi.fn().mockResolvedValue([]),
  listMockPackIds: vi.fn().mockReturnValue([]),
}));
vi.mock("@/lib/feedback/grade", async () => {
  const actual = await vi.importActual<typeof import("@/lib/feedback/grade")>(
    "@/lib/feedback/grade",
  );
  return { ...actual, gradeSubmission: vi.fn() };
});

import { POST } from "@/app/api/feedback/route";
import { getPack } from "@/lib/coursepack/registry";
import { gradeSubmission } from "@/lib/feedback/grade";
import { resetRateLimit } from "@/lib/ingest/rateLimit";
import { hebrewFinancePack } from "@/lib/coursepack/mocks/hebrew-finance";

const getMock = vi.mocked(getPack);
const gradeMock = vi.mocked(gradeSubmission);

const SAMPLE_FB = {
  steps: [],
  fellIntoTopTrap: false,
  rubricCovered: [],
  rubricMissed: [],
  scores: { approach: 8, execution: 7, interpretation: 6 },
  summary: "ok",
  confidence: 0.9,
};

beforeEach(() => {
  getMock.mockReset();
  gradeMock.mockReset();
  resetRateLimit();
});

const body = (overrides: Partial<Record<string, unknown>> = {}) =>
  JSON.stringify({
    packId: "hebrew-finance",
    blockId: "A",
    itemId: "A-1",
    submission: "x = 1",
    ...overrides,
  });

const req = (b: string) =>
  new Request("http://x/api/feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: b,
  });

describe("POST /api/feedback", () => {
  it("400 on invalid JSON body", async () => {
    const r = await POST(
      new Request("http://x/api/feedback", { method: "POST", body: "not json" }),
    );
    expect(r.status).toBe(400);
  });

  it("400 on invalid packId shape", async () => {
    const r = await POST(req(body({ packId: "Bad!" })));
    expect(r.status).toBe(400);
  });

  it("404 when pack does not exist", async () => {
    getMock.mockResolvedValue(undefined);
    const r = await POST(req(body()));
    expect(r.status).toBe(404);
  });

  it("404 when block does not exist on pack", async () => {
    getMock.mockResolvedValue(hebrewFinancePack);
    const r = await POST(req(body({ blockId: "NOPE" })));
    expect(r.status).toBe(404);
  });

  it("422 when block has no rubric", async () => {
    // Block B has no rubric in the mock (only A does).
    getMock.mockResolvedValue(hebrewFinancePack);
    const r = await POST(req(body({ blockId: "B", itemId: "B-1" })));
    expect(r.status).toBe(422);
  });

  it("404 when practice item id is unknown on a rubric'd block", async () => {
    getMock.mockResolvedValue(hebrewFinancePack);
    const r = await POST(req(body({ itemId: "A-999" })));
    expect(r.status).toBe(404);
  });

  it("200 + feedback on the happy path", async () => {
    getMock.mockResolvedValue(hebrewFinancePack);
    gradeMock.mockResolvedValue(SAMPLE_FB);
    const r = await POST(req(body()));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, feedback: SAMPLE_FB });
    expect(gradeMock).toHaveBeenCalledOnce();
  });

  it("503 when the grader reports a missing API key", async () => {
    getMock.mockResolvedValue(hebrewFinancePack);
    gradeMock.mockRejectedValue(new Error("ANTHROPIC_API_KEY not set (or no client provided)"));
    const r = await POST(req(body()));
    expect(r.status).toBe(503);
  });

  it("500 on any other grader failure", async () => {
    getMock.mockResolvedValue(hebrewFinancePack);
    gradeMock.mockRejectedValue(new Error("model timeout"));
    const r = await POST(req(body()));
    expect(r.status).toBe(500);
  });
});
