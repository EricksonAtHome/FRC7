import fetch from "node-fetch";
import { parseFRCL } from "../frcl/parser.js";

export async function runFRCL(script) {
  const parsed = parseFRCL(script);

  if (!parsed.model || !parsed.input) {
      throw new Error("Invalid FRCL script. Model or input missing.");
  }

  const res = await fetch(`http://localhost:3000/run/${parsed.model}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: parsed.input })
  });

  return res.json();
}

export function executeModel(input) {
  return {
    output: `AI processed: ${input}`,
    latency: "12ms"
  };
}
