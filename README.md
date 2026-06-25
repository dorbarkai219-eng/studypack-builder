# StudyPack Builder

Turn raw course materials + an exam date into three coordinated,
mutually-consistent study artifacts from **one** `CoursePack` model:

| Artifact | Route | What it is |
| --- | --- | --- |
| **Cheat sheet** | `/cheatsheet/[packId]` | Print-perfect formula sheet, 1-page / 2-page / detailed density, `window.print()` to PDF |
| **Learning deck** | `/deck/[packId]` | Interactive presentation: title → TOC → concept / formula / example / summary slides → closing. Keyboard nav, dir-aware |
| **Deck — HTML** | `/deck/[packId]/export` | Single self-contained `.html` (inline CSS + vanilla JS, zero external refs) for offline study |
| **Deck — PowerPoint** | `/deck/[packId]/export-pptx` | Editable `.pptx` with `rtlMode` + isolated LTR formula runs (PowerPoint / Keynote / Google Slides) |
| **Study plan** | `/plan/[packId]` | Day-by-day countdown plan, slide-aligned, localStorage progress |
| **Verify** | `/verify/[packId]` | Anti-hallucination audit: provenance + structure + plan↔deck alignment with severity-tagged findings |
| **Ingest** | `/ingest` | Upload PDFs / PPTX / DOCX / text → Claude structures into a CoursePack JSON |

Works for any subject, any language. First-class RTL support — Hebrew
pages render formulas LTR-correct via `<bdi unicode-bidi:isolate>` on the
screen and `rtlMode:false` LTR runs in the PPTX export, so `R_e = R_f + β
× MRP` and `ROIC + הקשר הזהוב` stay uncorrupted across every output.

## Quick start

```bash
npm install
cp .env.example .env.local        # then set ANTHROPIC_API_KEY
npm run dev                       # http://localhost:3000
```

Two mock packs ship with the repo so every artifact is browsable without
calling the LLM:

- `hebrew-finance` — RTL Hebrew corporate finance
- `english-biology` — LTR English cell biology

## Real ingestion

Visit `/ingest`. Upload PDFs (Claude reads them via the native
`document` content block — no local `pdf-parse`), PPTX (slide-XML text
runs extracted via JSZip), DOCX (`word/document.xml` text runs), or
paste raw text. Provide the course metadata, hit Ingest, and the
resulting CoursePack lands in `data/packs/{id}.json` and is immediately
browsable at all the artifact routes.

Requires `ANTHROPIC_API_KEY` in the server env. Optional
`ANTHROPIC_MODEL` overrides the default (`claude-sonnet-4-5`).

## Architecture

```
CoursePack (Zod schema, single source of truth)
        │
        ├──▶ buildDeck(pack)   ──▶ DeckSlide[]  ──▶ /deck UI · HTML export · PPTX export
        ├──▶ buildPlan(pack,n) ──▶ PlanDay[]    ──▶ /plan UI
        ├──▶ /cheatsheet UI (renders blocks + summaries directly)
        └──▶ verifyPack(pack)  ──▶ VerifyReport ──▶ /verify UI
```

Every renderer reads the same `CoursePack`, so the four artifacts can't
drift — fix a typo in one block and the cheat sheet, deck, plan and
verifier all update together.

- `src/lib/coursepack/schema.ts` — the Zod schema. **The single source of truth.**
- `src/lib/deck/buildDeck.ts` — deck structure (stable ids, heavy-block
  splitting, deterministic).
- `src/lib/plan/buildPlan.ts` — countdown plan: weights starred / weak
  blocks, reserves last 1–2 days for mock exams with no new material,
  aligns slideRefs to deck titles.
- `src/lib/verify/verifyPack.ts` — anti-hallucination audit (spec §7).
- `src/lib/ingest/structure.ts` — Claude-API CoursePack structurer
  (injectable client; Zod-validated; host-controlled `course` and
  `sources` so the model can't rename a pack or invent a source id).
- `src/lib/ingest/extract.ts` — PPTX / DOCX text extractors via JSZip.

## RTL contract — the spec's #1 bug

Latin / Greek / math inside a Hebrew page reorders under the bidi
algorithm unless every such run is isolated. The repo enforces one
contract end-to-end:

- **Screen** (`Ltr.tsx`): `<bdi dir="ltr" style="unicode-bidi:isolate">`
- **HTML export**: same `<bdi>` markup, baked into the inline stylesheet
- **PPTX export**: per-run `rtlMode: false`, monospace, separate
  pPr — verified in the generated `slide{N}.xml`

A formula carrying Hebrew (`מחיר = כמות × עלות`) on an RTL pack is a
spec-bug attractor — the verifier raises a `formula_has_hebrew` warning
so it can't ship silently.

## Scripts

```bash
npm run dev      # next dev (Turbopack)
npm run build    # next build
npm test         # vitest (75 tests)
npm run lint
```

## Tests

Vitest, jsdom for component tests, Node env for filesystem / Anthropic
SDK integration (PPTX builder, extractors, structurer with a mocked SDK).
`vitest.stubs/server-only.ts` lets `import "server-only"` modules load
under the test runner.

## Spec compliance

Built against an internal spec (see `nested-wibbling-karp.md` plan
file). Sections honoured throughout the codebase:

- **§3** — methodology (blocks, framing, explain-don't-bullet, per-box term keys, confusing pairs, sanity nets, plan↔deck alignment)
- **§4.1** — ingestion pipeline (M2 + M2b)
- **§4.3** — learning deck split heavy blocks, scrollable slides
- **§4.5** — day-by-day countdown plan
- **§6** — i18n / RTL bidi isolation (THE non-negotiable rule)
- **§7** — anti-hallucination (per-claim sourceRef, verify route)
- **§11** — acceptance criteria
