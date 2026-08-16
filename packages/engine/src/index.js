import { analyze } from "@frc/frcl";
import { executeAyitiModel, isAyitiModel, assertAyitiModel, listModels as listAyitiModels } from "@ayiti/gov";
import { executeNeuriyModel, isNeuriyModel, assertNeuriyModel, listModels as listNeuriyModels } from "@neuriy/ai";

/** FRC7 policy: Ayiti GoV + Neuriy chat models; builtin only with FRC_ALLOW_BUILTIN=1 */
export function resolveMode(model) {
  if (isNeuriyModel(model)) return "neuriy";
  if (isAyitiModel(model)) return "ayiti";
  if (process.env.FRC_ALLOW_BUILTIN === "1" && ["echo", "summarizer", "coder"].includes(String(model))) {
    return "builtin";
  }
  return "forbidden";
}

export function listModels() {
  return [
    ...listNeuriyModels().map((m) => ({ ...m, family: "neuriy" })),
    ...listAyitiModels().map((m) => ({ ...m, family: "ayiti" })),
  ];
}

async function executeBuiltin(model, input) {
  const started = Date.now();
  const text = String(input ?? "");
  let output = text;
  if (model === "summarizer") output = text.slice(0, 180) + (text.length > 180 ? "..." : "");
  else if (model === "coder") output = `// FRC7 scaffold\nexport const prompt = ${JSON.stringify(text.slice(0, 120))};\n`;
  await new Promise((r) => setTimeout(r, 2));
  return {
    output,
    provider: "builtin",
    model,
    latencyMs: Date.now() - started,
    usage: { inputChars: text.length, outputChars: output.length },
  };
}

export async function executeJob({ model, input, meta = {} }) {
  if (!model) throw new Error("model required");
  if (input == null) throw new Error("input required");
  const mode = resolveMode(model);
  if (mode === "neuriy") {
    assertNeuriyModel(model);
    return executeNeuriyModel(model, input, meta);
  }
  if (mode === "ayiti") {
    assertAyitiModel(model);
    return executeAyitiModel(model, input, meta);
  }
  if (mode === "builtin") return executeBuiltin(model, input);
  const allowed = listModels().map((m) => m.id).join(", ");
  const err = new Error(`Model '${model}' not allowed. Use Neuriy or Ayiti models: ${allowed}`);
  err.code = "FRC_MODEL_FORBIDDEN";
  throw err;
}

export async function executeFrcl(source, options = {}) {
  const { ast, plan, validation } = analyze(source);
  if (!validation.ok) {
    const err = new Error(`Invalid FRCL: ${validation.errors.join("; ")}`);
    err.name = "FRCLValidationError";
    throw err;
  }
  const results = [];
  for (const run of plan.runs) {
    const attempts = Math.max(1, Number(run.retry ?? 0) + 1);
    let lastErr;
    for (let a = 1; a <= attempts; a++) {
      try {
        const result = await executeJob({
          model: run.model,
          input: run.input,
          meta: { ...options, env: plan.env, region: options.region || plan.region, lang: run.lang || plan.lang, stream: run.stream, webhook: run.webhook },
        });
        results.push(result);
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        if (a < attempts) await new Promise((r) => setTimeout(r, 40 * a));
      }
    }
    if (lastErr) throw lastErr;
  }
  return { ast, plan, validation, results, output: results.map((r) => r.output).join("\n\n") };
}
