import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { executeJob, executeFrcl, resolveMode } from "../src/index.js";

describe("engine policy", () => {
  it("prefers ayiti models", () => {
    assert.equal(resolveMode("ayiti.search"), "ayiti");
    assert.equal(resolveMode("models5"), "forbidden");
  });

  it("rejects forbidden models", async () => {
    await assert.rejects(() => executeJob({ model: "models5", input: "x" }), /not allowed|Forbidden/);
  });

  it("runs ayiti translate via frcl", async () => {
    const out = await executeFrcl(`run model ayiti.translate { input "citizen tax" }\nprint result`);
    assert.ok(out.output.length > 0);
  });
});
