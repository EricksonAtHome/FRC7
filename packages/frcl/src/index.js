export { tokenize, TokenType } from "./tokenize.js";
export { parse, compile, toPlan, validatePlan, analyze } from "./parser.js";

import { analyze as analyzeSource } from "./parser.js";

/** Lint helper for IDEs / CLI */
export function lint(source) {
  try {
    const result = analyzeSource(source);
    return {
      ok: result.validation.ok,
      errors: result.validation.errors,
      warnings: result.validation.warnings,
      plan: result.plan,
    };
  } catch (err) {
    return { ok: false, errors: [err.message], warnings: [], plan: null };
  }
}
