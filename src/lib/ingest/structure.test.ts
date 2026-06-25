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

  function toolUseClient(input: unknown) {
    return {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "tool_use",
              id: "tu_1",
              name: "submit_course_pack",
              input,
            },
          ],
        }),
      },
    } as unknown as ConstructorParameters<typeof structureCoursePack>[2] extends {
      client?: infer C;
    }
      ? C
      : never;
  }

  it("calls Claude with the submit_course_pack tool forced, validates, overwrites course + sources", async () => {
    const client = toolUseClient({
      blocks: englishBiologyPack.blocks,
      summaries: englishBiologyPack.summaries,
    });
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
    // Tool was forced.
    const args = (
      client as unknown as { messages: { create: { mock: { calls: Array<Array<{ tool_choice?: { type: string; name: string }; tools?: Array<{ name: string }> }>> } } } }
    ).messages.create.mock.calls[0][0];
    expect(args.tool_choice).toEqual({ type: "tool", name: "submit_course_pack" });
    expect(args.tools?.[0].name).toBe("submit_course_pack");
  });

  it("falls back to extractJson when the model emits text instead of a tool call", async () => {
    const fallback = JSON.stringify({
      blocks: englishBiologyPack.blocks,
      summaries: englishBiologyPack.summaries,
    });
    const client = fakeClient("```json\n" + fallback + "\n```");
    const pack = await structureCoursePack(
      [{ filename: "n.txt", type: "text", data: Buffer.from("hello") }],
      META,
      { client },
    );
    expect(pack.course.id).toBe("test-pack");
  });

  it("throws when model returns malformed JSON (no tool call either)", async () => {
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

  it("retries once on malformed JSON and succeeds on the second attempt", async () => {
    const good = JSON.stringify({
      course: { id: "x", title: "x", subject: "x", language: "x", direction: "ltr", examDate: "2000-01-01", weakTopics: [], outputLanguage: "x" },
      sources: [],
      blocks: englishBiologyPack.blocks,
      summaries: englishBiologyPack.summaries,
    });
    const create = vi
      .fn()
      .mockResolvedValueOnce({ content: [{ type: "text", text: "absolute nonsense" }] })
      .mockResolvedValueOnce({ content: [{ type: "text", text: good }] });
    const client = { messages: { create } } as unknown as ConstructorParameters<typeof structureCoursePack>[2] extends { client?: infer C } ? C : never;
    const pack = await structureCoursePack(
      [{ filename: "n.txt", type: "text", data: Buffer.from("y") }],
      META,
      { client },
    );
    expect(pack.course.id).toBe("test-pack");
    expect(create).toHaveBeenCalledTimes(2);
    // Second call carried the corrective hint.
    const secondMessages = create.mock.calls[1][0].messages;
    expect(secondMessages.at(-1).content).toMatch(/could not be parsed/);
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
