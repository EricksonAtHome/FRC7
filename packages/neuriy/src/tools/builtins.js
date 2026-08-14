/**
 * Built-in tools for Neuriy tool-calling (function calling pattern).
 * Tool results are returned to the model as observations — classic agent loop.
 */

import { searchMarketplace } from "../marketplace/client.js";

export const TOOL_SPECS = Object.freeze({
  time: {
    name: "time",
    description: "Return the current UTC ISO timestamp",
    parameters: { type: "object", properties: {} },
  },
  calculator: {
    name: "calculator",
    description: "Evaluate a simple arithmetic expression (+ - * / parentheses)",
    parameters: {
      type: "object",
      properties: { expression: { type: "string" } },
      required: ["expression"],
    },
  },
  marketplace: {
    name: "marketplace",
    description: "Search Neuriy Marketplace apps by query or category",
    parameters: {
      type: "object",
      properties: {
        q: { type: "string" },
        category: { type: "string" },
      },
    },
  },
  memory: {
    name: "memory",
    description: "Recall a short note from session meta.notes",
    parameters: {
      type: "object",
      properties: { key: { type: "string" } },
    },
  },
});

export async function runTool(name, args = {}, ctx = {}) {
  switch (name) {
    case "time":
      return { ok: true, utc: new Date().toISOString() };
    case "calculator":
      return { ok: true, result: safeEval(args.expression) };
    case "marketplace":
      return searchMarketplace({ q: args.q, category: args.category });
    case "memory": {
      const notes = ctx.session?.meta?.notes || {};
      const key = String(args.key || "");
      return { ok: true, key, value: notes[key] ?? null };
    }
    default:
      return { ok: false, error: `unknown tool: ${name}` };
  }
}

/** Extremely small safe arithmetic evaluator (no JS eval). */
export function safeEval(expression) {
  const src = String(expression || "").replace(/\s+/g, "");
  if (!/^[\d+\-*/().]+$/.test(src)) {
    throw new Error("calculator only supports digits and + - * / ( )");
  }
  // shunting-yard
  const output = [];
  const ops = [];
  const prec = { "+": 1, "-": 1, "*": 2, "/": 2 };
  let i = 0;
  while (i < src.length) {
    if (/\d/.test(src[i]) || (src[i] === "." && /\d/.test(src[i + 1] || ""))) {
      let j = i;
      while (j < src.length && /[\d.]/.test(src[j])) j++;
      output.push(Number(src.slice(i, j)));
      i = j;
      continue;
    }
    const c = src[i];
    if (c === "(") ops.push(c);
    else if (c === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") output.push(ops.pop());
      if (!ops.length) throw new Error("mismatched parentheses");
      ops.pop();
    } else if (prec[c]) {
      while (ops.length && prec[ops[ops.length - 1]] >= prec[c]) output.push(ops.pop());
      ops.push(c);
    } else throw new Error(`bad char ${c}`);
    i++;
  }
  while (ops.length) {
    const op = ops.pop();
    if (op === "(") throw new Error("mismatched parentheses");
    output.push(op);
  }
  const st = [];
  for (const t of output) {
    if (typeof t === "number") st.push(t);
    else {
      const b = st.pop();
      const a = st.pop();
      if (a == null || b == null) throw new Error("bad expression");
      if (t === "+") st.push(a + b);
      else if (t === "-") st.push(a - b);
      else if (t === "*") st.push(a * b);
      else if (t === "/") {
        if (b === 0) throw new Error("division by zero");
        st.push(a / b);
      }
    }
  }
  if (st.length !== 1) throw new Error("bad expression");
  return st[0];
}

export function detectToolIntent(text) {
  const t = String(text || "").toLowerCase();
  if (/\b(calculate|compute|what is)\b.*=?\s*[\d+\-*/().]+/.test(t) || /[\d]+\s*[\+\-\*\/]\s*[\d]+/.test(t)) {
    const m = String(text).match(/([\d+\-*/().\s]+)/);
    if (m) return { name: "calculator", args: { expression: m[1].trim() } };
  }
  if (/\b(marketplace|neuriy apps?|find app|browse apps)\b/.test(t)) {
    return { name: "marketplace", args: { q: String(text).replace(/marketplace|neuriy apps?|find app|browse apps/gi, "").trim() || "assistant" } };
  }
  if (/\b(what time|current time|utc now)\b/.test(t)) {
    return { name: "time", args: {} };
  }
  return null;
}
