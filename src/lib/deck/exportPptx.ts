import pptxgen from "pptxgenjs";
import type { CoursePack } from "@/lib/coursepack/schema";
import { buildDeck } from "@/lib/deck/buildDeck";
import type { DeckSlide } from "@/lib/deck/types";
import { makeLabels } from "@/lib/i18n/labels";

/**
 * Editable PPTX export of the learning deck (spec §4.3, §8) built from the
 * SAME buildDeck() slide list as the on-screen deck + HTML export.
 *
 * RTL contract (the spec's #1 bug, §6): Hebrew text runs carry rtlMode + are
 * right-aligned, while every formula / Latin / Greek / unit run is emitted as
 * an ISOLATED LTR run (rtlMode:false, mono font). This is the PPTX analogue of
 * the HTML export's `<bdi dir="ltr" style="unicode-bidi:isolate">`, so RTL
 * decks open in PowerPoint/Keynote/Slides with formulas uncorrupted.
 *
 * Deterministic: no Date / random.
 */

/** Design tokens — hex (no #) mirroring globals.css @theme. */
const C = {
  navy: "1F3A5F",
  orange: "E07A2B",
  ink: "16202C",
  muted: "5B6B7B",
  lines: "D8DEE6",
  paper: "FFFFFF",
  fxbg: "16202C",
  fxink: "F2F6FB",
  fxintu: "CDD6E0",
  concept: "2563EB",
  conceptBg: "EFF4FF",
  mistake: "C0322B",
  mistakeBg: "FDECEC",
  tip: "15803D",
  tipBg: "ECFAF0",
  example: "B45309",
  exampleBg: "FDF4E3",
} as const;

const MONO = "Consolas";
const SANS = "Arial";

// LAYOUT_16x9 = 10in × 5.625in.
const PAGE_W = 10;
const MX = 0.5;
const BODY_W = PAGE_W - MX * 2;

type RunOpts = pptxgen.TextPropsOptions;
type Run = { text: string; options: RunOpts };

export async function exportDeckPptx(pack: CoursePack): Promise<Buffer> {
  const slides = buildDeck(pack);
  const { course } = pack;
  const isRtl = course.direction === "rtl";
  const isHe = course.outputLanguage === "he";
  const t = makeLabels(course.outputLanguage);
  const halign: "left" | "right" = isRtl ? "right" : "left";

  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "StudyPack Builder";
  pptx.title = course.title;

  /** Direction-following text run (Hebrew → RTL + right-aligned). */
  const r = (text: string, options: RunOpts = {}): Run => ({
    text,
    options: { rtlMode: isRtl, ...options },
  });
  /** Isolated LTR run — formulas, Latin, Greek, units, transliterations. */
  const lr = (text: string, options: RunOpts = {}): Run => ({
    text,
    options: { rtlMode: false, fontFace: MONO, ...options },
  });
  const stars = (n: number) => (n > 0 ? "★".repeat(n) + " " : "");

  /** Mark the final run of a paragraph so the next run starts a new line. */
  const para = (runs: Run[], opts: RunOpts = {}): Run[] => {
    if (runs.length === 0) return runs;
    return runs.map((run, i) => ({
      text: run.text,
      options: {
        ...run.options,
        ...opts,
        ...(i === runs.length - 1 ? { breakLine: true } : {}),
      },
    }));
  };

  for (const s of slides) {
    const slide = pptx.addSlide();
    slide.background = { color: C.paper };
    const centered = s.kind === "title" || s.kind === "closing";

    if (!centered) {
      // ---- Header: stars + title + (enTitle LTR) ----
      const head: Run[] = [r(stars(s.starLevel) + s.title, { bold: true })];
      if (s.enTitle) head.push(lr(`  (${s.enTitle})`, { fontSize: 14, color: C.muted, bold: false }));
      slide.addText(head, {
        x: MX,
        y: 0.3,
        w: BODY_W,
        h: 0.7,
        align: halign,
        valign: "top",
        fontSize: 26,
        color: C.navy,
        fontFace: SANS,
      });
      // accent rule under the header
      slide.addShape(pptx.ShapeType.line, {
        x: MX,
        y: 1.05,
        w: BODY_W,
        h: 0,
        line: { color: C.lines, width: 1 },
      });
      if (s.subtitle && s.kind !== "concept") {
        slide.addText([r(s.subtitle)], {
          x: MX,
          y: 1.08,
          w: BODY_W,
          h: 0.35,
          align: halign,
          valign: "top",
          fontSize: 12,
          italic: true,
          color: C.muted,
          fontFace: SANS,
        });
      }
    }

    const bodyTop = s.subtitle && s.kind !== "concept" ? 1.5 : 1.2;
    const bodyH = 5.45 - bodyTop;

    /** Place a flowing text box (auto-shrinks to fit). */
    const body = (runs: Run[], extra: Record<string, unknown> = {}) =>
      slide.addText(runs, {
        x: MX,
        y: bodyTop,
        w: BODY_W,
        h: bodyH,
        align: halign,
        valign: "top",
        fontSize: 16,
        color: C.ink,
        fontFace: SANS,
        fit: "shrink",
        lineSpacingMultiple: 1.1,
        ...extra,
      });

    const p = s.payload;
    switch (p.kind) {
      case "title": {
        slide.addText([r(s.title, { bold: true })], {
          x: MX,
          y: 1.7,
          w: BODY_W,
          h: 1.2,
          align: "center",
          fontSize: 40,
          color: C.navy,
          fontFace: SANS,
        });
        slide.addText([r(p.subject)], {
          x: MX,
          y: 3.0,
          w: BODY_W,
          h: 0.6,
          align: "center",
          fontSize: 20,
          color: C.muted,
          fontFace: SANS,
        });
        slide.addText(
          [
            r(`${t("examIn")} `),
            lr(p.examDate),
            r(` · ${p.blockCount} ${isHe ? "נושאים" : "topics"}`),
          ],
          {
            x: 2,
            y: 3.9,
            w: PAGE_W - 4,
            h: 0.6,
            align: "center",
            fontSize: 14,
            bold: true,
            color: C.orange,
            fill: { color: "FBE9DC" },
            fontFace: SANS,
          },
        );
        break;
      }

      case "closing": {
        slide.addText([r(s.title, { bold: true })], {
          x: MX,
          y: 2.0,
          w: BODY_W,
          h: 1.2,
          align: "center",
          fontSize: 36,
          color: C.navy,
          fontFace: SANS,
        });
        slide.addText([lr(p.examDate)], {
          x: MX,
          y: 3.3,
          w: BODY_W,
          h: 0.6,
          align: "center",
          fontSize: 20,
          color: C.muted,
        });
        break;
      }

      case "toc": {
        const runs: Run[] = [];
        p.entries.forEach((e, i) => {
          const line: Run[] = [r(`${i + 1}. ${stars(e.starLevel)}${e.title}`, { color: C.navy, bold: true })];
          if (e.enTitle) line.push(lr(`  (${e.enTitle})`, { color: C.muted, bold: false }));
          runs.push(...para(line));
        });
        body(runs, { fontSize: 15 });
        break;
      }

      case "concept": {
        if (p.concepts.length === 0) {
          body([r(s.subtitle ?? "")], { color: C.muted, italic: true });
          break;
        }
        const runs: Run[] = [];
        for (const c of p.concepts) {
          const term: Run[] = [r(c.term, { bold: true, color: C.navy })];
          if (c.enTerm) term.push(lr(`  (${c.enTerm})`, { color: C.muted, bold: false }));
          runs.push(...para(term));
          runs.push(...para([r(c.explanation, { color: C.ink })]));
          runs.push(...para([r(" ", { fontSize: 6 })])); // spacer
        }
        body(runs);
        break;
      }

      case "formula": {
        let y = bodyTop;
        for (const f of p.formulas) {
          const hasIntu = !!f.intuition;
          const hasTk = f.termKey.length > 0;
          const boxH = 0.7 + (hasIntu ? 0.35 : 0) + (hasTk ? 0.4 : 0);
          slide.addShape(pptx.ShapeType.roundRect, {
            x: MX,
            y,
            w: BODY_W,
            h: boxH,
            fill: { color: C.fxbg },
            line: { color: C.orange, width: 1.5 },
            rectRadius: 0.06,
          });
          slide.addText([lr(f.latexOrText, { color: C.fxink, fontSize: 20, bold: true })], {
            x: MX + 0.2,
            y: y + 0.12,
            w: BODY_W - 0.4,
            h: 0.5,
            align: "left",
            valign: "middle",
            fit: "shrink",
          });
          let inner = y + 0.62;
          if (hasIntu) {
            slide.addText([r(f.intuition, { color: C.fxintu, fontSize: 12 })], {
              x: MX + 0.2,
              y: inner,
              w: BODY_W - 0.4,
              h: 0.32,
              align: halign,
              valign: "top",
              fontFace: SANS,
              fit: "shrink",
            });
            inner += 0.34;
          }
          if (hasTk) {
            const tk: Run[] = [];
            f.termKey.forEach((k, i) => {
              if (i > 0) tk.push(r("  ·  ", { color: "9FB0C2", fontSize: 11 }));
              tk.push(lr(k.symbol, { color: "9FB0C2", fontSize: 11 }));
              tk.push(r(` = ${k.meaning}`, { color: "9FB0C2", fontSize: 11, fontFace: SANS }));
            });
            slide.addText(tk, {
              x: MX + 0.2,
              y: inner,
              w: BODY_W - 0.4,
              h: 0.34,
              align: halign,
              valign: "top",
              fit: "shrink",
            });
          }
          y += boxH + 0.22;
        }
        break;
      }

      case "example": {
        type Callout = { label: string; color: string; bg: string; text: Run[] };
        const items: Callout[] = [];
        for (const e of p.examples) {
          const txt: Run[] = [r(e.text)];
          if (e.sourceRef) txt.push(lr(` [${e.sourceRef}]`, { color: C.muted }));
          items.push({ label: t("example"), color: C.example, bg: C.exampleBg, text: txt });
        }
        for (const m of p.mistakes)
          items.push({ label: t("mistake"), color: C.mistake, bg: C.mistakeBg, text: [r(m)] });
        for (const tp of p.tips)
          items.push({ label: t("tip"), color: C.tip, bg: C.tipBg, text: [r(tp)] });

        const gap = 0.15;
        const h = Math.min(0.95, (bodyH - gap * (items.length - 1)) / Math.max(1, items.length));
        let y = bodyTop;
        for (const it of items) {
          slide.addShape(pptx.ShapeType.roundRect, {
            x: MX,
            y,
            w: BODY_W,
            h,
            fill: { color: it.bg },
            line: { color: it.color, width: 1 },
            rectRadius: 0.04,
          });
          slide.addText(
            [r(it.label.toUpperCase() + "  ", { bold: true, color: it.color, fontSize: 10 }), ...it.text],
            {
              x: MX + 0.15,
              y: y + 0.05,
              w: BODY_W - 0.3,
              h: h - 0.1,
              align: halign,
              valign: "middle",
              fontSize: 13,
              color: C.ink,
              fontFace: SANS,
              fit: "shrink",
            },
          );
          y += h + gap;
        }
        break;
      }

      case "summary-comparisons": {
        const rows: pptxgen.TableRow[] = [];
        const cell = (head: Run, when: string): pptxgen.TableCell => {
          const runs: pptxgen.TextProps[] = [
            { text: head.text, options: { ...head.options, breakLine: true } },
            { text: when, options: { rtlMode: isRtl, fontSize: 11, color: C.muted } },
          ];
          return {
            text: runs,
            options: { align: halign, valign: "top" },
          };
        };
        for (const pr of p.pairs) {
          rows.push([
            {
              text: [{ text: pr.title, options: { bold: true, rtlMode: isRtl } }] as pptxgen.TextProps[],
              options: { fill: { color: "F1F4F8" }, colspan: 2, align: halign },
            },
          ]);
          rows.push([
            cell(lr(pr.left, { bold: true }), `${isHe ? "שמאלי" : "left"}: ${pr.whenLeft}`),
            cell(lr(pr.right, { bold: true }), `${isHe ? "ימני" : "right"}: ${pr.whenRight}`),
          ]);
        }
        slide.addTable(rows, {
          x: MX,
          y: bodyTop,
          w: BODY_W,
          h: bodyH,
          colW: [BODY_W / 2, BODY_W / 2],
          border: { type: "solid", color: C.lines, pt: 1 },
          fontFace: SANS,
          fontSize: 13,
          valign: "top",
        });
        break;
      }

      case "summary-concepts-traps": {
        const runs: Run[] = [];
        if (p.criticalConcepts.length) {
          runs.push(...para([r(t("criticalConcepts"), { bold: true, color: C.concept, fontSize: 16 })]));
          for (const c of p.criticalConcepts)
            runs.push(...para([r(c)], { bullet: true }));
        }
        if (p.traps.length) {
          runs.push(...para([r(t("traps"), { bold: true, color: C.mistake, fontSize: 16 })]));
          for (const tr of p.traps) runs.push(...para([r(tr)], { bullet: true }));
        }
        body(runs, { fontSize: 14 });
        break;
      }

      case "summary-sanity": {
        let y = bodyTop;
        if (p.typicalValues.length) {
          const rows: pptxgen.TableRow[] = [
            [
              { text: t("param"), options: { bold: true, fill: { color: C.navy }, color: C.paper, align: halign } },
              { text: t("range"), options: { bold: true, fill: { color: C.navy }, color: C.paper, align: halign } },
            ],
            ...p.typicalValues.map((v): pptxgen.TableRow => {
              const rangeRuns: pptxgen.TextProps[] = [
                { text: v.range, options: { rtlMode: false, fontFace: MONO } },
              ];
              if (v.note)
                rangeRuns.push({
                  text: `\n${v.note}`,
                  options: { fontSize: 10, color: C.muted, rtlMode: isRtl },
                });
              return [
                {
                  text: [{ text: v.param, options: { rtlMode: isRtl } }] as pptxgen.TextProps[],
                  options: { align: halign },
                },
                { text: rangeRuns, options: { align: halign, valign: "top" } },
              ];
            }),
          ];
          const tblH = Math.min(bodyH * 0.6, 0.4 * (p.typicalValues.length + 1));
          slide.addTable(rows, {
            x: MX,
            y,
            w: BODY_W,
            colW: [BODY_W * 0.45, BODY_W * 0.55],
            border: { type: "solid", color: C.lines, pt: 1 },
            fontFace: SANS,
            fontSize: 13,
            valign: "top",
          });
          y += tblH + 0.25;
        }
        if (p.checklist.length) {
          const runs: Run[] = [
            ...para([r(t("checklist"), { bold: true, color: C.tip, fontSize: 14 })]),
          ];
          for (const c of p.checklist) runs.push(...para([r(c)], { bullet: true }));
          slide.addText(runs, {
            x: MX,
            y,
            w: BODY_W,
            h: 5.45 - y,
            align: halign,
            valign: "top",
            fontSize: 13,
            color: C.ink,
            fontFace: SANS,
            fit: "shrink",
          });
        }
        break;
      }
    }
  }

  const out = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return out;
}
