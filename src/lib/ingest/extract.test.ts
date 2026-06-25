// @vitest-environment node
import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import {
  detectKind,
  extractDocxText,
  extractPptxText,
} from "@/lib/ingest/extract";

async function buildPptx(slides: string[]): Promise<Buffer> {
  const zip = new JSZip();
  slides.forEach((body, i) => {
    const xml = `<?xml version="1.0"?><p:sld xmlns:a="x" xmlns:p="x"><p:cSld><p:spTree>${body}</p:spTree></p:cSld></p:sld>`;
    zip.file(`ppt/slides/slide${i + 1}.xml`, xml);
  });
  return Buffer.from(await zip.generateAsync({ type: "nodebuffer" }));
}

async function buildDocx(paragraphs: string[]): Promise<Buffer> {
  const body = paragraphs
    .map(
      (text) =>
        `<w:p><w:r><w:t>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</w:t></w:r></w:p>`,
    )
    .join("");
  const doc = `<?xml version="1.0"?><w:document xmlns:w="x"><w:body>${body}</w:body></w:document>`;
  const zip = new JSZip();
  zip.file("word/document.xml", doc);
  return Buffer.from(await zip.generateAsync({ type: "nodebuffer" }));
}

describe("detectKind", () => {
  it.each([
    ["lecture.pdf", "application/pdf", "pdf"],
    ["lecture.PDF", "", "pdf"],
    ["slides.pptx", "", "pptx"],
    ["paper.docx", "", "docx"],
    ["notes.txt", "text/plain", "text"],
    ["readme", "", "text"],
  ])("%s + %s → %s", (name, mime, expected) => {
    expect(detectKind(name, mime)).toBe(expected);
  });
});

describe("extractPptxText", () => {
  it("extracts each slide's text runs in order, labelled by slide number", async () => {
    const buf = await buildPptx([
      `<a:p><a:r><a:t>Hello</a:t></a:r><a:r><a:t> world</a:t></a:r></a:p>`,
      `<a:p><a:r><a:t>Second slide</a:t></a:r></a:p><a:p><a:r><a:t>Bullet</a:t></a:r></a:p>`,
    ]);
    const text = await extractPptxText(buf);
    expect(text).toMatch(/### Slide 1/);
    expect(text).toMatch(/Hello world/);
    expect(text).toMatch(/### Slide 2/);
    expect(text).toMatch(/Second slide/);
    expect(text).toMatch(/Bullet/);
    expect(text.indexOf("Slide 1")).toBeLessThan(text.indexOf("Slide 2"));
  });

  it("throws when no slides present", async () => {
    const zip = new JSZip();
    zip.file("ppt/presentation.xml", "<x/>");
    const buf = Buffer.from(await zip.generateAsync({ type: "nodebuffer" }));
    await expect(extractPptxText(buf)).rejects.toThrow(/No slide/);
  });
});

describe("extractDocxText", () => {
  it("joins paragraphs with newlines and decodes entities", async () => {
    const buf = await buildDocx(["Hello & welcome", "Line two"]);
    const text = await extractDocxText(buf);
    expect(text).toBe("Hello & welcome\nLine two");
  });

  it("throws when document.xml is missing", async () => {
    const zip = new JSZip();
    zip.file("other.xml", "<x/>");
    const buf = Buffer.from(await zip.generateAsync({ type: "nodebuffer" }));
    await expect(extractDocxText(buf)).rejects.toThrow(/missing/i);
  });
});
