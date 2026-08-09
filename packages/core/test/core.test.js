import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import {
  validateApiKey, DEMO_KEY, resolveRegion, useMemoryQueue,
  enqueueJob, dequeueJob, completeJob, getMetrics,
} from "../src/index.js";

describe("core", () => {
  before(() => useMemoryQueue());

  it("auth + region", () => {
    assert.equal(validateApiKey(DEMO_KEY).ok, true);
    assert.equal(resolveRegion({ country: "HT" }), "ht");
    assert.equal(resolveRegion({ country: "US" }), "us");
  });

  it("queue lifecycle + metrics", async () => {
    const { id } = await enqueueJob({ model: "ayiti.search", input: "x", region: "ht" });
    const job = await dequeueJob();
    assert.equal(job.id, id);
    await completeJob(id, { output: "ok" });
    assert.ok(getMetrics().enqueued >= 1);
    assert.ok(getMetrics().completed >= 1);
  });
});
