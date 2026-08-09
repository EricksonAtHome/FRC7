const sourceEl = document.getElementById("source");
const outputEl = document.getElementById("output");
const apiKeyEl = document.getElementById("apiKey");
const modelEl = document.getElementById("model");

async function call(path, body, method = "POST") {
  const res = await fetch(path, {
    method,
    headers: { "content-type": "application/json", "x-api-key": apiKeyEl.value.trim() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function show(v) {
  outputEl.textContent = typeof v === "string" ? v : JSON.stringify(v, null, 2);
}

document.getElementById("runBtn").onclick = async () => {
  show("Executing…");
  try {
    if (modelEl.value) {
      const data = await call(`/v1/run/${modelEl.value}`, { input: sourceEl.value, sync: true, region: "ht" });
      show(data.result?.output || data);
    } else {
      const data = await call("/v1/execute", { source: sourceEl.value, sync: true, region: "ht" });
      show(data.output || data);
    }
  } catch (e) { show(`Error: ${e.message}`); }
};

document.getElementById("lintBtn").onclick = async () => {
  show("Linting…");
  try { show(await call("/v1/lint", { source: sourceEl.value })); }
  catch (e) { show(`Error: ${e.message}`); }
};

document.getElementById("modelsBtn").onclick = async () => {
  show("Loading models…");
  try { show(await call("/v1/models", undefined, "GET")); }
  catch (e) { show(`Error: ${e.message}`); }
};
