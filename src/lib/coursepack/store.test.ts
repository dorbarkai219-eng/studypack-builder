// @vitest-environment node
import { describe, it, expect } from "vitest";
import { adapters } from "@/lib/coursepack/store";
import { englishBiologyPack } from "@/lib/coursepack/mocks/english-biology";

const USER = "test-user";

describe("PackStore — memory adapter (user-scoped)", () => {
  it("round-trips a saved pack", async () => {
    const pack = {
      ...englishBiologyPack,
      course: { ...englishBiologyPack.course, id: "mem-1" },
    };
    await adapters.memory.savePack(USER, pack);
    const got = await adapters.memory.getStoredPack(USER, "mem-1");
    expect(got?.course.id).toBe("mem-1");
    expect(got?.blocks.length).toBe(pack.blocks.length);
  });

  it("listStoredPacks returns every saved pack for the user", async () => {
    await adapters.memory.savePack(USER, {
      ...englishBiologyPack,
      course: { ...englishBiologyPack.course, id: "mem-a" },
    });
    await adapters.memory.savePack(USER, {
      ...englishBiologyPack,
      course: { ...englishBiologyPack.course, id: "mem-b" },
    });
    const all = await adapters.memory.loadStoredPacks(USER);
    expect(all.map((p) => p.course.id)).toEqual(
      expect.arrayContaining(["mem-a", "mem-b"]),
    );
  });

  it("getStoredPack returns undefined for an unknown id", async () => {
    expect(await adapters.memory.getStoredPack(USER, "does-not-exist")).toBeUndefined();
  });

  it("isolates users — A cannot see B's packs", async () => {
    await adapters.memory.savePack("user-a", {
      ...englishBiologyPack,
      course: { ...englishBiologyPack.course, id: "scoped" },
    });
    expect(await adapters.memory.getStoredPack("user-b", "scoped")).toBeUndefined();
  });

  it("rejects unsafe userIds (path traversal guard)", async () => {
    await expect(
      adapters.memory.savePack("../etc/passwd", englishBiologyPack),
    ).rejects.toThrow(/invalid userId/);
  });

  it("deletePack removes the pack and returns true; false on second call", async () => {
    await adapters.memory.savePack(USER, {
      ...englishBiologyPack,
      course: { ...englishBiologyPack.course, id: "to-delete" },
    });
    expect(await adapters.memory.deletePack(USER, "to-delete")).toBe(true);
    expect(await adapters.memory.deletePack(USER, "to-delete")).toBe(false);
  });
});
