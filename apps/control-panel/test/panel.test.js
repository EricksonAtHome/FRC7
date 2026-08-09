import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const pub = join(dirname(fileURLToPath(import.meta.url)), "../public");

describe("control panel", () => {
  it("ships UI", () => {
    assert.ok(existsSync(join(pub, "index.html")));
    assert.match(readFileSync(join(pub, "index.html"), "utf8"), /FRC7/);
  });
});
