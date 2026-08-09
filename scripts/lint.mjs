#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const errors = [];
const required = [
  "package.json", "packages/frcl/src/index.js", "packages/engine/src/index.js",
  "packages/core/src/index.js", "packages/ayiti-gov/src/index.js",
  "apps/gateway/src/app.js", "apps/cli/src/index.js", "README.md", "demo.frcl",
];
for (const p of required) if (!existsSync(join(root, p))) errors.push(`missing ${p}`);

const secretRe = new RegExp(["sk-", "live-"].join("") + "|AKIA" + "[0-9A-Z]{16}");
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (["node_modules", ".git", "img"].includes(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(js|mjs|yml|yaml|md|frcl)$/.test(name) && !p.endsWith("scripts/lint.mjs")) {
      if (secretRe.test(readFileSync(p, "utf8"))) errors.push(`possible secret in ${p}`);
    }
  }
}
walk(root);
if (errors.length) { console.error("lint failed:"); errors.forEach((e) => console.error(" -", e)); process.exit(1); }
console.log("lint ok");
