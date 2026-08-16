/**
 * Local Neuriy conversational engine.
 *
 * This is NOT a trained multi-billion-parameter transformer.
 * It is an application-layer chat engine that:
 *  - builds ChatGPT-like context (system + history)
 *  - retrieves RAG snippets
 *  - calls tools when needed
 *  - generates structured, persona-aware responses
 *
 * When NEURIY_LLM_* env is set, the orchestrator prefers a remote LLM.
 */

import { getModel } from "../models/registry.js";
import { retrieve, formatRetrieved } from "../rag/simple.js";
import { encode, decode, countTokens } from "./tokenizer.js";

const PERSONAS = {
  "neuriy.chat": (ctx) => chatReply(ctx),
  "neuriy.assistant": (ctx) => assistantReply(ctx),
  "neuriy.reason": (ctx) => reasonReply(ctx),
  "neuriy.code": (ctx) => codeReply(ctx),
  "neuriy.creative": (ctx) => creativeReply(ctx),
  "neuriy.tutor": (ctx) => tutorReply(ctx),
  "neuriy.translate": (ctx) => translateReply(ctx),
  "neuriy.marketplace": (ctx) => marketplaceReply(ctx),
};

export async function localGenerate({ model, messages, toolResults = [], meta = {} } = {}) {
  const spec = getModel(model) || getModel("neuriy.chat");
  const userMsgs = (messages || []).filter((m) => m.role === "user");
  const lastUser = userMsgs[userMsgs.length - 1]?.content || "";
  const history = (messages || []).filter((m) => m.role !== "system").slice(-8);

  const docs = retrieve(lastUser, { k: 3 });
  const rag = formatRetrieved(docs);

  const ctx = {
    model: spec.id,
    title: spec.title,
    role: spec.role,
    lastUser,
    history,
    rag,
    toolResults,
    meta,
    tokenEstimate: countTokens(lastUser),
  };

  const fn = PERSONAS[spec.id] || PERSONAS["neuriy.chat"];
  const content = fn(ctx);

  // Educational: show tokenization stats in meta (not in user-facing text unless asked)
  const tokenIds = encode(content);
  return {
    content,
    provider: "neuriy-local",
    model: spec.id,
    usage: {
      inputTokens: countTokens(lastUser),
      outputTokens: tokenIds.length,
      retrieved: docs.map((d) => ({ id: d.id, score: Number(d.score.toFixed(3)) })),
    },
    debug: process.env.NEURIY_DEBUG === "1" ? { tokenSample: decode(tokenIds.slice(0, 12)) } : undefined,
  };
}

function preamble(ctx) {
  return `**${ctx.title}** · ${ctx.role}`;
}

function maybeRag(ctx) {
  if (!ctx.rag) return "";
  if (!/\b(gpt|transformer|attention|rag|agent|llm|neuriy|train|infer|token)\b/i.test(ctx.lastUser)) return "";
  return `\n\n_Grounding notes (local RAG):_\n${ctx.rag}`;
}

function toolBlock(ctx) {
  if (!ctx.toolResults?.length) return "";
  return (
    "\n\n**Tool results**\n" +
    ctx.toolResults
      .map((t) => `- \`${t.name}\`: \`\`\`json\n${JSON.stringify(t.result, null, 2)}\n\`\`\``)
      .join("\n")
  );
}

function chatReply(ctx) {
  const q = ctx.lastUser.trim();
  if (!q) return `${preamble(ctx)}\n\nHi — I'm Neuriy Chat. Ask me anything.`;

  // Short greetings only — longer prompts that start with "Hello…" should still get a real answer
  if (/^(hi|hello|hey|bonjour|salut|alo)\b[.!?\s]*$/i.test(q.trim())) {
    return `${preamble(ctx)}\n\nHello! I'm Neuriy AI — a ChatGPT-style conversational assistant in FRC7. How can I help?`;
  }

  if (ctx.toolResults?.length) {
    return `${preamble(ctx)}\n\nHere's what I found for you:${toolBlock(ctx)}\n\n${summarizeFromTools(q, ctx)}`;
  }

  return `${preamble(ctx)}\n\n${conversationalAnswer(q, ctx)}${maybeRag(ctx)}${toolBlock(ctx)}`;
}

function assistantReply(ctx) {
  return `${preamble(ctx)}\n\n**Plan**\n1. Understand: ${clip(ctx.lastUser, 120)}\n2. Act: ${ctx.toolResults?.length ? "used tools" : "answer directly"}\n3. Deliver clear next steps\n\n${conversationalAnswer(ctx.lastUser, ctx)}${toolBlock(ctx)}`;
}

function reasonReply(ctx) {
  const steps = [
    `Restate the problem: ${clip(ctx.lastUser, 160)}`,
    "Identify constraints and known facts.",
    "Propose intermediate conclusions.",
    "Check for contradictions or missing data.",
    "Give a final answer with caveats.",
  ];
  return `${preamble(ctx)}\n\n**Reasoning trace** (application-level chain-of-thought style — not a proprietary hidden model):\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n**Answer**\n${conversationalAnswer(ctx.lastUser, ctx)}${maybeRag(ctx)}${toolBlock(ctx)}`;
}

function codeReply(ctx) {
  const q = ctx.lastUser;
  const lang = /\bpython\b/i.test(q) ? "python" : /\bgo\b/i.test(q) ? "go" : "javascript";
  const snippet =
    lang === "python"
      ? `def answer(prompt: str) -> str:\n    """Neuriy Code sketch"""\n    return f"echo: {prompt[:80]}"\n`
      : lang === "go"
        ? `package main\n\nimport "fmt"\n\nfunc Answer(prompt string) string {\n  return fmt.Sprintf("echo: %.80s", prompt)\n}\n`
        : `export function answer(prompt) {\n  // Neuriy Code sketch\n  return \`echo: \${String(prompt).slice(0, 80)}\`;\n}\n`;

  return `${preamble(ctx)}\n\n${conversationalAnswer(q, ctx)}\n\n\`\`\`${lang}\n${snippet}\`\`\`\n\nTips: keep functions pure, add tests, and validate inputs.${toolBlock(ctx)}`;
}

function creativeReply(ctx) {
  return `${preamble(ctx)}\n\nHere's a creative take on _"${clip(ctx.lastUser, 80)}"_:\n\nIn a quiet server room, tokens lined up like fireflies. Neuriy listened — not with ears, but with attention heads — and answered with a story shaped from probability and care.\n\nWant a different tone (noir, comedy, technical parable)? Say the word.`;
}

function tutorReply(ctx) {
  return `${preamble(ctx)}\n\nLet's learn this together.\n\n**Concept**\n${conversationalAnswer(ctx.lastUser, ctx)}\n\n**Check your understanding**\n- Can you explain it in one sentence?\n- What would break if we removed this piece?\n\nAsk a follow-up and we'll go deeper.${maybeRag(ctx)}`;
}

function translateReply(ctx) {
  const q = ctx.lastUser;
  const map = {
    hello: { ht: "bonjou", fr: "bonjour", en: "hello" },
    help: { ht: "ede", fr: "aide", en: "help" },
    thank: { ht: "mèsi", fr: "merci", en: "thanks" },
    please: { ht: "tanpri", fr: "s'il vous plaît", en: "please" },
  };
  const hits = Object.entries(map).filter(([k]) => q.toLowerCase().includes(k));
  const lines = hits.length
    ? hits.map(([k, v]) => `- ${k}: EN \`${v.en}\` · FR \`${v.fr}\` · HT \`${v.ht}\``).join("\n")
    : `- Source: ${clip(q, 200)}\n- EN: ${q}\n- FR: (literal assist) ${q}\n- HT: (literal assist) ${q}`;
  return `${preamble(ctx)}\n\n**Translation assist**\n${lines}\n\n_Note: local glossary assist — pair with a remote LLM for full translation quality._`;
}

function marketplaceReply(ctx) {
  if (ctx.toolResults?.length) {
    const apps = ctx.toolResults.find((t) => t.name === "marketplace")?.result?.apps || [];
    if (!apps.length) return `${preamble(ctx)}\n\nNo marketplace apps matched. Try another query.`;
    return `${preamble(ctx)}\n\nFound **${apps.length}** app(s):\n${apps
      .map((a) => `- **${a.name || a.id}** (${a.category || "—"}) — ${a.description || ""}`)
      .join("\n")}`;
  }
  return `${preamble(ctx)}\n\nTell me what kind of Neuriy app you want (Assistants, Creative, Developer, Education) and I'll search the marketplace.`;
}

function conversationalAnswer(q, ctx) {
  const lower = q.toLowerCase();

  if (/\bwhat (is|are) (you|neuriy)\b/.test(lower)) {
    return "I'm Neuriy AI — conversational models in FRC7 inspired by ChatGPT's product shape: chat UI + orchestration + tools + retrieval around a language model (local engine or optional remote LLM).";
  }
  if (/\bchatgpt\b/.test(lower) || /\bhow (do )?gpt\b/.test(lower) || /\btransformer\b/.test(lower)) {
    return (
      "ChatGPT is a product; GPT is a model family; an LLM is the neural net. " +
      "Modern GPTs are decoder-only transformers trained with next-token prediction, then aligned for chat. " +
      "See `docs/chatgpt-systems.md` in this repo for the full technical walkthrough."
    );
  }
  if (/\bhow (do )?you work\b/.test(lower) || /\binference\b/.test(lower)) {
    return (
      "When you send a message I: (1) moderate input, (2) load session context, (3) optionally retrieve docs, " +
      "(4) call tools if needed, (5) generate a reply via local engine or remote LLM, (6) moderate output, (7) store the turn."
    );
  }
  if (ctx.rag && /\b(attention|embedding|token|rag|agent|train)\b/.test(lower)) {
    return `Based on your question and retrieved notes:\n\n${ctx.rag}\n\nIn short: ${oneLinerTopic(lower)}`;
  }

  return (
    `You said: “${clip(q, 280)}”\n\n` +
    `Here's a direct Neuriy reply: I can chat, reason step-by-step (\`neuriy.reason\`), write code (\`neuriy.code\`), ` +
    `tutor (\`neuriy.tutor\`), translate (\`neuriy.translate\`), or search the Neuriy Marketplace (\`neuriy.marketplace\`). ` +
    `Ask a more specific question, or set \`NEURIY_LLM_BASE_URL\` + \`NEURIY_LLM_API_KEY\` for full remote LLM generation.`
  );
}

function summarizeFromTools(q, ctx) {
  return `I used tools to help with: “${clip(q, 120)}”. If you want me to go further, say what to do next.`;
}

function oneLinerTopic(lower) {
  if (lower.includes("attention")) return "Attention lets each token weigh others via QKV and softmax.";
  if (lower.includes("embedding")) return "Embeddings map tokens to vectors so similar meanings land nearby.";
  if (lower.includes("token")) return "Models read subword tokens, not raw characters/words.";
  if (lower.includes("rag")) return "RAG injects retrieved documents into context for fresher/private facts.";
  if (lower.includes("agent")) return "Agents loop plan→tool→observe until a stop condition.";
  if (lower.includes("train")) return "Training adjusts weights to reduce next-token prediction loss.";
  return "Large language models predict likely next tokens conditioned on context.";
}

function clip(s, n) {
  const t = String(s || "");
  return t.length <= n ? t : t.slice(0, n - 1) + "…";
}
