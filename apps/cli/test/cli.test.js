import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const cli = join(dirname(fileURLToPath(import.meta.url)), "../src/index.js");
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });

describe("cli", () => {
  it("version + models", () => {
    assert.match(run("version").stdout, /7\.2\.0/);
    assert.match(run("models").stdout, /ayiti\.search/);
    assert.match(run("models").stdout, /neuriy\.chat/);
  });

  it("exec translate", () => {
    const out = run("exec", "ayiti.translate", "citizen", "tax");
    assert.equal(out.status, 0, out.stderr);
    assert.match(out.stdout, /glossary|term|citizen/i);
  });

  it("chat neuriy", () => {
    const out = run("chat", "neuriy.chat", "Hello");
    assert.equal(out.status, 0, out.stderr);
    assert.match(out.stdout, /Neuriy/i);
  });
});
