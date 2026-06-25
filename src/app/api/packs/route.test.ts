// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { englishBiologyPack } from "@/lib/coursepack/mocks/english-biology";
import { hebrewFinancePack } from "@/lib/coursepack/mocks/hebrew-finance";

vi.mock("@/lib/coursepack/registry", () => ({
  listPacks: vi.fn().mockResolvedValue([englishBiologyPack, hebrewFinancePack]),
  getPack: vi.fn(),
}));

import { GET } from "@/app/api/packs/route";

describe("GET /api/packs", () => {
  it("returns one entry per pack with the identifying fields only", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const { packs } = (await res.json()) as {
      packs: { id: string; title: string; direction: string; blockCount: number }[];
    };
    expect(packs).toHaveLength(2);
    const ids = packs.map((p) => p.id);
    expect(ids).toContain("english-biology");
    expect(ids).toContain("hebrew-finance");
    // Identifying fields only — should NOT carry the full blocks payload.
    for (const p of packs) {
      expect(p).toHaveProperty("direction");
      expect(p).toHaveProperty("blockCount");
      expect((p as Record<string, unknown>).blocks).toBeUndefined();
    }
  });
});
