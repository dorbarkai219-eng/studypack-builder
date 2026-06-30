// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { FeedbackSchema, gradeSubmission } from "@/lib/feedback/grade";

const SAMPLE_FEEDBACK = {
  steps: [
    {
      status: "correct" as const,
      what: "Wrote Equity = EV + Excess Cash − Net Debt explicitly.",
      why: "The bridge equation is the right starting point for this question shape.",
    },
    {
      status: "wrong" as const,
      what: "Used gross debt (650) instead of net debt (430).",
      why: "Net Debt is gross debt minus excess cash; the question already provided cash separately.",
      fix: "Compute Net Debt = 650 − 220 = 430, then substitute.",
    },
  ],
  fellIntoTopTrap: true,
  rubricCovered: ["Writes the bridge equation"],
  rubricMissed: ["Uses Net Debt instead of gross debt"],
  scores: { approach: 7, execution: 3, interpretation: 4 },
  summary: "Right method, slipped on net-vs-gross debt.",
  confidence: 0.86,
};

function toolUseClient(input: unknown) {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: "tool_use",
            id: "tu_1",
            name: "submit_feedback",
            input,
          },
        ],
      }),
    },
  } as unknown as Parameters<typeof gradeSubmission>[1]["client"];
}

const GRADE_INPUT = {
  block: { id: "A", title: "Bridge", framing: "Equity vs EV" },
  rubric: {
    mustContain: ["Writes the bridge equation", "Uses Net Debt instead of gross debt"],
    topTrap: "Using gross debt instead of net debt",
    notes: [],
  },
  item: {
    id: "A-1",
    title: "Q4 2024",
    prompt: "Given EV=1800, cash=220, debt=650, find equity.",
    referenceSolution: "Net Debt = 430. Equity = 1800 + 220 − 430 = 1590.",
  },
  submission: "Equity = EV - Debt = 1800 - 650 = 1150.",
};

describe("FeedbackSchema", () => {
  it("accepts a well-formed feedback object", () => {
    expect(() => FeedbackSchema.parse(SAMPLE_FEEDBACK)).not.toThrow();
  });
  it("rejects scores outside 0..10", () => {
    expect(() =>
      FeedbackSchema.parse({
        ...SAMPLE_FEEDBACK,
        scores: { approach: 11, execution: 5, interpretation: 5 },
      }),
    ).toThrow();
  });
  it("rejects confidence outside 0..1", () => {
    expect(() =>
      FeedbackSchema.parse({ ...SAMPLE_FEEDBACK, confidence: 1.5 }),
    ).toThrow();
  });
});

describe("gradeSubmission", () => {
  it("returns Feedback when the model calls submit_feedback on the first turn", async () => {
    const client = toolUseClient(SAMPLE_FEEDBACK);
    const fb = await gradeSubmission(GRADE_INPUT, { client });
    expect(fb.fellIntoTopTrap).toBe(true);
    expect(fb.scores.execution).toBe(3);
    expect(fb.steps).toHaveLength(2);

    type MockedClient = { messages: { create: { mock: { calls: unknown[][] } } } };
    const args = (client as unknown as MockedClient).messages.create.mock
      .calls[0][0] as {
      tools?: Array<{ name: string }>;
      system: Array<{ text: string }>;
    };
    const toolNames = (args.tools ?? []).map((t) => t.name).sort();
    expect(toolNames).toEqual(["calculate", "submit_feedback"]);
    expect(args.system[0].text).toMatch(/diagnose, not just answer/i);
  });

  it("runs the agentic loop: handles calculate calls, then submit_feedback", async () => {
    const calcCall = {
      type: "tool_use",
      id: "tu_calc_1",
      name: "calculate",
      input: { expression: "1800 + 220 - 430" },
    };
    const submitCall = {
      type: "tool_use",
      id: "tu_submit_1",
      name: "submit_feedback",
      input: SAMPLE_FEEDBACK,
    };
    const create = vi
      .fn()
      .mockResolvedValueOnce({ content: [calcCall] })
      .mockResolvedValueOnce({ content: [submitCall] });
    const client = { messages: { create } } as unknown as Parameters<
      typeof gradeSubmission
    >[1]["client"];
    const fb = await gradeSubmission(GRADE_INPUT, { client });
    expect(fb.scores.execution).toBe(3);
    expect(create).toHaveBeenCalledTimes(2);
    const secondCall = create.mock.calls[1][0];
    // Second request includes assistant turn with tool_use + user turn with tool_result.
    const messages = secondCall.messages as Anthropic.MessageParam[];
    expect(messages.length).toBeGreaterThanOrEqual(3);
    const toolResult = (
      messages.at(-1) as { content: Array<{ type: string; content?: string }> }
    ).content[0];
    expect(toolResult.type).toBe("tool_result");
    expect(toolResult.content).toContain("1590"); // 1800 + 220 - 430
  });

  it("throws on empty submission", async () => {
    await expect(
      gradeSubmission(
        { ...GRADE_INPUT, submission: "   " },
        { client: toolUseClient(SAMPLE_FEEDBACK) },
      ),
    ).rejects.toThrow(/Empty submission/);
  });

  it("throws when model fails to call the tool", async () => {
    const client = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: "text", text: "Sorry can't do that" }],
        }),
      },
    } as unknown as Parameters<typeof gradeSubmission>[1]["client"];
    await expect(gradeSubmission(GRADE_INPUT, { client })).rejects.toThrow(
      /submit_feedback/,
    );
  });

  it("rejects malformed tool input via Zod", async () => {
    const client = toolUseClient({
      ...SAMPLE_FEEDBACK,
      scores: { approach: 200, execution: 5, interpretation: 5 },
    });
    await expect(gradeSubmission(GRADE_INPUT, { client })).rejects.toThrow();
  });
});
