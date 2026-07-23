"use client";

import { useEffect, useState } from "react";

/**
 * Three-way theme toggle: system → light → dark → system…
 * The choice is stored in localStorage("studypack:theme") and applied as
 * html[data-theme]; an inline script in the root layout applies it before
 * first paint so there is no flash. "system" removes the attribute and
 * lets the prefers-color-scheme media query in globals.css decide.
 */

type Theme = "system" | "light" | "dark";

const KEY = "studypack:theme";
const ORDER: Theme[] = ["system", "light", "dark"];

const META: Record<Theme, { icon: string; he: string }> = {
  system: { icon: "🌓", he: "לפי המערכת" },
  light: { icon: "☀️", he: "בהיר" },
  dark: { icon: "🌙", he: "כהה" },
};

function apply(theme: Theme) {
  const el = document.documentElement;
  if (theme === "system") delete el.dataset.theme;
  else el.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored === "light" || stored === "dark") setTheme(stored);
    } catch {
      /* ignore */
    }
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    apply(next);
    try {
      if (next === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  };

  const m = META[theme];
  return (
    <button
      type="button"
      onClick={cycle}
      title={`ערכת נושא: ${m.he}`}
      aria-label={`ערכת נושא: ${m.he}`}
      className="nb-btn px-2.5 py-1.5 text-sm"
    >
      <span aria-hidden>{mounted ? m.icon : "🌓"}</span>
    </button>
  );
}
