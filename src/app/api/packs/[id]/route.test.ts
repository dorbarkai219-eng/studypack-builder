// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { englishBiologyPack } from "@/lib/coursepack/mocks/english-biology";

vi.mock("@/lib/coursepack/store", () => ({
  savePack: vi.fn().mockResolvedValue(undefined),
  loadStoredPacks: vi.fn().mockResolvedValue([]),
  getStoredPack: vi.fn().mockResolvedValue(undefined),
  deletePack: vi.fn().mockResolvedValue(false),
}));

import { GET, DELETE } from "@/app/api/packs/[id]/route";
import { deletePack, getStoredPack } from "@/lib/coursepack/store";

const getMock = vi.mocked(getStoredPack);
const delMock = vi.mocked(deletePack);

const mkParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  getMock.mockReset().mockResolvedValue(undefined);
  delMock.mockReset().mockResolvedValue(false);
});

describe("GET /api/packs/[id]", () => {
  it("400 on invalid id", async () => {
    const res = await GET(new Request("http://x"), mkParams("Bad!"));
    expect(res.status).toBe(400);
  });
  it("404 when the pack does not exist", async () => {
    const res = await GET(new Request("http://x"), mkParams("missing"));
    expect(res.status).toBe(404);
  });
  it("200 + CoursePack JSON when stored", async () => {
    getMock.mockResolvedValue(englishBiologyPack);
    const res = await GET(new Request("http://x"), mkParams("english-biology"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.course.id).toBe(englishBiologyPack.course.id);
  });
});

describe("DELETE /api/packs/[id]", () => {
  it("400 on invalid id", async () => {
    const res = await DELETE(new Request("http://x"), mkParams("X!"));
    expect(res.status).toBe(400);
  });
  it("404 when nothing to delete", async () => {
    const res = await DELETE(new Request("http://x"), mkParams("nope"));
    expect(res.status).toBe(404);
  });
  it("200 + { ok:true } when delete succeeded", async () => {
    delMock.mockResolvedValue(true);
    const res = await DELETE(new Request("http://x"), mkParams("english-biology"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, id: "english-biology" });
  });
});
