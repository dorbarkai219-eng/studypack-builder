import type { CoursePack, Block, PlanDay } from "@/lib/coursepack/schema";
import { buildDeck } from "@/lib/deck/buildDeck";

/**
 * buildPlan — an N-day countdown study plan aligned slide-by-slide to the deck
 * (spec §3.7, §4.5). Pure & deterministic given (pack, totalDays): today's date
 * is resolved by the caller so this stays testable and reproducible.
 *
 * Phasing: foundations → core → secondary/advanced → mock exams.
 * Starred topics + the user's weak topics get more weight (more/earlier days).
 * The last 1–2 days are timed mocks + final review — no new material.
 */

const PHASE = {
  foundations: { he: "יסודות", en: "Foundations" },
  core: { he: "מנוע מרכזי", en: "Core engine" },
  advanced: { he: "נושאים מתקדמים", en: "Advanced topics" },
  mock: { he: "מבחני דמה", en: "Mock exams" },
};

function isWeak(block: Block, weakTopics: string[]): boolean {
  const hay = `${block.title} ${block.enTitle ?? ""}`.toLowerCase();
  return weakTopics.some((w) => {
    const t = w.toLowerCase();
    return t.length > 0 && (hay.includes(t) || t.includes(block.title.toLowerCase()));
  });
}

function blockWeight(block: Block, weakTopics: string[]): number {
  return 1 + block.starLevel + (isWeak(block, weakTopics) ? 1 : 0);
}

/** Slide titles for a block, in deck order (the plan↔deck reference strip). */
function slideTitlesByBlock(pack: CoursePack): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const s of buildDeck(pack)) {
    if (!s.blockId) continue;
    const arr = map.get(s.blockId) ?? [];
    arr.push(s.title);
    map.set(s.blockId, arr);
  }
  return map;
}

/** Partition ordered blocks into `dayCount` contiguous groups balanced by weight. */
function partitionBlocks(blocks: Block[], dayCount: number, weak: string[]): Block[][] {
  if (dayCount <= 1) return [blocks];
  const total = blocks.reduce((s, b) => s + blockWeight(b, weak), 0);
  const target = total / dayCount;
  const groups: Block[][] = [];
  let cur: Block[] = [];
  let acc = 0;
  for (const b of blocks) {
    cur.push(b);
    acc += blockWeight(b, weak);
    // close the group once we hit the per-day target, leaving enough blocks
    // for the remaining days.
    const remainingDays = dayCount - groups.length - 1;
    const remainingBlocks = blocks.length - (groups.flat().length + cur.length);
    if (acc >= target && remainingDays > 0 && remainingBlocks >= remainingDays) {
      groups.push(cur);
      cur = [];
      acc = 0;
    }
  }
  if (cur.length) groups.push(cur);
  // pad with empty review days if we somehow produced fewer groups than dayCount
  while (groups.length < dayCount) groups.push([]);
  return groups;
}

function pastExamSource(pack: CoursePack): string | undefined {
  const s = pack.sources.find((src) =>
    /מבחן|exam|past|בחינה/i.test(src.filename),
  );
  return s?.filename;
}
function exerciseSource(pack: CoursePack): string | undefined {
  const s = pack.sources.find((src) =>
    /תרגול|exercise|problem|תרגיל/i.test(src.filename),
  );
  return s?.filename;
}

export function buildPlan(pack: CoursePack, totalDays: number): PlanDay[] {
  const isHe = pack.course.outputLanguage === "he";
  const L = (o: { he: string; en: string }) => (isHe ? o.he : o.en);
  const weak = pack.course.weakTopics;
  const blocks = pack.blocks.slice().sort((a, b) => a.order - b.order);
  const titles = slideTitlesByBlock(pack);
  const pastExam = pastExamSource(pack);
  const exercises = exerciseSource(pack);

  const days = Math.max(1, totalDays);
  const mockDays = days >= 5 ? 2 : days >= 3 ? 1 : 0;
  const learnDays = Math.max(1, days - mockDays);

  // Assign blocks to learning days. If we have spare days, top-weight blocks
  // get an extra dedicated review day.
  let dayBlocks: Block[][];
  if (learnDays >= blocks.length) {
    dayBlocks = blocks.map((b) => [b]);
    const spare = learnDays - blocks.length;
    const byWeight = blocks
      .slice()
      .sort((a, b) => blockWeight(b, weak) - blockWeight(a, weak));
    for (let i = 0; i < spare; i++) {
      dayBlocks.push([byWeight[i % byWeight.length]]); // review day (re-covers block)
    }
  } else {
    dayBlocks = partitionBlocks(blocks, learnDays, weak);
  }

  const out: PlanDay[] = [];
  const seen = new Set<string>();

  dayBlocks.forEach((group, i) => {
    const dayNum = i + 1;
    const frac = i / Math.max(1, learnDays - 1);
    const phase =
      frac < 0.34 ? PHASE.foundations : frac < 0.7 ? PHASE.core : PHASE.advanced;
    const isReview = group.length > 0 && group.every((b) => seen.has(b.id));
    group.forEach((b) => seen.add(b.id));

    const slideRefs = group.flatMap((b) => titles.get(b.id) ?? []);
    const names = group.map((b) => b.title).join(isHe ? ", " : ", ");
    const star = group.some((b) => b.starLevel > 0);

    const learn = group.flatMap((b) => {
      const tasks: { task: string; done: boolean }[] = [];
      const blockTitles = titles.get(b.id) ?? [];
      if (blockTitles.length) {
        tasks.push({
          task: isHe
            ? `קרא בדק את השקופיות: ${blockTitles.join(" · ")}`
            : `Read deck slides: ${blockTitles.join(" · ")}`,
          done: false,
        });
      }
      const firstConcept = b.concepts[0];
      if (firstConcept) {
        tasks.push({
          task: isHe
            ? `נסח במילים שלך: ${firstConcept.term}`
            : `Explain in your own words: ${firstConcept.term}`,
          done: false,
        });
      }
      if (b.formulas[0]) {
        tasks.push({
          task: isHe
            ? `שחזר מהזיכרון את הנוסחה: ${b.formulas[0].latexOrText}`
            : `Re-derive from memory: ${b.formulas[0].latexOrText}`,
          done: false,
        });
      }
      return tasks;
    });

    const practice = group.flatMap((b) => {
      const tasks: { task: string; done: boolean }[] = [];
      if (b.examMapping && pastExam) {
        tasks.push({
          task: isHe
            ? `פתור את ${b.examMapping} מתוך ${pastExam}`
            : `Solve ${b.examMapping} from ${pastExam}`,
          done: false,
        });
      }
      if (exercises) {
        tasks.push({
          task: isHe
            ? `תרגל בעיות בנושא ${b.title} מתוך ${exercises}`
            : `Practice ${b.title} problems from ${exercises}`,
          done: false,
        });
      }
      if (tasks.length === 0) {
        tasks.push({
          task: isHe
            ? `תרגל 2–3 בעיות בנושא ${b.title}`
            : `Work 2–3 practice problems on ${b.title}`,
          done: false,
        });
      }
      return tasks;
    });

    out.push({
      day: dayNum,
      phase: L(phase) + (isReview ? (isHe ? " · חזרה" : " · review") : ""),
      star,
      slideRefs,
      learn,
      practice,
      goal: isReview
        ? isHe
          ? `חזרה ותרגול מעמיק: ${names}`
          : `Review & deep practice: ${names}`
        : group[0]?.framing ||
          (isHe ? `שליטה בנושא: ${names}` : `Master: ${names}`),
      materials: group
        .flatMap((b) => (b.examples.map((e) => e.sourceRef).filter(Boolean) as string[]))
        .join(", "),
    });
  });

  // Mock-exam days — no new material (spec §4.5).
  for (let m = 0; m < mockDays; m++) {
    const dayNum = learnDays + m + 1;
    const last = m === mockDays - 1;
    out.push({
      day: dayNum,
      phase: L(PHASE.mock),
      star: false,
      slideRefs: [],
      learn: [
        {
          task: last
            ? isHe
              ? "חזרה קלה על דף הנוסחאות והצ׳קליסט — בלי חומר חדש"
              : "Light review of the cheat sheet + checklist — no new material"
            : isHe
              ? "סקור את הנוסחאות המבלבלות והמלכודות"
              : "Review the confusing pairs and traps",
          done: false,
        },
      ],
      practice: last
        ? [
            {
              task: isHe
                ? "עבור על הצ׳קליסט של 30 שניות; לישון מוקדם"
                : "Run the 30-second checklist; sleep early",
              done: false,
            },
          ]
        : [
            {
              task: pastExam
                ? isHe
                  ? `מבחן דמה מלא בתנאי זמן מתוך ${pastExam}`
                  : `Full timed mock exam from ${pastExam}`
                : isHe
                  ? "מבחן דמה מלא בתנאי זמן"
                  : "Full timed mock exam",
              done: false,
            },
            {
              task: isHe
                ? "נתח כל טעות; פתור מחדש את מה ששגית"
                : "Analyze every mistake; redo what you got wrong",
              done: false,
            },
          ],
      goal: last
        ? isHe
          ? "מנוחה וביטחון — אתה מוכן"
          : "Rest & confidence — you're ready"
        : isHe
          ? "סימולציה מלאה של המבחן"
          : "Full exam simulation",
      materials: pastExam ?? "",
    });
  }

  return out;
}
