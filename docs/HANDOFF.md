# Project Handoff — StudyPack Builder (for Claude Code)

> **למשתמש (עברית):** זה מסמך מסירה (Handoff) שמסכם את כל מה שעשינו כאן והופך אותו לבסיס לבניית הפרויקט. **איך לשלוח ל‑Claude Code:** צרף את שלושת אלה יחד — (1) המסמך הזה, (2) `PROMPT_StudyPack_Builder.md` (הספֵק ההנדסי המלא), ו‑(3) ארבעת קובצי ה‑HTML שבנינו כדוגמאות איכות (`מצגת_הכנה_מעוצבת.html`, `דף_נוסחאות_מעוצב.html`, `תכנית_למידה_14_יום.html`, `תרגול_ומשוב.html`). ואז הדבק את "Kickoff prompt" שבסעיף 1.

---

## 1. Kickoff prompt — paste this into Claude Code first
```
You are building a web platform called StudyPack Builder. I'm attaching four things:
1. This handoff (context, methodology, hard lessons, priorities).
2. PROMPT_StudyPack_Builder.md — the complete engineering spec. Treat its sections 3, 6, 7, 11 as non-negotiable requirements; the tech stack is your call.
3. Four HTML files we hand-built for one real course — these are the QUALITY BENCHMARK for the four pillars. Open and study them; the generated output must match or exceed their clarity, design, RTL correctness, and print behavior.
4. (Optional) a SWOT/strategy file explaining the risks to design around.

Goal: generalize what those four hand-built files do into an app that produces them automatically from any student's uploaded course materials + exam date, and then coaches the student with rubric-based feedback.

Start by: (a) reading the handoff + spec + the 4 example files, (b) asking me any clarifying questions, (c) proposing the milestone plan from the spec's section 12, then build incrementally. Ship the cheat-sheet renderer first (it exercises the hardest RTL + print rules), validated against דף_נוסחאות_מעוצב.html.
```

## 2. Origin & context — what happened in this session
We hand-built a complete, polished **exam-prep kit** for one real course: **"הערכת שווי חברות" (Company Valuation), lecturer Udi Levkovich**, Hebrew, RTL, finance/math heavy. We started from the lecturer's raw materials (5 lecture decks, 5 exercises, two sample exams, one past exam, formula sheets) and iteratively produced a designed presentation, an elegant formula sheet, a study plan, and a practice‑feedback loop. Through that iteration we discovered a repeatable **methodology** and hit real **hard lessons** (RTL formula corruption, print collapse, etc.). The goal now: **productize this into a platform** any student can use for any course, and distribute it.

## 3. Reference artifacts — the working spec (match this quality)
These files exist in the project folder and are the gold standard for each pillar:
- **`מצגת_הכנה_מעוצבת.html`** — Pillar 1, the learning deck. Per‑topic slides (blocks A–J), each concept explained (not just bulleted), each formula with an intuition line, color callouts (key/tip/mistake/example), star‑tagged heavy topics, summary slides, keyboard nav. RTL with LTR‑isolated formulas.
- **`דף_נוסחאות_מעוצב.html`** — Pillar 2, the cheat sheet. Topic boxes, each starting with a **term‑key** defining its symbols; "confusing formulas side‑by‑side"; traps; checklist; typical‑values table. **Prints to exactly 2 A4 pages in two columns.**
- **`תכנית_למידה_14_יום.html`** — Pillar 3, the study plan. Day‑by‑day countdown, each day references the **exact deck slides** and a prominent **"open for practice"** line naming the exact exercise/past‑exam question. Checkboxes persist (localStorage).
- **`תרגול_ומשוב.html`** — Pillar 4, practice + feedback. Per‑topic rubric (what a full answer must contain + the top trap), a submission template, and a 3‑axis scoring model (approach / execution / interpretation).
- **`PROMPT_StudyPack_Builder.md`** — the full engineering spec (data model, requirements, build order, monetization).
- **`SWOT_StudyPack.html`** — strategy: SWOT + concrete mitigations.

## 4. What to build — the four pillars
From one source‑of‑truth model (CoursePack), generate and keep consistent: **(1)** learning presentation, **(2)** printable formula/cheat sheet, **(3)** slide‑by‑slide study plan with per‑day practice references, **(4)** an AI tutor that grades submitted solutions against per‑topic rubrics. Plus ingestion of messy materials, accounts, class mode, and billing (all detailed in the spec).

## 5. The distilled methodology (the "secret sauce")
1. **Ingest first, generate second** — never invent subject content; everything traces to the uploads.
2. **Organize into Blocks** — ordered topics, each with framing, concepts, formulas, a real example, mistakes, a tip, star tags.
3. **Explain, don't bullet** — a plain‑language line under every concept; an intuition line under every formula.
4. **Per‑section term keys** in the cheat sheet.
5. **Side‑by‑side "confusing pairs"** — the distinctions that lose points.
6. **Sanity nets** — typical‑values table + 30‑second checklist + implied‑value consistency checks.
7. **Plan ↔ deck ↔ practice** — each day maps to exact slides and an exact exercise/exam question.
8. **One model, everything derived** — edits propagate; renumbering updates references.
9. **Feedback diagnoses, never just answers** — step‑by‑step ✓/✗ with *why*, the fix, links back to slide + cheat‑section, and a 3‑axis score.

## 6. Hard lessons / non‑negotiables (learned the hard way this session)
- **RTL is the #1 failure mode.** Formulas/Latin/Greek must render **LTR inside an RTL page** (`dir="ltr"; unicode-bidi:isolate`). We repeatedly saw commas, parentheses, numbers and subscripts get reversed/mangled. Add automated tests for representative formula strings. This applies to artifacts, student submissions, and feedback.
- **Print must force two columns.** Screen multicolumn **collapses in print** (our sheet ballooned to 6 pages). Use an explicit `@media print` block + `@page { size:A4; margin:~6mm }` + forced columns; guard any "single‑column on small screens" rule with `screen and`.
- **Never delete content when restyling/compacting** — only change presentation; provide a content diff.
- **Map practice precisely** — if no exercise matches a topic, say so and offer a self‑drill; don't fabricate a citation.
- **Feedback accuracy is high‑stakes** — do arithmetic deterministically (calculator/code), grade against a reference solution when present, show a confidence level, and let users report bad feedback.

## 7. Priorities & risks to design around (from the SWOT)
- **Differentiator / moat:** excellent **Hebrew/RTL** + the **coherence of the four pillars** + structured workflow + class‑mode data. Position as an *exam‑prep system*, not "an AI that summarizes."
- **Top risk #1 — feedback trust:** one hallucinated wrong‑grade burns trust. Mitigate with deterministic math, reference‑solution grading, self‑critique pass, confidence + report button.
- **Top risk #2 — token economics:** cache per‑course ingestion/structuring (generate artifacts once), tiered models, quotas. Watch unit cost per feedback.
- **Also:** copyright (users upload only what they may; private by default; no training on content), seasonality (subscriptions/semester passes, B2B2C), privacy/GDPR (encryption, opt‑out, delete‑my‑data, DPA).
- **Go‑to‑market:** start with a **narrow MVP — one course, Hebrew — with an extreme focus on feedback accuracy**, then expand.

## 8. Full spec & build order
The complete spec is in **`PROMPT_StudyPack_Builder.md`**. Follow its **section 12 build order**: scaffold → ingestion (incl. practice‑item detection) → structuring/CoursePack → **cheat‑sheet renderer first** → deck → study plan → practice‑&‑feedback module → verification pass → polish. Accounts (4.6) and billing (14) can sit behind feature flags until the four pillars work end‑to‑end.

## 9. Definition of done (high level)
Upload a real multi‑file Hebrew course → get all four pillars with no manual cleanup; no content loss vs. sources; RTL/formulas uncorrupted everywhere; cheat sheet prints to the target page count in two columns; plan days reference real slides + real exercises; practice loop returns step‑by‑step feedback + 3‑axis score and never just dumps the answer; progress persists per user; works for ≥2 unrelated subjects/languages.

---
*Attach this handoff + `PROMPT_StudyPack_Builder.md` + the four example HTML files, then paste the Kickoff prompt from section 1.*
