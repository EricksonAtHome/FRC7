import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import {
  listModels, chat, chatCompletions, encode, decode, countTokens,
  safeEval, retrieve, executeNeuriyModel, _resetSessions, isNeuriyModel,
} from "../src/index.js";

describe("@neuriy/ai", () => {
  before(() => _resetSessions());

  it("lists conversational models", () => {
    const models = listModels();
    assert.ok(models.some((m) => m.id === "neuriy.chat"));
    assert.ok(models.some((m) => m.id === "neuriy.code"));
    assert.equal(isNeuriyModel("neuriy.reason"), true);
  });

  it("tokenizes and round-trips ascii-ish text", () => {
    const text = "hello neuriy";
    const ids = encode(text);
    assert.ok(ids.length > 0);
    assert.equal(decode(ids), text);
    assert.equal(countTokens(text), ids.length);
  });

  it("safeEval calculates", () => {
    assert.equal(safeEval("2+3*4"), 14);
    assert.equal(safeEval("(10-2)/4"), 2);
  });

  it("retrieves RAG docs", () => {
    const docs = retrieve("what is self-attention in transformers");
    assert.ok(docs.length >= 1);
    assert.ok(docs[0].title || docs[0].text);
  });

  it("chats with session memory", async () => {
    const a = await chat({ model: "neuriy.chat", message: "Hello Neuriy" });
    assert.ok(a.output.length > 0);
    assert.ok(a.sessionId);
    const b = await chat({ model: "neuriy.chat", message: "What is ChatGPT?", sessionId: a.sessionId });
    assert.match(b.output, /ChatGPT|GPT|LLM|model/i);
    assert.equal(b.sessionId, a.sessionId);
  });

  it("uses calculator tool", async () => {
    const r = await chat({ model: "neuriy.assistant", message: "calculate 12+8" });
    assert.ok(r.tools?.length >= 1);
    assert.equal(r.tools[0].name, "calculator");
  });

  it("openai-compatible completions shape", async () => {
    const c = await chatCompletions({
      model: "neuriy.tutor",
      messages: [{ role: "user", content: "Explain tokens simply" }],
    });
    assert.equal(c.object, "chat.completion");
    assert.ok(c.choices[0].message.content.length > 0);
  });

  it("executeNeuriyModel accepts plain string", async () => {
    const r = await executeNeuriyModel("neuriy.creative", "Write a tiny poem about tokens");
    assert.ok(r.output.includes("Neuriy Creative") || r.output.length > 20);
  });

  it("reason model includes reasoning trace", async () => {
    const r = await chat({ model: "neuriy.reason", message: "Why do GPUs help training?" });
    assert.match(r.output, /Reasoning/i);
  });
});
