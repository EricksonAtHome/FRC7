#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { lint, analyze } from "@frc/frcl";
import { executeFrcl, executeJob, listModels } from "@frc/engine";
import { describeRoute, generateApiKey, getMetrics, DEMO_KEY } from "@frc/core";
import { healthcheck as ayitiHealth } from "@ayiti/gov";
import { healthcheck as neuriyHealth, chat } from "@neuriy/ai";

const VERSION = "7.2.0";

const HELP = `
FRC7 CLI v${VERSION} — Fast Response Connection + Ayiti OS + Neuriy AI

Commands:
  run <file.frcl>           Execute FRCL locally
  exec <model> <input…>     Run one model (Neuriy or Ayiti)
  chat [model] <message…>   Neuriy conversational chat
  lint <file.frcl>          Validate FRCL
  parse <file.frcl>         Show AST/plan
  models                    List Neuriy + Ayiti models
  route [--country XX]      Geo route preview
  health                    Probe Ayiti + Neuriy
  metrics                   Local process metrics snapshot
  keygen [--ayiti]          Generate API key
  call <file.frcl>          Execute against FRC_URL gateway
  version | help
`;

function read(file) {
  const p = resolve(process.cwd(), file);
  if (!existsSync(p)) throw new Error(`File not found: ${p}`);
  return readFileSync(p, "utf8");
}

async function main(argv) {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case "run": {
      const out = await executeFrcl(read(rest[0]));
      console.log(out.plan.print ? out.output : JSON.stringify(out.results, null, 2));
      break;
    }
    case "exec": {
      const result = await executeJob({ model: rest[0], input: rest.slice(1).join(" ") });
      console.log(result.output);
      break;
    }
    case "chat": {
      let model = "neuriy.chat";
      let parts = rest;
      if (rest[0]?.startsWith("neuriy.")) {
        model = rest[0];
        parts = rest.slice(1);
      }
      const message = parts.join(" ") || "Hello";
      const result = await chat({ model, message });
      console.log(result.output);
      if (result.sessionId) console.error(`# session ${result.sessionId}`);
      break;
    }
    case "lint": {
      const result = lint(read(rest[0]));
      console.log(JSON.stringify(result, null, 2));
      if (!result.ok) process.exitCode = 1;
      break;
    }
    case "parse":
      console.log(JSON.stringify(analyze(read(rest[0])), null, 2));
      break;
    case "models":
      console.log(JSON.stringify(listModels(), null, 2));
      break;
    case "route": {
      const i = rest.indexOf("--country");
      console.log(JSON.stringify(describeRoute({ country: i >= 0 ? rest[i + 1] : "HT", region: "ht" }), null, 2));
      break;
    }
    case "health":
      console.log(JSON.stringify({
        ayiti: await ayitiHealth(),
        neuriy: await neuriyHealth(),
      }, null, 2));
      break;
    case "metrics":
      console.log(JSON.stringify(getMetrics(), null, 2));
      break;
    case "keygen":
      console.log(generateApiKey(rest.includes("--ayiti") ? "ayiti_live_" : "frc_live_"));
      break;
    case "call": {
      const base = (process.env.FRC_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
      const key = process.env.FRC_API_KEY || process.env.AYITI_API_KEY || DEMO_KEY;
      const res = await fetch(`${base}/v1/execute`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key },
        body: JSON.stringify({ source: read(rest[0]), sync: true }),
      });
      const body = await res.json();
      if (!res.ok) { console.error(JSON.stringify(body, null, 2)); process.exitCode = 1; }
      else console.log(body.output || JSON.stringify(body, null, 2));
      break;
    }
    case "version": case "-v": case "--version":
      console.log(VERSION); break;
    case "help": case "-h": case "--help": case undefined:
      console.log(HELP.trim()); break;
    default:
      throw new Error(`Unknown command '${cmd}'`);
  }
}

main(process.argv.slice(2)).catch((err) => {
  console.error(`error: ${err.message}`);
  process.exit(1);
});
