import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FRCClient } from "../src/index.js";

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
});
