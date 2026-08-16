/**
 * Optional OpenAI-compatible chat completions provider.
 * Set NEURIY_LLM_BASE_URL + NEURIY_LLM_API_KEY (+ optional NEURIY_LLM_MODEL).
 * When unset, Neuriy uses the local conversational engine.
 */

export function remoteConfigured() {
  return Boolean(process.env.NEURIY_LLM_BASE_URL && process.env.NEURIY_LLM_API_KEY);
}

export async function remoteChat({ messages, model, temperature = 0.7, maxTokens = 1024 } = {}) {
  const base = String(process.env.NEURIY_LLM_BASE_URL).replace(/\/$/, "");
  const apiModel = process.env.NEURIY_LLM_MODEL || model || "gpt-4o-mini";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.NEURIY_LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: apiModel,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`remote LLM error ${res.status}: ${body.slice(0, 200)}`);
    err.code = "NEURIY_REMOTE_LLM_ERROR";
    throw err;
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  return {
    content,
    provider: "openai-compatible",
    model: apiModel,
    usage: data.usage || null,
    raw: data,
  };
}
