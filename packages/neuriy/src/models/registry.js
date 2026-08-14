/** Neuriy AI model catalog — conversational assistants for FRC7 */

export const NEURIY_AI = Object.freeze({
  id: "neuriy-ai",
  name: "Neuriy AI",
  edition: "Chat",
  version: "7.2.0",
  description: "ChatGPT-style conversational models with sessions, tools, and marketplace apps",
});

export const NEURIY_MODELS = Object.freeze({
  "neuriy.chat": {
    id: "neuriy.chat",
    title: "Neuriy Chat",
    category: "Assistants",
    role: "general conversational assistant",
    streaming: true,
    tools: ["time", "calculator", "marketplace"],
  },
  "neuriy.assistant": {
    id: "neuriy.assistant",
    title: "Neuriy Assistant",
    category: "Productivity",
    role: "helpful task-oriented assistant",
    streaming: true,
    tools: ["time", "calculator", "marketplace", "memory"],
  },
  "neuriy.reason": {
    id: "neuriy.reason",
    title: "Neuriy Reason",
    category: "Assistants",
    role: "step-by-step reasoning companion",
    streaming: true,
    tools: ["calculator"],
    reasoning: true,
  },
  "neuriy.code": {
    id: "neuriy.code",
    title: "Neuriy Code",
    category: "Developer",
    role: "software engineering pair programmer",
    streaming: true,
    tools: ["calculator"],
  },
  "neuriy.creative": {
    id: "neuriy.creative",
    title: "Neuriy Creative",
    category: "Creative",
    role: "creative writing and ideation partner",
    streaming: true,
    tools: [],
  },
  "neuriy.tutor": {
    id: "neuriy.tutor",
    title: "Neuriy Tutor",
    category: "Education",
    role: "patient technical tutor",
    streaming: true,
    tools: ["calculator"],
  },
  "neuriy.translate": {
    id: "neuriy.translate",
    title: "Neuriy Translate",
    category: "Productivity",
    role: "multilingual conversation translator",
    streaming: false,
    tools: [],
  },
  "neuriy.marketplace": {
    id: "neuriy.marketplace",
    title: "Neuriy Marketplace Scout",
    category: "Assistants",
    role: "discover Neuriy Marketplace apps and assistants",
    streaming: false,
    tools: ["marketplace"],
  },
});

export function listModels() {
  return Object.values(NEURIY_MODELS);
}

export function getModel(id) {
  const key = String(id || "").trim().toLowerCase();
  const normalized = key.startsWith("neuriy.") ? key : `neuriy.${key}`;
  return NEURIY_MODELS[normalized] || NEURIY_MODELS[key] || null;
}

export function isNeuriyModel(id) {
  return Boolean(getModel(id));
}

export function assertNeuriyModel(id) {
  const m = getModel(id);
  if (!m) {
    const err = new Error(`Unknown Neuriy model '${id}'. Available: ${Object.keys(NEURIY_MODELS).join(", ")}`);
    err.code = "NEURIY_MODEL_UNKNOWN";
    throw err;
  }
  return m;
}
