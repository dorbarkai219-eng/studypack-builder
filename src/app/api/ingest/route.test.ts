// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { englishBiologyPack } from "@/lib/coursepack/mocks/english-biology";

// Mock the structurer + store so the route under test doesn't hit the
// network or the filesystem. Each test re-asserts the call shape.
vi.mock("@/lib/ingest/structure", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ingest/structure")>(
    "@/lib/ingest/structure",
  );
  return {
    ...actual,
    structureCoursePack: vi.fn(),
  };
});
vi.mock("@/lib/coursepack/store", () => ({
  savePack: vi.fn().mockResolvedValue(undefined),
  ensureDir: vi.fn().mockResolvedValue(undefined),
  loadStoredPacks: vi.fn().mockResolvedValue([]),
  getStoredPack: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/ingest/route";
import { structureCoursePack } from "@/lib/ingest/structure";
import { getStoredPack, savePack } from "@/lib/coursepack/store";
import { resetRateLimit } from "@/lib/ingest/rateLimit";

const structureMock = vi.mocked(structureCoursePack);
const saveMock = vi.mocked(savePack);
const getMock = vi.mocked(getStoredPack);

function form(parts: Record<string, string | Blob>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(parts)) f.append(k, v);
  return f;
}

function appendFile(
  fd: FormData,
  name: string,
  bytes: number,
  type = "application/pdf",
): void {
  fd.append("files", new File([new Uint8Array(bytes)], name, { type }));
}

const VALID = {
  id: "test-pack",
  title: "T",
  subject: "S",
  language: "en",
  direction: "ltr",
  examDate: "2027-01-01",
};

beforeEach(() => {
  structureMock.mockReset();
  saveMock.mockReset().mockResolvedValue(undefined);
  getMock.mockReset().mockResolvedValue(undefined);
  resetRateLimit();
});

describe("POST /api/ingest", () => {
  it("400 on invalid pack id", async () => {
    const fd = form({ ...VALID, id: "BadID!", text: "hi" });
    const res = await POST(new Request("http://x/api/ingest", { method: "POST", body: fd }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/id must be lowercase/);
    expect(structureMock).not.toHaveBeenCalled();
  });

  it("400 on malformed examDate", async () => {
    const fd = form({ ...VALID, examDate: "2027/01/01", text: "hi" });
    const res = await POST(new Request("http://x/api/ingest", { method: "POST", body: fd }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/YYYY-MM-DD/);
  });

  it("400 on no files and no text", async () => {
    const fd = form(VALID);
    const res = await POST(new Request("http://x/api/ingest", { method: "POST", body: fd }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/at least one file/i);
  });

  it("413 when a single file exceeds the per-file cap", async () => {
    const fd = form(VALID);
    appendFile(fd, "huge.pdf", 16 * 1024 * 1024); // 16 MB > 15
    const res = await POST(new Request("http://x/api/ingest", { method: "POST", body: fd }));
    expect(res.status).toBe(413);
    expect((await res.json()).error).toMatch(/max 15 MB per file/);
    expect(structureMock).not.toHaveBeenCalled();
  });

  it("413 when combined payload exceeds the per-request cap", async () => {
    const fd = form(VALID);
    appendFile(fd, "a.pdf", 14 * 1024 * 1024);
    appendFile(fd, "b.pdf", 14 * 1024 * 1024); // 28 MB total
    const res = await POST(new Request("http://x/api/ingest", { method: "POST", body: fd }));
    expect(res.status).toBe(413);
    expect((await res.json()).error).toMatch(/Combined upload/);
  });

  it("413 on too many files", async () => {
    const fd = form(VALID);
    for (let i = 0; i < 9; i++) appendFile(fd, `f${i}.pdf`, 100);
    const res = await POST(new Request("http://x/api/ingest", { method: "POST", body: fd }));
    expect(res.status).toBe(413);
    expect((await res.json()).error).toMatch(/Too many files/);
  });

  it("happy path: calls structureCoursePack with the parsed meta, persists, returns the id", async () => {
    structureMock.mockResolvedValue({
      ...englishBiologyPack,
      course: { ...englishBiologyPack.course, id: "test-pack" },
    });
    const fd = form({ ...VALID, text: "lecture notes" });
    const res = await POST(new Request("http://x/api/ingest", { method: "POST", body: fd }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, id: "test-pack" });
    expect(structureMock).toHaveBeenCalledOnce();
    const [filesArg, metaArg] = structureMock.mock.calls[0];
    expect(metaArg.id).toBe("test-pack");
    expect(metaArg.direction).toBe("ltr");
    expect(filesArg.some((f) => f.filename === "pasted.txt")).toBe(true);
    expect(saveMock).toHaveBeenCalledOnce();
  });

  it("503 when the structurer reports a missing API key", async () => {
    structureMock.mockRejectedValue(
      new Error("ANTHROPIC_API_KEY not set (or no client provided)"),
    );
    const fd = form({ ...VALID, text: "hi" });
    const res = await POST(new Request("http://x/api/ingest", { method: "POST", body: fd }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/ANTHROPIC_API_KEY/);
  });

  it("409 when an existing pack with the same id is stored (no overwrite)", async () => {
    getMock.mockResolvedValue({
      ...englishBiologyPack,
      course: { ...englishBiologyPack.course, id: "test-pack" },
    });
    const fd = form({ ...VALID, text: "hi" });
    const res = await POST(new Request("http://x/api/ingest", { method: "POST", body: fd }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/already exists/);
    expect(structureMock).not.toHaveBeenCalled();
  });

  it("allows the call through when overwrite=true even if the pack exists", async () => {
    getMock.mockResolvedValue({
      ...englishBiologyPack,
      course: { ...englishBiologyPack.course, id: "test-pack" },
    });
    structureMock.mockResolvedValue({
      ...englishBiologyPack,
      course: { ...englishBiologyPack.course, id: "test-pack" },
    });
    const fd = form({ ...VALID, text: "hi", overwrite: "true" });
    const res = await POST(new Request("http://x/api/ingest", { method: "POST", body: fd }));
    expect(res.status).toBe(200);
  });

  it("429 once the rate-limit bucket is drained", async () => {
    structureMock.mockResolvedValue({
      ...englishBiologyPack,
      course: { ...englishBiologyPack.course, id: "test-pack" },
    });
    // Default bucket: capacity 5. Hammer 6 from the same IP.
    let last: Response | undefined;
    for (let i = 0; i < 6; i++) {
      const fd = form({ ...VALID, text: "hi" });
      last = await POST(
        new Request("http://x/api/ingest", {
          method: "POST",
          body: fd,
          headers: { "x-forwarded-for": "10.0.0.1" },
        }),
      );
    }
    expect(last?.status).toBe(429);
    expect(last?.headers.get("Retry-After")).toBeTruthy();
  });

  it("500 on any other structurer failure", async () => {
    structureMock.mockRejectedValue(new Error("schema parse failed"));
    const fd = form({ ...VALID, text: "hi" });
    const res = await POST(new Request("http://x/api/ingest", { method: "POST", body: fd }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/schema parse failed/);
  });
});
