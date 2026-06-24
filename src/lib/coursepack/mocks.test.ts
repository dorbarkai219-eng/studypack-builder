import { describe, it, expect } from "vitest";
import { CoursePackSchema } from "@/lib/coursepack/schema";
import { hebrewFinancePack } from "@/lib/coursepack/mocks/hebrew-finance";
import { englishBiologyPack } from "@/lib/coursepack/mocks/english-biology";

describe("mock CoursePacks validate against the schema (spec §11)", () => {
  it("hebrew-finance parses", () => {
    expect(() => CoursePackSchema.parse(hebrewFinancePack)).not.toThrow();
  });

  it("english-biology parses", () => {
    expect(() => CoursePackSchema.parse(englishBiologyPack)).not.toThrow();
  });

  it("covers both directions for genericity (§11 #8)", () => {
    expect(hebrewFinancePack.course.direction).toBe("rtl");
    expect(englishBiologyPack.course.direction).toBe("ltr");
  });

  it("every deck slide references an existing block (plan↔deck integrity)", () => {
    for (const pack of [hebrewFinancePack, englishBiologyPack]) {
      const blockIds = new Set(pack.blocks.map((b) => b.id));
      for (const slide of pack.deck.slides) {
        expect(blockIds.has(slide.blockId)).toBe(true);
      }
    }
  });
});
