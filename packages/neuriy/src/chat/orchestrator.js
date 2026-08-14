/**
 * Neuriy chat orchestrator — the "application layer" around the model.
 *
 * Flow (conceptual ChatGPT-like stack):
 *   User → safety → session/context → RAG → tool select → generate → safety → User
 */

import { assertNeuriyModel, getModel } from "../models/registry.js";
import {
  createSession, getSession, appendMessage, buildContextMessages, estimateSessionTokens,
} from "../chat/session.js";
import { moderateInput, moderateOutput } from "../safety/moderation.js";
import { detectToolIntent, runTool } from "../tools/builtins.js";
import { localGenerate } from "../llm/local.js";
import { remoteConfigured, remoteChat } from "../llm/provider.js";
import { countTokens } from "../llm/tokenizer.js";

export async function chat({
  model = "neuriy.chat",
  message,
  sessionId = null,
  messages = null,
  system = null,
  meta = {},
  useTools = true,
} = {}) {
  const started = Date.now();
  const spec = assertNeuriyModel(model);

  const safetyIn = moderateInput(message ?? messages?.slice(-1)?.[0]?.content);
  if (!safetyIn.allowed) {
    return {
      output: safetyIn.message,
      provider: "neuriy-safety",
      model: spec.id,
      blocked: true,
      latencyMs: Date.now() - started,
      usage: { inputChars: String(message || "").length, outputChars: safetyIn.message.length },
    };
  }

  let session = sessionId ? getSession(sessionId) : null;
  if (!session && !messages) {
    session = createSession({ model: spec.id, system, meta });
  } else if (session && system) {
    session.system = system;
  }

  if (session && message != null) {
    appendMessage(session.id, "user", message);
  }

  const context = session
    ? buildContextMessages(session)
    : [
        { role: "system", content: system || `You are ${spec.title}.` },
        ...(messages || []),
        ...(message != null && !messages ? [{ role: "user", content: message }] : []),
      ];

  const lastUser = [...context].reverse().find((m) => m.role === "user")?.content || String(message || "");

  const toolResults = [];
  if (useTools && spec.tools?.length) {
    let intent = detectToolIntent(lastUser);
    if (spec.id === "neuriy.marketplace" && (!intent || intent.name !== "marketplace")) {
      intent = { name: "marketplace", args: { q: lastUser } };
    }
    if (intent && spec.tools.includes(intent.name)) {
      try {
        const result = await runTool(intent.name, intent.args, { session });
        toolResults.push({ name: intent.name, args: intent.args, result });
        if (session) {
          appendMessage(session.id, "tool", JSON.stringify(result), { tool: intent.name });
        }
      } catch (e) {
        toolResults.push({ name: intent.name, args: intent.args, result: { ok: false, error: e.message } });
      }
    }
  }

  let generation;
  if (remoteConfigured()) {
    try {
      const remoteMessages = context.map((m) => ({
        role: m.role === "tool" ? "assistant" : m.role,
        content: m.role === "tool" ? `[tool ${m.tool || "result"}]: ${m.content}` : m.content,
      }));
      if (toolResults.length) {
        remoteMessages.push({
          role: "system",
          content: `Tool results:\n${JSON.stringify(toolResults)}`,
        });
      }
      generation = await remoteChat({ messages: remoteMessages, model: process.env.NEURIY_LLM_MODEL || spec.id });
    } catch {
      generation = await localGenerate({ model: spec.id, messages: context, toolResults, meta });
    }
  } else {
    generation = await localGenerate({ model: spec.id, messages: context, toolResults, meta });
  }

  const outSafety = moderateOutput(generation.content);
  const content = outSafety.text;

  if (session) {
    appendMessage(session.id, "assistant", content);
  }

  return {
    output: content,
    provider: generation.provider,
    model: spec.id,
    sessionId: session?.id || sessionId || null,
    latencyMs: Date.now() - started,
    tools: toolResults,
    usage: {
      ...(generation.usage || {}),
      inputChars: lastUser.length,
      outputChars: content.length,
      contextTokens: session ? estimateSessionTokens(session) : countTokens(lastUser),
    },
    messages: session ? session.messages : undefined,
  };
}

export async function chatCompletions(body = {}) {
  const model = body.model || "neuriy.chat";
  const messages = body.messages || [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const result = await chat({
    model,
    messages: messages.filter((m) => m.role !== "system"),
    system: messages.find((m) => m.role === "system")?.content,
    message: lastUser?.content,
    meta: body.meta || {},
    useTools: body.tools !== false,
  });
  return {
    id: `neuriy-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: result.model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: result.output },
        finish_reason: result.blocked ? "content_filter" : "stop",
      },
    ],
    usage: {
      prompt_tokens: result.usage?.inputTokens || 0,
      completion_tokens: result.usage?.outputTokens || 0,
      total_tokens: (result.usage?.inputTokens || 0) + (result.usage?.outputTokens || 0),
    },
    neuriy: {
      provider: result.provider,
      sessionId: result.sessionId,
      tools: result.tools,
      latencyMs: result.latencyMs,
    },
  };
}

export function createChatSession(opts) {
  return createSession(opts);
}

export { getSession, getModel };
