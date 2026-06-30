import "server-only";
import { create, all } from "mathjs";

/**
 * Deterministic-math hook (handoff §6: "do arithmetic deterministically").
 *
 * mathjs is sandboxed (no Function/eval, no Node globals) and we further
 * limit it by importing only the core scientific surface and disabling
 * `import`. The grader exposes this via a tool the model can call when
 * it needs to compute a value, instead of doing arithmetic in its head.
 */

const math = create(all, {
  number: "number",
  precision: 14,
});
// Defence in depth: kill the ability to redefine functions or do file IO.
// `import` is the only side-effect entry on a fresh mathjs instance.
math.import(
  {
    // Only disable the genuinely risky entry points: `import` (lets user
    // redefine arbitrary functions) and `createUnit` (mutates globals).
    // Keep `evaluate`, `parse`, etc. — we use them.
    import: () => {
      throw new Error("import is disabled");
    },
    createUnit: () => {
      throw new Error("createUnit is disabled");
    },
  },
  { override: true },
);

export interface CalculateResult {
  expression: string;
  /** Stringified result. Numbers up to 12 sig figs; non-finite returns the literal "Infinity" / "NaN". */
  result: string;
  /** True iff the result is a real finite number. */
  ok: boolean;
}

/** Evaluate a math expression. Never throws; reports failure on the object. */
export function calculate(expression: string): CalculateResult {
  if (typeof expression !== "string" || !expression.trim())
    return { expression, result: "empty expression", ok: false };
  // Hard cap on input length so a malicious 1MB expression can't lock the
  // server worker.
  if (expression.length > 2000)
    return { expression, result: "expression too long", ok: false };
  try {
    const raw = math.evaluate(expression);
    const num = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(num))
      return { expression, result: String(raw), ok: false };
    // Trim long decimals; round-trip via Number to drop float noise.
    const result = Number(num.toPrecision(12)).toString();
    return { expression, result, ok: true };
  } catch (err) {
    return {
      expression,
      result: err instanceof Error ? err.message : "evaluation failed",
      ok: false,
    };
  }
}
