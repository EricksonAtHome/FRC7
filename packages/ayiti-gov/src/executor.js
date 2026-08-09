import { assertAyitiModel, AYITI_OS } from "./models/registry.js";
import * as haitiDocs from "./clients/haitidocs.js";
import { ministryBrief, routeCitizenIntent, probePortal, translateAssist } from "./adapters/gov.js";
import { GOV_PORTALS } from "./clients/portals.js";

function citationsFrom(payload) {
  const out = [];
  for (const r of payload?.results || payload?.knowledge?.results || []) {
    if (r?.url || r?.title) out.push({ id: r.id, title: r.title, url: r.url, type: r.type });
  }
  if (payload?.portal?.baseUrl) {
    out.push({ id: `portal:${payload.portal.portal}`, title: payload.portal.name, url: payload.portal.baseUrl, type: "portal" });
  }
  return out;
}

function formatOutput(model, payload) {
  if (payload?.summary) return payload.summary;
  if (Array.isArray(payload?.results)) {
    return [`${model.title} — ${payload.results.length} result(s)`,
      ...payload.results.slice(0, 8).map((r, i) => `${i + 1}. [${r.type || "item"}] ${r.title}${r.url ? ` — ${r.url}` : ""}`),
    ].join("\n");
  }
  if (payload?.portal) {
    const lines = [
      model.title, `Ministry: ${payload.ministry}`,
      `Portal: ${payload.portal.baseUrl} (${payload.portal.reachable ? "up" : "down"})`,
    ];
    for (const a of (payload.actions || []).slice(0, 5)) lines.push(`• ${a.label}: ${a.url}`);
    for (const r of (payload.knowledge?.results || []).slice(0, 4)) lines.push(`• ${r.title}`);
    return lines.join("\n");
  }
  if (payload?.envelope) return JSON.stringify(payload.envelope, null, 2);
  if (payload?.passThrough != null) return `${payload.summary}\n\n${payload.passThrough}`;
  return JSON.stringify(payload, null, 2);
}

function wrap(model, input, payload, started) {
  return {
    os: AYITI_OS, model: model.id, title: model.title, ministry: model.ministry,
    input: String(input ?? ""), output: formatOutput(model, payload), data: payload,
    provider: "ayiti-os-gov", latencyMs: Date.now() - started, citations: citationsFrom(payload),
  };
}

export async function executeAyitiModel(modelId, input, meta = {}) {
  const model = assertAyitiModel(modelId);
  const started = Date.now();
  const text = String(input ?? "");

  switch (model.id) {
    case "ayiti.search":
      return wrap(model, text, await haitiDocs.search(text, { limit: 8 }), started);
    case "ayiti.stats": {
      const catalog = await haitiDocs.getCatalog();
      const q = text.toLowerCase();
      const matched = q
        ? catalog.series.filter((s) => JSON.stringify(s).toLowerCase().includes(q))
        : catalog.series.slice(0, 12);
      let knowledge = null;
      if (q && matched.length < 3) {
        try { knowledge = await haitiDocs.search(q, { limit: 6, filters: { types: ["indicator"] } }); }
        catch { /* ignore */ }
      }
      return wrap(model, text, {
        summary: `AyitiStats / HaitiDocs: ${catalog.seriesCount} series; matched ${matched.length}`,
        results: knowledge?.results || matched.slice(0, 10).map((s) => ({ id: s.series_id, title: s.series_id, url: s.csvUrl, type: "indicator" })),
        matched: matched.slice(0, 15), ayitistats: GOV_PORTALS.ayitistats.baseUrl,
      }, started);
    }
    case "ayiti.docs": {
      const found = await haitiDocs.search(text, { limit: 5, filters: { types: ["doc"] } });
      return wrap(model, text, found, started);
    }
    case "ayiti.mef": return wrap(model, text, await ministryBrief("mef", text), started);
    case "ayiti.dgi": return wrap(model, text, await ministryBrief("dgi", text), started);
    case "ayiti.brh": {
      const brief = await ministryBrief("brh", text || "inflation");
      try { brief.knowledge = await haitiDocs.search(`BRH ${text || "inflation"}`, { limit: 5 }); } catch { /* keep */ }
      return wrap(model, text, brief, started);
    }
    case "ayiti.omrh": return wrap(model, text, await ministryBrief("omrh", text), started);
    case "ayiti.cnmp": return wrap(model, text, await ministryBrief("cnmp", text), started);
    case "ayiti.citizen": {
      const route = routeCitizenIntent(text);
      const nested = await executeAyitiModel(route.model, text, meta);
      return wrap(model, text, {
        route, summary: `Citizen request routed to ${route.model} (${route.reason})`,
        result: nested.data, results: nested.citations,
      }, started);
    }
    case "ayiti.uxp": {
      let body; try { body = JSON.parse(text); } catch { body = { message: text }; }
      return wrap(model, text, {
        summary: "UXP inter-agency envelope ready",
        envelope: {
          protocol: "ayiti-uxp", version: "1.0", os: "Ayiti OS (GoV)",
          createdAt: new Date().toISOString(),
          from: body.from || "ayiti-os-gov", to: body.to || "agency:*",
          classification: body.classification || "OFFICIAL",
          payload: body.payload || body,
        },
      }, started);
    }
    case "ayiti.translate":
      return wrap(model, text, translateAssist(text, meta.lang || "ht"), started);
    case "ayiti.alert": {
      const knowledge = await haitiDocs.search(`Haiti alert emergency ${text}`, { limit: 6 });
      return wrap(model, text, {
        summary: `Public alert brief — ${knowledge.results?.length || 0} sources`,
        results: knowledge.results || [],
        guidance: "Verify with official .gouv.ht channels before acting.",
      }, started);
    }
    default:
      throw new Error(`No executor for ${model.id}`);
  }
}

export async function healthcheck() {
  const checks = {};
  try { checks.haitidocs = await haitiDocs.health(); }
  catch (err) { checks.haitidocs = { status: "error", error: err.message }; }
  for (const key of ["mef", "dgi", "brh", "omrh", "cnmp", "ayitistats"]) {
    try { checks[key] = await probePortal(key); }
    catch (err) { checks[key] = { error: err.message }; }
  }
  return { os: AYITI_OS, ok: checks.haitidocs?.status === "ok", checks };
}
