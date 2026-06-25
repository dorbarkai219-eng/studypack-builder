import "server-only";
import JSZip from "jszip";

/**
 * Text extractors for PPTX and DOCX uploads (spec §4.1).
 *
 * Both formats are Open-XML zips. We pull out only the human-readable
 * runs (PPTX: a:t inside slide XML; DOCX: w:t inside the document body)
 * and reassemble them with structural newlines, then hand the resulting
 * text to Claude as a normal `text` content block — same downstream
 * path as a pasted-text upload.
 *
 * Deliberately stays decode-only (no LLM, no XML schema validation):
 * lossy reasonable extraction is good enough as LLM input. PDF stays
 * on the native `document` content block — Claude reads it directly.
 */

/** Strip a fragment of OOXML to plain text, preserving paragraph breaks. */
function tagText(xml: string, runTag: string, paraTag: string): string {
  // Split on paragraph closes so each chunk becomes one output line.
  const chunks = xml.split(new RegExp(`</${paraTag}>`, "g"));
  const runRe = new RegExp(
    `<${runTag}(?:\\s[^>]*)?>([\\s\\S]*?)</${runTag}>`,
    "g",
  );
  const paragraphs: string[] = [];
  for (const chunk of chunks) {
    const buf: string[] = [];
    let m: RegExpExecArray | null;
    runRe.lastIndex = 0;
    while ((m = runRe.exec(chunk)) !== null) buf.push(decodeXmlEntities(m[1]));
    if (buf.length) paragraphs.push(buf.join(""));
  }
  return paragraphs.join("\n");
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/** Extract text from a .pptx buffer, one slide per labelled section. */
export async function extractPptxText(buf: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buf);
  const entries = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const n = (s: string) => Number(s.match(/slide(\d+)\.xml/)?.[1] ?? 0);
      return n(a) - n(b);
    });
  if (!entries.length) throw new Error("No slide XMLs found in PPTX");
  const out: string[] = [];
  let i = 1;
  for (const name of entries) {
    const xml = await zip.files[name].async("string");
    const text = tagText(xml, "a:t", "a:p").trim();
    out.push(`### Slide ${i}\n\n${text}`);
    i++;
  }
  return out.join("\n\n");
}

/** Extract text from a .docx buffer (paragraphs joined by newlines). */
export async function extractDocxText(buf: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buf);
  const doc = zip.files["word/document.xml"];
  if (!doc) throw new Error("word/document.xml missing from DOCX");
  const xml = await doc.async("string");
  return tagText(xml, "w:t", "w:p").trim();
}

export function detectKind(
  filename: string,
  mime: string,
): "pdf" | "pptx" | "docx" | "text" {
  const f = filename.toLowerCase();
  if (mime === "application/pdf" || f.endsWith(".pdf")) return "pdf";
  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    f.endsWith(".pptx")
  )
    return "pptx";
  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    f.endsWith(".docx")
  )
    return "docx";
  return "text";
}
