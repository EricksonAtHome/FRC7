/**
 * Lightweight safety / moderation layer (application-level).
 * Not OpenAI's proprietary classifiers — conceptual instruction hierarchy.
 */

const BLOCK_PATTERNS = [
  /\b(how to make a bomb|build a bomb)\b/i,
  /\bchild\s*(porn|sexual)\b/i,
  /\bcredit\s*card\s*dump\b/i,
];

export function moderateInput(text) {
  const s = String(text || "");
  for (const re of BLOCK_PATTERNS) {
    if (re.test(s)) {
      return {
        allowed: false,
        reason: "blocked_by_safety_policy",
        message: "I can't help with that request. Please ask something else.",
      };
    }
  }
  return { allowed: true };
}

export function moderateOutput(text) {
  // Placeholder for output classifiers / filters
  return { allowed: true, text: String(text || "") };
}

/**
 * Conceptual instruction hierarchy (public industry pattern, not proprietary):
 * system/safety > developer > user
 */
export function mergeInstructions({ system, developer, user }) {
  return [
    system && `SYSTEM: ${system}`,
    developer && `DEVELOPER: ${developer}`,
    user && `USER: ${user}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
