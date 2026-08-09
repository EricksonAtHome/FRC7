import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { createClient } from "redis";

export const DEMO_KEY = "frc_test_key";
export const AYITI_DEMO_KEY = "ayiti_gov_test_key";

export function loadApiKeys() {
  const keys = new Set([DEMO_KEY, AYITI_DEMO_KEY]);
  if (process.env.FRC_API_KEY) keys.add(process.env.FRC_API_KEY.trim());
  if (process.env.AYITI_API_KEY) keys.add(process.env.AYITI_API_KEY.trim());
  if (process.env.FRC_API_KEYS) {
    for (const k of process.env.FRC_API_KEYS.split(",")) if (k.trim()) keys.add(k.trim());
  }
  if (process.env.NODE_ENV === "production" && process.env.FRC_STRICT_AUTH === "1") {
    keys.delete(DEMO_KEY);
    keys.delete(AYITI_DEMO_KEY);
  }
  return keys;
}

export function generateApiKey(prefix = "frc_live_") {
  return `${prefix}${randomBytes(24).toString("hex")}`;
}

export function hashKey(key) {
  return createHash("sha256").update(String(key)).digest("hex").slice(0, 16);
}

export function validateApiKey(key, keySet = loadApiKeys()) {
  if (!key) return { ok: false, reason: "missing_api_key" };
  const trimmed = key.trim();
  for (const allowed of keySet) {
    const a = Buffer.from(trimmed), b = Buffer.from(allowed);
    if (a.length === b.length && timingSafeEqual(a, b)) {
      return { ok: true, keyHash: hashKey(trimmed) };
    }
  }
  return { ok: false, reason: "invalid_api_key" };
}

export function createAuthMiddleware() {
  const keys = loadApiKeys();
  return (req, res, next) => {
    const key = req.headers["x-api-key"] ||
      (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : undefined);
    const result = validateApiKey(key, keys);
    if (!result.ok) {
      res.status(401).json({ error: "unauthorized", reason: result.reason });
      return;
    }
    req.apiKey = key;
    req.apiKeyHash = result.keyHash;
    next();
  };
}

export const REGIONS = Object.freeze({
  ht: { id: "ht", name: "Haiti", countries: new Set(["HT"]) },
  eu: { id: "eu", name: "Europe", countries: new Set(["FR", "DE", "BE", "NL", "ES", "IT", "GB", "CH"]) },
  us: { id: "us", name: "North America", countries: new Set(["US", "CA", "MX"]) },
  asia: { id: "asia", name: "Asia Pacific", countries: new Set(["CN", "JP", "KR", "IN", "SG"]) },
});

export function resolveRegion({ region, country, ip } = {}) {
  const explicit = String(region || "").toLowerCase();
  if (REGIONS[explicit]) return explicit;
  const c = String(country || "").toUpperCase();
  for (const r of Object.values(REGIONS)) if (r.countries.has(c)) return r.id;
  if (c === "HT" || process.env.FRC_DEFAULT_REGION === "ht") return "ht";
  return "eu";
}

export function describeRoute(input = {}) {
  const region = resolveRegion(input);
  return { region, name: REGIONS[region].name, reason: input.region ? "explicit" : input.country ? "country" : "default" };
}

// ---- Queue + metrics ----
let redisClient = null, redisMode = null;
const memoryQueue = [], memoryJobs = new Map();
const metrics = { enqueued: 0, completed: 0, failed: 0, startedAt: Date.now() };

export function useMemoryQueue() {
  redisMode = "memory"; redisClient = null; memoryQueue.length = 0; memoryJobs.clear();
}

async function getRedis() {
  if (redisMode === "memory") return null;
  if (redisClient?.isOpen) return redisClient;
  try {
    const client = createClient({ url: process.env.REDIS_URL || "redis://127.0.0.1:6379" });
    client.on("error", () => {});
    await client.connect();
    redisClient = client; redisMode = "redis";
    return client;
  } catch {
    redisMode = "memory"; return null;
  }
}

export async function enqueueJob(data) {
  const id = data.id || randomUUID();
  const job = {
    id, model: data.model, input: data.input, region: data.region || "ht",
    meta: data.meta || {}, status: "queued", createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(), result: null, error: null,
  };
  const client = await getRedis();
  if (client) {
    await client.set(`frc:job:${id}`, JSON.stringify(job));
    await client.lPush("frc:jobs", id);
  } else {
    memoryJobs.set(id, job); memoryQueue.push(id);
  }
  metrics.enqueued++;
  return { id, status: "queued" };
}

export async function dequeueJob({ timeoutSec = 1 } = {}) {
  const client = await getRedis();
  let id = null;
  if (client) id = (await client.brPop("frc:jobs", timeoutSec))?.element || null;
  else {
    id = memoryQueue.shift() || null;
    if (!id && timeoutSec > 0) { await new Promise((r) => setTimeout(r, 40)); id = memoryQueue.shift() || null; }
  }
  if (!id) return null;
  const job = await getJob(id);
  if (!job) return null;
  job.status = "running"; job.updatedAt = new Date().toISOString();
  await saveJob(job);
  return job;
}

export async function getJob(id) {
  const client = await getRedis();
  if (client) {
    const raw = await client.get(`frc:job:${id}`);
    return raw ? JSON.parse(raw) : null;
  }
  return memoryJobs.get(id) || null;
}

async function saveJob(job) {
  job.updatedAt = new Date().toISOString();
  const client = await getRedis();
  if (client) await client.set(`frc:job:${job.id}`, JSON.stringify(job));
  else memoryJobs.set(job.id, job);
}

export async function completeJob(id, result) {
  const job = await getJob(id);
  if (!job) throw new Error(`Unknown job ${id}`);
  job.status = "completed"; job.result = result; job.error = null;
  await saveJob(job); metrics.completed++; return job;
}

export async function failJob(id, error) {
  const job = await getJob(id);
  if (!job) throw new Error(`Unknown job ${id}`);
  job.status = "failed"; job.error = String(error?.message || error);
  await saveJob(job); metrics.failed++; return job;
}

export async function waitForJob(id, { timeoutMs = 30000, intervalMs = 80 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = await getJob(id);
    if (!job) throw new Error(`Unknown job ${id}`);
    if (job.status === "completed" || job.status === "failed") return job;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  const err = new Error(`Timed out waiting for job ${id}`);
  err.name = "FRCTimeoutError";
  throw err;
}

export function getMetrics() {
  return {
    ...metrics,
    queueBackend: redisMode || "pending",
    uptimeSec: Math.floor((Date.now() - metrics.startedAt) / 1000),
    queueDepth: memoryQueue.length,
  };
}

export function queueBackend() { return redisMode || "pending"; }

/** Fire-and-forget webhook after job completion */
export async function deliverWebhook(url, payload) {
  if (!url) return { skipped: true };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": "FRC7-Webhook/7.1" },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
