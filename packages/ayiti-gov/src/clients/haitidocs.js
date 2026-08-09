import { GOV_PORTALS } from "./portals.js";

const TIMEOUT = Number(process.env.AYITI_HTTP_TIMEOUT_MS || 20000);

async function httpJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || TIMEOUT);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { accept: "application/json", ...(options.headers || {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return res.json();
  } finally { clearTimeout(timer); }
}

function abs(path) {
  if (!path) return null;
  if (/^https?:/i.test(path)) return path;
  return `${GOV_PORTALS.haitidocs.baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function health() {
  return httpJson(`${GOV_PORTALS.haitidocs.mcp.replace(/\/$/, "")}/health`);
}

export async function getCatalog() {
  const catalog = await httpJson(`${GOV_PORTALS.haitidocs.apiBase.replace(/\/$/, "")}/catalog.json`);
  return {
    buildId: catalog.build_id,
    generatedAt: catalog.generated_at,
    seriesCount: catalog.downloads?.series?.length || 0,
    series: (catalog.downloads?.series || []).map((s) => ({ ...s, csvUrl: abs(s.csv_url), sdmxUrl: abs(s.sdmx_url) })),
    downloads: catalog.downloads?.all,
  };
}

export async function mcpCall(name, args = {}) {
  const url = GOV_PORTALS.haitidocs.mcp.replace(/\/$/, "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name, arguments: args } }),
    });
    if (!res.ok) throw new Error(`MCP HTTP ${res.status}`);
    const text = await res.text();
    const dataLine = text.split("\n").map((l) => l.trim()).find((l) => l.startsWith("data:"));
    const payload = JSON.parse(dataLine ? dataLine.slice(5).trim() : text);
    if (payload.error) throw new Error(payload.error.message || "MCP error");
    const result = payload.result || payload;
    if (result.structuredContent) return result.structuredContent;
    const first = result.content?.find?.((c) => c.type === "text");
    if (first?.text) { try { return JSON.parse(first.text); } catch { return { text: first.text }; } }
    return result;
  } finally { clearTimeout(timer); }
}

export const search = (query, opts = {}) => mcpCall("search", { query, limit: opts.limit ?? 8, filters: opts.filters ?? null });
export const fetchResource = (id, extra = {}) => mcpCall("fetch", { id, ...extra });
export const listDocuments = (filters = {}) => mcpCall("list_documents", filters);
