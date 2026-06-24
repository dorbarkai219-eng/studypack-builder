import type { ReactNode } from "react";

/**
 * Ltr — wraps Latin identifiers, formulas, acronyms, and units so they render
 * LEFT-TO-RIGHT even inside an RTL page (spec §6, the #1 i18n bug).
 *
 * Uses <bdi> + dir="ltr" + unicode-bidi: isolate so the bidi algorithm treats
 * the content as an isolated LTR run and never reorders e.g.
 *   "Equity = EV + Excess − Net Debt"  ->  "Debt Net − Excess + EV = Equity".
 */
export function Ltr({
  children,
  className = "",
  as = "bdi",
}: {
  children: ReactNode;
  className?: string;
  as?: "bdi" | "span";
}) {
  const Tag = as;
  return (
    <Tag dir="ltr" className={`ltr ${className}`.trim()}>
      {children}
    </Tag>
  );
}
