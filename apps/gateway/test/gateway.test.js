import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { useMemoryQueue, AYITI_DEMO_KEY } from "@frc/core";
import { createApp } from "../src/app.js";

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ url: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(r)) });
    });
  });
}

describe("gateway", () => {
  let ctx;
  before(async () => { useMemoryQueue(); ctx = await listen(createApp()); });
  after(async () => ctx.close());

  it("health + models", async () => {
    const h = await (await fetch(`${ctx.url}/health`)).json();
    assert.equal(h.ok, true);
    const m = await (await fetch(`${ctx.url}/v1/models`)).json();
    assert.ok(m.models.some((x) => x.id === "ayiti.search"));
  });

  it("forbids generic models", async () => {
    const res = await fetch(`${ctx.url}/v1/run/models5`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": AYITI_DEMO_KEY },
      body: JSON.stringify({ input: "x", sync: true }),
    });
    assert.equal(res.status, 403);
  });

  it("lints and runs translate", async () => {
    const lint = await fetch(`${ctx.url}/v1/lint`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": AYITI_DEMO_KEY },
      body: JSON.stringify({ source: 'run model ayiti.translate { input "tax" }' }),
    });
    assert.equal(lint.status, 200);
    assert.equal((await lint.json()).ok, true);

    const run = await fetch(`${ctx.url}/v1/run/ayiti.translate`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": AYITI_DEMO_KEY },
      body: JSON.stringify({ input: "citizen tax", sync: true }),
    });
    assert.equal(run.status, 200);
  });

  it("batch sync", async () => {
    const res = await fetch(`${ctx.url}/v1/batch`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": AYITI_DEMO_KEY },
      body: JSON.stringify({
        sync: true,
        jobs: [
          { model: "ayiti.translate", input: "budget" },
          { model: "ayiti.uxp", input: "{\"from\":\"mef\",\"to\":\"dgi\"}" },
        ],
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.count, 2);
  });
});
