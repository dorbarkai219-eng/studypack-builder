// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { extractJson, structureCoursePack, type IngestMeta } from "@/lib/ingest/structure";
import { englishBiologyPack } from "@/lib/coursepack/mocks/english-biology";

const META: IngestMeta = {
  id: "test-pack",
  title: "Test Course",
  subject: "Tests",
  language: "en",
  direction: "ltr",
  outputLanguage: "en",
  examDate: "2027-01-01",
  weakTopics: [],
};

describe("extractJson", () => {
  it("parses bare JSON object", () => {
    expect(extractJson('  {"a":1}  ')).toEqual({ a: 1 });
  });
  it("strips ```json fences", () => {
    expect(extractJson('```json\n{"a":2}\n```')).toEqual({ a: 2 });
  });
  it("handles surrounding prose + nested braces + strings with braces", () => {
    const text = 'Here you go:\n{"x":{"y":1},"s":"} not end"}\nThanks';
    expect(extractJson(text)).toEqual({ x: { y: 1 }, s: "} not end" });
  });
  it("throws when no JSON present", () => {
    expect(() => extractJson("no json here")).toThrow();
  });
});

describe("structureCoursePack", () => {
  function fakeClient(returnText: string) {
    return {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: "text", text: returnText }],
        }),
      },
    } as unknown as ConstructorParameters<typeof structureCoursePack>[2] extends {
      client?: infer C;
    }
      ? C
      : never;
  }

  it("calls Claude, validates schema, overwrites course + sources with host values", async () => {
    // Reuse the existing mock pack's blocks/summaries as a "good model response".
    const modelReply = JSON.stringify({
      // course + sources will be overwritten — emit garbage to prove that.
      course: { id: "WRONG", title: "WRONG", subject: "x", language: "x", direction: "rtl", examDate: "1999-01-01", weakTopics: [], outputLanguage: "x" },
      sources: [{ id: "garbage", filename: "x", type: "text", pages: 0 }],
      blocks: englishBiologyPack.blocks,
      summaries: englishBiologyPack.summaries,
    });
    const client = fakeClient("```json\n" + modelReply + "\n```");
    const pack = await structureCoursePack(
      [{ filename: "notes.txt", type: "text", data: Buffer.from("hello") }],
      META,
      { client },
    );
    expect(pack.course.id).toBe("test-pack");
    expect(pack.course.title).toBe("Test Course");
    expect(pack.course.direction).toBe("ltr");
    expect(pack.sources[0].id).toBe("src1");
    expect(pack.sources[0].filename).toBe("notes.txt");
    expect(pack.blocks.length).toBeGreaterThan(0);
  });

  it("throws when model returns malformed JSON", async () => {
    const client = fakeClient("definitely not json");
    await expect(
      structureCoursePack(
        [{ filename: "x.txt", type: "text", data: Buffer.from("y") }],
        META,
        { client },
      ),
    ).rejects.toThrow();
  });

  it("throws when no files supplied", async () => {
    const client = fakeClient("{}");
    await expect(structureCoursePack([], META, { client })).rejects.toThrow(
      /No source files/,
    );
  });

  it("rejects model output that fails Zod validation", async () => {
    const reply = JSON.stringify({
      // missing blocks/summaries → Zod fails
      course: { id: "x", title: "x", subject: "x", language: "x", direction: "ltr", examDate: "2000-01-01", weakTopics: [], outputLanguage: "x" },
      sources: [],
    });
    const client = fakeClient(reply);
    await expect(
      structureCoursePack(
        [{ filename: "x.txt", type: "text", data: Buffer.from("y") }],
        META,
        { client },
      ),
    ).rejects.toThrow();
  });
});
