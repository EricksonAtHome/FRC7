import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyze, lint, compile } from "../src/index.js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("frcl", () => {
  it("parses demo.frcl", () => {
    const { plan } = compile(readFileSync(join(root, "demo.frcl"), "utf8"));
    assert.equal(plan.model, "ayiti.stats");
    assert.equal(plan.region, "ht");
    assert.equal(plan.runs.length, 1);
  });

  it("lints valid and invalid scripts", () => {
    assert.equal(lint('run model ayiti.search { input "x" }').ok, true);
    assert.equal(lint('set env "prod"').ok, false);
  });

  it("supports webhook/lang/retry props", () => {
    const { plan } = analyze(`run model ayiti.search {
      input "hi"
      retry 2
      lang ht
      webhook https://example.com/hook
    }`);
    assert.equal(plan.runs[0].retry, 2);
    assert.equal(plan.runs[0].lang, "ht");
    assert.equal(plan.runs[0].webhook, "https://example.com/hook");
  });
});
