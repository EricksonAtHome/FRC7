import { assertNeuriyModel, isNeuriyModel, listModels, NEURIY_AI } from "./models/registry.js";
import { chat } from "./chat/orchestrator.js";
import { marketplaceHealth } from "./marketplace/client.js";

export async function executeNeuriyModel(model, input, meta = {}) {
  const spec = assertNeuriyModel(model);
  const started = Date.now();

  // Allow JSON chat payloads: { message, sessionId, messages, system }
  let payload = input;
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === "object" && (parsed.message || parsed.messages)) payload = parsed;
      else payload = { message: input };
    } catch {
      payload = { message: input };
    }
  } else if (input && typeof input === "object") {
    payload = input;
  } else {
    payload = { message: String(input ?? "") };
  }

  const result = await chat({
    model: spec.id,
    message: payload.message,
    messages: payload.messages,
    sessionId: payload.sessionId || meta.sessionId,
    system: payload.system,
    meta: { ...meta, ...(payload.meta || {}) },
    useTools: payload.tools !== false,
  });

  return {
    output: result.output,
    provider: result.provider,
    model: result.model,
    latencyMs: result.latencyMs || Date.now() - started,
    usage: result.usage,
    sessionId: result.sessionId,
    tools: result.tools,
    blocked: result.blocked || false,
  };
}

export async function healthcheck() {
  const market = await marketplaceHealth();
  return {
    ok: true,
    ai: NEURIY_AI,
    models: listModels().length,
    remoteLlm: Boolean(process.env.NEURIY_LLM_BASE_URL && process.env.NEURIY_LLM_API_KEY),
    marketplace: market,
  };
}

export { isNeuriyModel, listModels, assertNeuriyModel };
