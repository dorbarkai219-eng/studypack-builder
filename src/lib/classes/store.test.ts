// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { classAdapters } from "@/lib/classes/store";
import { makeJoinCode, type StudyClass } from "@/lib/classes/schema";

const ONE: StudyClass = {
  id: "c-1",
  name: "Finance 101",
  ownerId: "teacher-1",
  packIds: ["hebrew-finance"],
  joinCode: "ABCD23",
  members: [],
  createdAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(async () => {
  // Wipe memory adapter — no public clear, so create fresh entries that
  // don't collide with prior tests.
});

describe("ClassStore — memory adapter", () => {
  it("round-trips a saved class by id + code", async () => {
    const cls: StudyClass = { ...ONE, id: "c-rt", joinCode: "RTROT3" };
    await classAdapters.memory.saveClass(cls);
    expect((await classAdapters.memory.getClass("c-rt"))?.name).toBe(cls.name);
    expect((await classAdapters.memory.getClassByCode("RTROT3"))?.id).toBe(
      "c-rt",
    );
  });

  it("listClassesOwnedBy returns only the caller's classes", async () => {
    await classAdapters.memory.saveClass({
      ...ONE,
      id: "c-own-a",
      joinCode: "OWNA22",
      ownerId: "teacher-a",
    });
    await classAdapters.memory.saveClass({
      ...ONE,
      id: "c-own-b",
      joinCode: "OWNB22",
      ownerId: "teacher-b",
    });
    const a = await classAdapters.memory.listClassesOwnedBy("teacher-a");
    expect(a.some((c) => c.id === "c-own-a")).toBe(true);
    expect(a.some((c) => c.id === "c-own-b")).toBe(false);
  });

  it("listClassesMemberOf returns classes the user is a member of", async () => {
    await classAdapters.memory.saveClass({
      ...ONE,
      id: "c-mem",
      joinCode: "MEMER2",
      members: [
        { userId: "student-1", joinedAt: new Date().toISOString() },
      ],
    });
    const list = await classAdapters.memory.listClassesMemberOf("student-1");
    expect(list.some((c) => c.id === "c-mem")).toBe(true);
  });

  it("deleteClass removes by id and clears the code index", async () => {
    await classAdapters.memory.saveClass({
      ...ONE,
      id: "c-del",
      joinCode: "DELXX2",
    });
    expect(await classAdapters.memory.deleteClass("c-del")).toBe(true);
    expect(await classAdapters.memory.getClass("c-del")).toBeUndefined();
    expect(await classAdapters.memory.getClassByCode("DELXX2")).toBeUndefined();
    expect(await classAdapters.memory.deleteClass("c-del")).toBe(false);
  });

  it("rejects invalid ids (traversal guard)", async () => {
    await expect(
      classAdapters.memory.saveClass({ ...ONE, id: "../etc", joinCode: "BADBA2" }),
    ).rejects.toThrow(/invalid class id/);
  });

  it("rejects invalid codes", async () => {
    await expect(
      classAdapters.memory.saveClass({ ...ONE, id: "c-badc", joinCode: "abc!" }),
    ).rejects.toThrow(/invalid join code/);
  });
});

describe("makeJoinCode", () => {
  it("generates a 6-char A-Z 0-9 code each call", () => {
    for (let i = 0; i < 50; i++) {
      expect(makeJoinCode()).toMatch(/^[A-Z0-9]{6}$/);
    }
  });
});
