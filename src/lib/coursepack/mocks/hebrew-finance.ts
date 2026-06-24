import { parseCoursePack, type CoursePack } from "@/lib/coursepack/schema";

/**
 * Hebrew (RTL) corporate-finance / valuation course.
 * Exercises the hard rendering rules: Latin/Greek formulas inside an RTL page,
 * mixed Hebrew+Latin titles, subscripts, and per-box term keys.
 *
 * NOTE (spec §3.1/§7): in production every fact traces to uploaded materials.
 * This is hand-authored stand-in data; `sourceRef`s are illustrative.
 */
const data = {
  course: {
    id: "hebrew-finance",
    title: "מימון תאגידי והערכת שווי",
    subject: "Corporate Finance",
    language: "he",
    direction: "rtl",
    examDate: "2026-07-10",
    weakTopics: ["WACC", "מכפילים"],
    outputLanguage: "he",
  },
  sources: [
    { id: "src1", filename: "הרצאות_1-6.pdf", type: "pdf", pages: 84 },
    { id: "src2", filename: "מבחן_לדוגמה_2024.pdf", type: "pdf", pages: 12 },
    { id: "src3", filename: "תרגול_מכפילים.pptx", type: "pptx", pages: 31 },
  ],
  blocks: [
    {
      id: "A",
      title: "גשר השווי: EV ↔ Equity",
      enTitle: "Enterprise Value to Equity Bridge",
      order: 1,
      starLevel: 2,
      examMapping: "שאלה 2",
      framing: "כל שאלת הערכת שווי מתחילה או נגמרת במעבר הזה — טעות כאן מפילה את כל הסעיף.",
      concepts: [
        {
          term: "שווי פעילות",
          enTerm: "Enterprise Value (EV)",
          explanation:
            "השווי של הפעילות התפעולית בלבד, ללא תלות במבנה ההון. משתמשים בו כשמשווים חברות עם רמות מינוף שונות.",
        },
        {
          term: "שווי הון עצמי",
          enTerm: "Equity Value",
          explanation:
            "מה ששייך לבעלי המניות אחרי שמורידים חוב ומוסיפים מזומן עודף. זה מה שמחלקים במספר המניות כדי לקבל מחיר למניה.",
        },
      ],
      formulas: [
        {
          latexOrText: "Equity = EV + Excess Cash − Net Debt",
          intuition: "מתחילים מהפעילות, מוסיפים מה ששייך לבעלי המניות ומורידים מה ששייך לנושים.",
          termKey: [
            { symbol: "EV", meaning: "שווי פעילות (Enterprise Value)" },
            { symbol: "Excess Cash", meaning: "מזומן מעבר לצרכי התפעול" },
            { symbol: "Net Debt", meaning: "חוב פיננסי בניכוי מזומן" },
          ],
        },
        {
          latexOrText: "EV = Equity + Net Debt − Excess Cash",
          intuition: "אותה משוואה הפוכה — שימושי כשמתחילים משווי שוק של המניה.",
          termKey: [
            { symbol: "Equity", meaning: "שווי שוק ההון העצמי" },
          ],
        },
      ],
      examples: [
        {
          text: "חברה: EV = 1,200, מזומן עודף = 150, חוב נטו = 400 → Equity = 1,200 + 150 − 400 = 950.",
          sourceRef: "src2 עמ׳ 4",
        },
      ],
      mistakes: [
        "להשתמש בחוב ברוטו במקום חוב נטו כששאלה כבר נתנה Net Debt.",
        "לשכוח להוסיף את המזומן העודף — מוריד את שווי ההון בטעות.",
      ],
      tips: ["תמיד כתוב ליד כל מספר אם הוא שייך ל-EV או ל-Equity לפני שמחברים."],
    },
    {
      id: "B",
      title: "ROIC + הקשר הזהוב",
      enTitle: "ROIC & the Value Driver Formula",
      order: 2,
      starLevel: 2,
      examMapping: "שאלה 4",
      framing: "הקשר בין צמיחה, תשואה על ההון והשווי — הליבה שממנה נגזרות שאלות ה-DCF.",
      concepts: [
        {
          term: "תשואה על ההון המושקע",
          enTerm: "Return on Invested Capital (ROIC)",
          explanation:
            "כמה רווח תפעולי אחרי מס מייצרת כל שקל הון שהושקע בעסק. אם ROIC > WACC — צמיחה יוצרת ערך, אחרת הורסת.",
        },
      ],
      formulas: [
        {
          latexOrText: "ROIC = NOPAT / Invested Capital",
          intuition: "רווח תפעולי נקי ממס חלקי ההון שהושקע כדי לייצר אותו.",
          termKey: [
            { symbol: "NOPAT", meaning: "רווח תפעולי × (1 − שיעור מס)" },
            { symbol: "Invested Capital", meaning: "הון עצמי + חוב נטו תפעולי" },
          ],
        },
        {
          latexOrText: "Value = NOPAT × (1 − g / ROIC) / (WACC − g)",
          intuition: "הנוסחה הזהובה: שווי תלוי בצמיחה g, בתשואה ROIC ובמחיר ההון WACC.",
          termKey: [
            { symbol: "g", meaning: "שיעור צמיחה בר-קיימא" },
            { symbol: "WACC", meaning: "מחיר הון משוקלל" },
          ],
        },
      ],
      examples: [
        {
          text: "NOPAT = 100, g = 3%, ROIC = 15%, WACC = 9% → Value = 100 × (1 − 0.03/0.15) / (0.09 − 0.03) ≈ 1,333.",
          sourceRef: "src1 עמ׳ 52",
        },
      ],
      mistakes: ["להציב g כאחוז (3) במקום עשרוני (0.03) בתוך 1 − g/ROIC."],
      tips: ["אם g שלילי, בדוק שעדיין WACC − g > 0 אחרת השווי לא מוגדר."],
    },
    {
      id: "C",
      title: "מחיר ההון: WACC ו-CAPM",
      enTitle: "Cost of Capital",
      order: 3,
      starLevel: 1,
      examMapping: "שאלה 3",
      framing: "המכנה של כל היוון — סטייה קטנה ב-WACC מזיזה את השווי בעשרות אחוזים.",
      concepts: [
        {
          term: "תשואה נדרשת על ההון",
          enTerm: "Cost of Equity",
          explanation:
            "התשואה שמשקיע במניה דורש על הסיכון השיטתי. נגזרת מ-CAPM לפי בטא של החברה.",
        },
      ],
      formulas: [
        {
          latexOrText: "R_e = R_f + β × MRP",
          intuition: "תשואה חסרת סיכון ועוד פרמיה שגדלה ככל שהמניה תנודתית יותר מהשוק.",
          termKey: [
            { symbol: "R_f", meaning: "תשואה חסרת סיכון" },
            { symbol: "β", meaning: "בטא — רגישות לתנודות השוק" },
            { symbol: "MRP", meaning: "פרמיית סיכון השוק (R_m − R_f)" },
          ],
        },
        {
          latexOrText: "WACC = (E/V) × R_e + (D/V) × R_d × (1 − T)",
          intuition: "ממוצע משוקלל של מחיר ההון העצמי והחוב, כשהחוב מקבל מגן מס.",
          termKey: [
            { symbol: "E/V", meaning: "משקל ההון העצמי בשווי הכולל" },
            { symbol: "D/V", meaning: "משקל החוב בשווי הכולל" },
            { symbol: "R_d", meaning: "מחיר החוב לפני מס" },
            { symbol: "T", meaning: "שיעור מס חברות" },
          ],
        },
      ],
      examples: [
        {
          text: "R_f = 4%, β = 1.2, MRP = 5% → R_e = 4% + 1.2 × 5% = 10%.",
          sourceRef: "src1 עמ׳ 61",
        },
      ],
      mistakes: [
        "להשתמש במשקלים לפי ערך ספרים במקום לפי שווי שוק.",
        "לשכוח את מגן המס (1 − T) על מחיר החוב.",
      ],
      tips: ["E/V + D/V חייב להסתכם ל-1 — בדיקת שפיות מהירה."],
    },
  ],
  summaries: {
    confusingPairs: [
      {
        title: "EV מול Equity",
        left: "EV = Equity + Net Debt − Excess Cash",
        right: "Equity = EV + Excess Cash − Net Debt",
        whenLeft: "כשמתחילים משווי שוק של המניה ורוצים את שווי הפעילות.",
        whenRight: "כשמתחילים מ-DCF (שמניב EV) ורוצים מחיר למניה.",
      },
      {
        title: "מכפיל EV/EBITDA מול P/E",
        left: "EV / EBITDA",
        right: "P / E",
        whenLeft: "להשוואה בין חברות עם מינוף שונה — מנוטרל מבנה הון.",
        whenRight: "כשמסתכלים על הרווח לבעלי המניות בלבד.",
      },
    ],
    criticalConcepts: [
      "ROIC > WACC ⇒ צמיחה יוצרת ערך.",
      "WACC במשקלי שווי שוק, לא ספרים.",
      "גשר EV↔Equity בכל שאלת הערכת שווי.",
    ],
    traps: [
      "חוב ברוטו במקום חוב נטו.",
      "g באחוזים במקום עשרוני בנוסחה הזהובה.",
      "השמטת מגן המס ב-WACC.",
    ],
    typicalValues: [
      { param: "β (חברה בוגרת)", range: "0.8 – 1.3", note: "מעל 1.5 בדוק שזו חברה ממונפת/מחזורית." },
      { param: "MRP", range: "4% – 6%", note: "ערך שוק מקובל בישראל/ארה״ב." },
      { param: "WACC", range: "7% – 12%", note: "מתחת ל-6% או מעל 15% — בדוק קלט." },
      { param: "g טרמינלי", range: "1% – 3%", note: "לא יכול לעלות על צמיחת המשק לאורך זמן." },
    ],
    checklist: [
      "כל מספר מסומן EV או Equity?",
      "WACC − g חיובי?",
      "משקלי WACC מסתכמים ל-1?",
      "g עשרוני, לא אחוז?",
      "מגן המס נכלל בחוב?",
    ],
  },
  deck: {
    slides: [
      { id: "s0", blockId: "A", title: "מימון תאגידי — סיכום למבחן", kind: "title" },
      { id: "s1", blockId: "A", title: "תוכן עניינים", kind: "toc" },
      { id: "s2", blockId: "A", title: "גשר השווי EV↔Equity", kind: "formula" },
      { id: "s3", blockId: "B", title: "ROIC והנוסחה הזהובה", kind: "formula" },
      { id: "s4", blockId: "C", title: "WACC ו-CAPM", kind: "formula" },
      { id: "s5", blockId: "C", title: "נוסחאות מבלבלות זו מול זו", kind: "summary" },
    ],
  },
  plan: { days: [] },
} as const;

export const hebrewFinancePack: CoursePack = parseCoursePack(data);
