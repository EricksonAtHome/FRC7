/**
 * In-memory conversation sessions (context window simulation).
 * Not permanent memory — survives only in process unless persisted.
 */

import { randomUUID } from "node:crypto";
import { countTokens } from "../llm/tokenizer.js";

const sessions = new Map();

const DEFAULT_MAX_MESSAGES = 40;
const DEFAULT_MAX_TOKENS = 8192;

export function createSession({ model = "neuriy.chat", system = null, meta = {} } = {}) {
  const id = randomUUID();
  const session = {
    id,
    model,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
    meta: { ...meta },
    system: system || defaultSystem(model),
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id) {
  return sessions.get(id) || null;
}

export function deleteSession(id) {
  return sessions.delete(id);
}

export function listSessions() {
  return [...sessions.values()].map((s) => ({
    id: s.id,
    model: s.model,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    messageCount: s.messages.length,
  }));
}

export function appendMessage(sessionId, role, content, extra = {}) {
  const s = sessions.get(sessionId);
  if (!s) {
    const err = new Error(`session not found: ${sessionId}`);
    err.code = "NEURIY_SESSION_NOT_FOUND";
    throw err;
  }
  const msg = {
    role,
    content: String(content ?? ""),
    at: new Date().toISOString(),
    ...extra,
  };
  s.messages.push(msg);
  s.updatedAt = msg.at;
  trimContext(s);
  return msg;
}

export function buildContextMessages(session, { maxMessages = DEFAULT_MAX_MESSAGES } = {}) {
  const system = { role: "system", content: session.system };
  const recent = session.messages.slice(-maxMessages);
  return [system, ...recent];
}

function trimContext(session) {
  while (session.messages.length > DEFAULT_MAX_MESSAGES) session.messages.shift();
  let tokens = estimateSessionTokens(session);
  while (tokens > DEFAULT_MAX_TOKENS && session.messages.length > 2) {
    session.messages.shift();
    tokens = estimateSessionTokens(session);
  }
}

export function estimateSessionTokens(session) {
  const text = [session.system, ...session.messages.map((m) => m.content)].join("\n");
  return countTokens(text);
}

function defaultSystem(model) {
  return [
    "You are Neuriy AI, a helpful conversational assistant similar in product shape to ChatGPT.",
    `Active model: ${model}.`,
    "Be clear, accurate, and concise. If unsure, say so.",
    "You can use tools when helpful. Do not invent private OpenAI internals.",
    "Respond in the user's language when reasonable.",
  ].join(" ");
}

/** Test helper */
export function _resetSessions() {
  sessions.clear();
}
