// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { adapters } from "@/lib/coursepack/store";
import { englishBiologyPack } from "@/lib/coursepack/mocks/english-biology";

describe("PackStore — memory adapter", () => {
  beforeEach(async () => {
    // Reset state by overwriting every key savePack might have left behind.
    const stored = await adapters.memory.loadStoredPacks();
    for (const p of stored) {
      // No delete API — overwrite then list. Real adapters can ship a delete.
      await adapters.memory.savePack({ ...p, course: { ...p.course, title: "" } });
    }
  });

  it("round-trips a saved pack", async () => {
    const pack = { ...englishBiologyPack, course: { ...englishBiologyPack.course, id: "mem-1" } };
    await adapters.memory.savePack(pack);
    const got = await adapters.memory.getStoredPack("mem-1");
    expect(got?.course.id).toBe("mem-1");
    expect(got?.blocks.length).toBe(pack.blocks.length);
  });

  it("listStoredPacks returns every saved pack", async () => {
    await adapters.memory.savePack({
      ...englishBiologyPack,
      course: { ...englishBiologyPack.course, id: "mem-a" },
    });
    await adapters.memory.savePack({
      ...englishBiologyPack,
      course: { ...englishBiologyPack.course, id: "mem-b" },
    });
    const all = await adapters.memory.loadStoredPacks();
    expect(all.map((p) => p.course.id)).toEqual(
      expect.arrayContaining(["mem-a", "mem-b"]),
    );
  });

  it("getStoredPack returns undefined for an unknown id", async () => {
    expect(await adapters.memory.getStoredPack("does-not-exist")).toBeUndefined();
  });
});
