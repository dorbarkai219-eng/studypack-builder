/**
 * UI strings for the artifacts, keyed by output language. Falls back to English.
 * Keep small — only the labels the renderers need.
 */
export type LabelKey =
  | "example"
  | "mistake"
  | "tip"
  | "rowConcepts"
  | "rowFormulas"
  | "rowExamples"
  | "rowMistakes"
  | "rowTips"
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
  | "mappedTo"
  | "home"
  | "deck"
  | "plan"
  | "verify"
  | "studyPlan"
  | "downloadHtml"
  | "downloadPptx"
  | "examInDays"
  | "studyDays"
  | "reset"
  | "slidesInDeck"
  | "learn"
  | "practice"
  | "next"
  | "previous"
  | "back"
  | "subject"
  | "topics"
  | "day"
  | "materials"
  | "flashcards"
  | "showAnswer"
  | "again"
  | "hard"
  | "good"
  | "easy"
  | "dueCards"
  | "newCards"
  | "remaining"
  | "sessionDone"
  | "allCaughtUp"
  | "studyAgain"
  | "overview"
  | "fullscreen";

const EN: Record<LabelKey, string> = {
  example: "Example",
  mistake: "Common mistake",
  tip: "Exam tip",
  rowConcepts: "Concepts",
  rowFormulas: "Formulas",
  rowExamples: "Examples",
  rowMistakes: "Mistakes",
  rowTips: "Tips",
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
  d1: "Compact",
  d2: "Normal",
  dDetailed: "Spacious",
  mappedTo: "→",
  home: "Home",
  deck: "Deck",
  plan: "Plan",
  verify: "Verify",
  studyPlan: "Study plan",
  downloadHtml: "Download HTML",
  downloadPptx: "Download PPTX",
  examInDays: "days",
  studyDays: "study days",
  reset: "Reset",
  slidesInDeck: "Slides in the deck",
  learn: "Learn",
  practice: "Practice",
  next: "Next",
  previous: "Previous",
  back: "Back",
  subject: "Subject",
  topics: "topics",
  day: "Day",
  materials: "Materials",
  flashcards: "Flashcards",
  showAnswer: "Show answer",
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
  dueCards: "due",
  newCards: "new",
  remaining: "left",
  sessionDone: "Session complete!",
  allCaughtUp: "All caught up — nothing due right now.",
  studyAgain: "Study everything again",
  overview: "Overview",
  fullscreen: "Fullscreen",
};

const HE: Record<LabelKey, string> = {
  example: "דוגמה",
  mistake: "טעות נפוצה",
  tip: "טיפ למבחן",
  rowConcepts: "מושגים",
  rowFormulas: "נוסחאות",
  rowExamples: "דוגמאות",
  rowMistakes: "טעויות",
  rowTips: "טיפים",
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
  d1: "צפוף",
  d2: "רגיל",
  dDetailed: "מרווח",
  mappedTo: "→",
  home: "בית",
  deck: "מצגת",
  plan: "תכנית",
  verify: "אימות",
  studyPlan: "תכנית לימוד",
  downloadHtml: "הורד HTML",
  downloadPptx: "הורד PPTX",
  examInDays: "ימים",
  studyDays: "ימי לימוד",
  reset: "איפוס",
  slidesInDeck: "שקופיות במצגת",
  learn: "ללמוד",
  practice: "תרגול",
  next: "הבא",
  previous: "הקודם",
  back: "חזרה",
  subject: "נושא",
  topics: "נושאים",
  day: "יום",
  materials: "חומרים",
  flashcards: "כרטיסיות",
  showAnswer: "הצג תשובה",
  again: "שוב",
  hard: "קשה",
  good: "טוב",
  easy: "קל",
  dueCards: "לחזרה",
  newCards: "חדשות",
  remaining: "נותרו",
  sessionDone: "סיימת את הסשן!",
  allCaughtUp: "הכול מעודכן — אין כרטיסיות לחזרה כרגע.",
  studyAgain: "תרגל הכול מחדש",
  overview: "סקירת שקופיות",
  fullscreen: "מסך מלא",
};

const TABLES: Record<string, Record<LabelKey, string>> = { en: EN, he: HE };

export function makeLabels(lang: string) {
  const table = TABLES[lang] ?? EN;
  return (key: LabelKey) => table[key];
}
export type LabelFn = ReturnType<typeof makeLabels>;
