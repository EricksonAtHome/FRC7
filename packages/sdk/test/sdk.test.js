import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { FRCClient } from "../src/index.js";
import { useMemoryQueue, AYITI_DEMO_KEY } from "@frc/core";
import { createApp } from "@frc/gateway/app";

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ url: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(r)) });
    });
  });
}

describe("sdk", () => {
  it("builds run requests", async () => {
    const calls = [];
    const client = new FRCClient({
      baseUrl: "http://frc.test",
      apiKey: "k",
      fetch: async (url, init) => {
        calls.push({ url, init });
        return { ok: true, json: async () => ({ status: "completed" }) };
      },
    });
    await client.run("ayiti.search", "hi", { country: "HT" });
    assert.equal(calls[0].url, "http://frc.test/v1/run/ayiti.search");
    assert.equal(calls[0].init.headers["x-api-key"], "k");
  });

  it("builds neuriy chat requests", async () => {
    const calls = [];
    const client = new FRCClient({
      baseUrl: "http://frc.test",
      apiKey: "k",
      fetch: async (url, init) => {
        calls.push({ url, init });
        return { ok: true, json: async () => ({ status: "completed", output: "hi" }) };
      },
    });
    await client.chat("Hello", { model: "neuriy.chat" });
    assert.equal(calls[0].url, "http://frc.test/v1/chat");
    const body = JSON.parse(calls[0].init.body);
    assert.equal(body.message, "Hello");
    assert.equal(body.model, "neuriy.chat");
  });
});

describe("sdk live", () => {
  let ctx, client;
  before(async () => {
    useMemoryQueue();
    ctx = await listen(createApp());
    client = new FRCClient({ baseUrl: ctx.url, apiKey: AYITI_DEMO_KEY });
  });
  after(async () => ctx.close());

  it("health models neuriy chat and marketplace", async () => {
    const health = await client.health();
    assert.equal(health.ok, true);
    assert.ok(health.neuriy);

    const models = await client.models();
    assert.ok(models.models.some((m) => m.id === "neuriy.chat"));
    assert.ok(models.models.some((m) => m.id === "ayiti.search"));

    const chat = await client.chat("Hello Neuriy from SDK", { model: "neuriy.chat" });
    assert.equal(chat.status, "completed");
    assert.ok(chat.output.length > 0);
    assert.ok(chat.sessionId);

    const again = await client.chat("What is an LLM?", { model: "neuriy.tutor", sessionId: chat.sessionId });
    assert.ok(again.output.length > 0);

    const completion = await client.chatCompletions({
      model: "neuriy.code",
      messages: [{ role: "user", content: "hello world function" }],
    });
    assert.equal(completion.object, "chat.completion");
    assert.ok(completion.choices[0].message.content.length > 0);

    const market = await client.marketplace({ q: "assistant" });
    assert.ok(market.apps?.length >= 1);

    const run = await client.run("neuriy.reason", "Why use attention?", { sync: true });
    assert.equal(run.status, "completed");
    assert.match(run.result.output, /Reasoning|attention|Neuriy/i);
  });
});
