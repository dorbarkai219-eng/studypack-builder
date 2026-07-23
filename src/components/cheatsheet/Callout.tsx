import type { ReactNode } from "react";

type Kind = "keyidea" | "tip" | "mistake" | "example";

// Static class maps so Tailwind's compiler sees every class literally.
const STYLES: Record<Kind, { box: string; label: string }> = {
  keyidea: {
    box: "border-keyidea bg-keyidea-bg",
    label: "text-keyidea",
  },
  tip: {
    box: "border-tip bg-tip-bg",
    label: "text-tip",
  },
  mistake: {
    box: "border-mistake bg-mistake-bg",
    label: "text-mistake",
  },
  example: {
    box: "border-example bg-example-bg",
    label: "text-example",
  },
};

/**
 * Callout — colored card for example / common-mistake / exam-tip / key-idea
 * (spec §4.3, §5). Label text carries meaning (never emoji-only — spec §6).
 */
export function Callout({
  kind,
  label,
  children,
}: {
  kind: Kind;
  label: string;
  children: ReactNode;
}) {
  const s = STYLES[kind];
  return (
    <div className={`my-1 rounded-lg border-s-[3px] ${s.box} px-2 py-1`}>
      <span className={`me-1 text-[0.85em] font-bold uppercase tracking-wide ${s.label}`}>
        {label}
      </span>
      <span className="text-[0.97em]">{children}</span>
    </div>
  );
}
