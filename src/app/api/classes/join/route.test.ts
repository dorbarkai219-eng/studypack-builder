// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { StudyClass } from "@/lib/classes/schema";

vi.mock("@/lib/classes/store", () => ({
  getClassByCode: vi.fn(),
  saveClass: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/classes/join/route";
import { getClassByCode, saveClass } from "@/lib/classes/store";

const getMock = vi.mocked(getClassByCode);
const saveMock = vi.mocked(saveClass);

const CLASS: StudyClass = {
  id: "c-1",
  name: "Demo",
  ownerId: "teacher-x",
  packIds: [],
  joinCode: "ABCDE2",
  members: [],
  createdAt: "2026-01-01T00:00:00.000Z",
};

const req = (body: unknown) =>
  new Request("http://x/api/classes/join", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  getMock.mockReset();
  saveMock.mockReset().mockResolvedValue(undefined);
});

describe("POST /api/classes/join", () => {
  it("400 on bad code shape", async () => {
    const r = await POST(req({ code: "abc" }));
    expect(r.status).toBe(400);
  });

  it("404 when no class with that code", async () => {
    getMock.mockResolvedValue(undefined);
    const r = await POST(req({ code: "NOPENO" }));
    expect(r.status).toBe(404);
  });

  it("200 + adds member on first join", async () => {
    getMock.mockResolvedValue({ ...CLASS, members: [] });
    const r = await POST(req({ code: "ABCDE2", label: "Dor" }));
    expect(r.status).toBe(200);
    const j = (await r.json()) as { ok: boolean; class: StudyClass };
    expect(j.ok).toBe(true);
    expect(j.class.members.length).toBe(1);
    expect(j.class.members[0].label).toBe("Dor");
    expect(saveMock).toHaveBeenCalledOnce();
  });

  it("200 + alreadyMember when joining twice", async () => {
    getMock.mockResolvedValue({
      ...CLASS,
      members: [{ userId: "demo-user-dev", joinedAt: "2026-01-02T00:00:00Z" }],
    });
    const r = await POST(req({ code: "ABCDE2" }));
    expect(r.status).toBe(200);
    const j = (await r.json()) as { alreadyMember: boolean };
    expect(j.alreadyMember).toBe(true);
    expect(saveMock).not.toHaveBeenCalled();
  });

  it("409 when the owner tries to join their own class", async () => {
    // getUserId() returns "demo-user-dev" when Clerk is off — set ownerId to match.
    getMock.mockResolvedValue({ ...CLASS, ownerId: "demo-user-dev" });
    const r = await POST(req({ code: "ABCDE2" }));
    expect(r.status).toBe(409);
  });
});
