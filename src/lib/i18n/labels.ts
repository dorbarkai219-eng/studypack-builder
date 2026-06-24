/**
 * UI strings for the artifacts, keyed by output language. Falls back to English.
 * Keep small — only the labels the renderers need.
 */
export type LabelKey =
  | "example"
  | "mistake"
  | "tip"
  | "keyIdea"
  | "termKey"
  | "comparisons"
  | "useLeft"
  | "useRight"
  | "criticalConcepts"
  | "traps"
  | "typicalValues"
  | "checklist"
  | "param"
  | "range"
  | "note"
  | "cheatSheet"
  | "examIn"
  | "printSave"
  | "density"
  | "d1"
  | "d2"
  | "dDetailed"
  | "mappedTo";

const EN: Record<LabelKey, string> = {
  example: "Example",
  mistake: "Common mistake",
  tip: "Exam tip",
  keyIdea: "Key idea",
  termKey: "Term key",
  comparisons: "Confusing pairs — side by side",
  useLeft: "Use left when",
  useRight: "Use right when",
  criticalConcepts: "Critical concepts",
  traps: "Traps",
  typicalValues: "Typical values / sanity check",
  checklist: "30-second pre-submission checklist",
  param: "Parameter",
  range: "Typical range",
  note: "Note",
  cheatSheet: "Cheat sheet",
  examIn: "Exam in",
  printSave: "Print / Save as PDF",
  density: "Density",
  d1: "1 page",
  d2: "2 pages",
  dDetailed: "Detailed",
  mappedTo: "→",
};

const HE: Record<LabelKey, string> = {
  example: "דוגמה",
  mistake: "טעות נפוצה",
  tip: "טיפ למבחן",
  keyIdea: "רעיון מרכזי",
  termKey: "מקרא סימונים",
  comparisons: "נוסחאות מבלבלות — זו מול זו",
  useLeft: "השתמש בשמאלי כש",
  useRight: "השתמש בימני כש",
  criticalConcepts: "מושגי מפתח",
  traps: "מלכודות",
  typicalValues: "ערכים אופייניים / בדיקת שפיות",
  checklist: "צ׳קליסט 30 שניות לפני הגשה",
  param: "פרמטר",
  range: "טווח אופייני",
  note: "הערה",
  cheatSheet: "דף נוסחאות",
  examIn: "מבחן בעוד",
  printSave: "הדפס / שמור כ-PDF",
  density: "צפיפות",
  d1: "עמוד 1",
  d2: "2 עמודים",
  dDetailed: "מפורט",
  mappedTo: "→",
};

const TABLES: Record<string, Record<LabelKey, string>> = { en: EN, he: HE };

export function makeLabels(lang: string) {
  const table = TABLES[lang] ?? EN;
  return (key: LabelKey) => table[key];
}
export type LabelFn = ReturnType<typeof makeLabels>;
