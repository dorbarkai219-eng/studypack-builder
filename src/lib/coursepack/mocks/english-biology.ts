import { parseCoursePack, type CoursePack } from "@/lib/coursepack/schema";

/**
 * English (LTR) cell-biology / genetics course — the genericity control case
 * (spec §11 #8). Proves the renderer is subject- and language-agnostic.
 */
const data = {
  course: {
    id: "english-biology",
    title: "Cell Biology & Genetics",
    subject: "Biology",
    language: "en",
    direction: "ltr",
    examDate: "2026-07-05",
    weakTopics: ["Hardy-Weinberg", "Michaelis-Menten"],
    outputLanguage: "en",
  },
  sources: [
    { id: "src1", filename: "lectures_1-8.pdf", type: "pdf", pages: 96 },
    { id: "src2", filename: "past_exam_2023.pdf", type: "pdf", pages: 10 },
  ],
  blocks: [
    {
      id: "A",
      title: "Enzyme Kinetics",
      order: 1,
      starLevel: 2,
      examMapping: "Question 1",
      framing: "The rate law behind every metabolism question — misreading Km vs Vmax loses the whole part.",
      concepts: [
        {
          term: "Michaelis constant",
          enTerm: "Km",
          explanation:
            "The substrate concentration at half-maximal velocity. Low Km means high affinity — the enzyme saturates quickly.",
        },
        {
          term: "Maximum velocity",
          enTerm: "Vmax",
          explanation:
            "The reaction rate when all enzyme is saturated with substrate. Set by enzyme amount and turnover number.",
        },
      ],
      formulas: [
        {
          latexOrText: "v = Vmax × [S] / (Km + [S])",
          intuition: "Rate rises with substrate, then plateaus at Vmax as the enzyme saturates.",
          termKey: [
            { symbol: "v", meaning: "reaction velocity" },
            { symbol: "[S]", meaning: "substrate concentration" },
            { symbol: "Km", meaning: "substrate conc. at v = Vmax/2" },
          ],
        },
        {
          latexOrText: "1/v = (Km/Vmax) × (1/[S]) + 1/Vmax",
          intuition: "Lineweaver-Burk: linearizes the curve so Km and Vmax read off the intercepts.",
          termKey: [
            { symbol: "1/Vmax", meaning: "y-intercept" },
            { symbol: "−1/Km", meaning: "x-intercept" },
          ],
        },
      ],
      examples: [
        {
          text: "Vmax = 10 µM/s, Km = 2 µM, [S] = 2 µM → v = 10 × 2 / (2 + 2) = 5 µM/s (half-max, as expected at [S]=Km).",
          sourceRef: "src2 p.3",
        },
      ],
      mistakes: ["Confusing Km (affinity) with Vmax (capacity).", "Reading −1/Km as +1/Km on the x-intercept."],
      tips: ["At [S] = Km the rate is always exactly Vmax/2 — a free sanity check."],
    },
    {
      id: "B",
      title: "Hardy-Weinberg Equilibrium",
      order: 2,
      starLevel: 1,
      examMapping: "Question 4",
      framing: "The null model of population genetics — deviations from it signal selection, drift, or migration.",
      concepts: [
        {
          term: "Allele vs genotype frequency",
          explanation:
            "p and q are allele frequencies; p², 2pq, q² are the genotype frequencies they predict under random mating.",
        },
      ],
      formulas: [
        {
          latexOrText: "p + q = 1",
          intuition: "Two alleles must account for the whole gene pool.",
          termKey: [
            { symbol: "p", meaning: "frequency of dominant allele" },
            { symbol: "q", meaning: "frequency of recessive allele" },
          ],
        },
        {
          latexOrText: "p² + 2pq + q² = 1",
          intuition: "Genotype frequencies sum to one when the population is at equilibrium.",
          termKey: [
            { symbol: "p²", meaning: "homozygous dominant" },
            { symbol: "2pq", meaning: "heterozygous" },
            { symbol: "q²", meaning: "homozygous recessive" },
          ],
        },
      ],
      examples: [
        {
          text: "q² = 0.04 (affected) → q = 0.2, p = 0.8, carriers 2pq = 2 × 0.8 × 0.2 = 0.32.",
          sourceRef: "src1 p.71",
        },
      ],
      mistakes: ["Reporting q² as the carrier frequency — carriers are 2pq."],
      tips: ["Always start from the recessive phenotype q²; everything else follows from q = √(q²)."],
    },
  ],
  summaries: {
    confusingPairs: [
      {
        title: "Km vs Vmax",
        left: "Km — substrate affinity",
        right: "Vmax — catalytic capacity",
        whenLeft: "Comparing how tightly enzymes bind substrate.",
        whenRight: "Comparing maximum throughput at saturation.",
      },
    ],
    criticalConcepts: [
      "At [S] = Km, v = Vmax / 2.",
      "Carriers = 2pq, not q².",
      "Hardy-Weinberg assumes random mating, no selection.",
    ],
    traps: ["q² ≠ carrier frequency.", "x-intercept of Lineweaver-Burk is −1/Km, not 1/Km."],
    typicalValues: [
      { param: "Km (typical enzymes)", range: "0.1 – 10 mM" },
      { param: "Allele frequency q", range: "0 – 1", note: "rare disease alleles often q < 0.1." },
    ],
    checklist: [
      "Did you take √ to get q from q²?",
      "Carrier count uses 2pq?",
      "Units consistent on Km and [S]?",
    ],
  },
  deck: {
    slides: [
      { id: "s0", blockId: "A", title: "Cell Biology & Genetics — Exam Recap", kind: "title" },
      { id: "s1", blockId: "A", title: "Contents", kind: "toc" },
      { id: "s2", blockId: "A", title: "Enzyme Kinetics", kind: "formula" },
      { id: "s3", blockId: "B", title: "Hardy-Weinberg", kind: "formula" },
    ],
  },
  plan: { days: [] },
} as const;

export const englishBiologyPack: CoursePack = parseCoursePack(data);
