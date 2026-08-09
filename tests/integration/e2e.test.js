import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { useMemoryQueue, AYITI_DEMO_KEY } from "@frc/core";
import { createApp } from "@frc/gateway/app";
import { FRCClient } from "@frc/sdk";

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ url: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(r)) });
    });
  });
}

describe("e2e", () => {
  let ctx, client;
  before(async () => {
    useMemoryQueue();
    ctx = await listen(createApp());
    client = new FRCClient({ baseUrl: ctx.url, apiKey: AYITI_DEMO_KEY });
  });
  after(async () => ctx.close());

  it("sdk run + metrics + async tick", async () => {
    const done = await client.run("ayiti.translate", "government tax", { sync: true, region: "ht" });
    assert.equal(done.status, "completed");

    const queued = await client.run("ayiti.uxp", "{\"from\":\"a\",\"to\":\"b\"}", { sync: false });
    assert.equal(queued.status, "queued");

    const tick = await fetch(`${ctx.url}/v1/worker/tick`, {
      method: "POST",
      headers: { "x-api-key": AYITI_DEMO_KEY },
    });
    assert.equal(tick.status, 200);
    const job = await client.wait(queued.jobId, { timeoutMs: 5000 });
    assert.equal(job.status, "completed");

    const metrics = await client.metrics();
    assert.ok(metrics.enqueued >= 1);
  });
});
