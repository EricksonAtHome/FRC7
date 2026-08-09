import { GOV_PORTALS, portalForMinistry } from "../clients/portals.js";
import * as haitiDocs from "../clients/haitidocs.js";

export async function probePortal(portalKey) {
  const portal = portalForMinistry(portalKey);
  if (!portal) throw new Error(`Unknown portal '${portalKey}'`);
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  let status = null, ok = false, error = null;
  try {
    const res = await fetch(portal.baseUrl, {
      method: "GET", redirect: "follow", signal: controller.signal,
      headers: { "user-agent": "AyitiOS-GoV/7.1 (+frc7)" },
    });
    status = res.status; ok = res.status >= 200 && res.status < 500;
  } catch (err) { error = err.message; }
  finally { clearTimeout(timer); }
  return {
    portal: portal.id, name: portal.name, baseUrl: portal.baseUrl,
    related: portal.related || [], egov: portal.egov || null,
    reachable: ok, httpStatus: status, latencyMs: Date.now() - started, error,
  };
}

export async function ministryBrief(portalKey, query) {
  const probe = await probePortal(portalKey);
  let knowledge = { results: [] };
  try { knowledge = await haitiDocs.search(`${portalKey} ${query}`, { limit: 5 }); }
  catch (err) { knowledge = { error: err.message, results: [] }; }
  const q = encodeURIComponent(String(query || "").slice(0, 100));
  const actions = [
    { type: "open_portal", label: `Open ${probe.name}`, url: probe.baseUrl },
    ...(probe.egov ? [{ type: "open_egov", label: "E-gouvernance", url: probe.egov }] : []),
    ...(probe.related || []).map((url) => ({ type: "open_related", label: url, url })),
    { type: "search_public_data", label: "HaitiDocs", url: `https://www.haitidocs.org/?q=${q}` },
    { type: "ayitistats", label: "AyitiStats", url: GOV_PORTALS.ayitistats.baseUrl },
  ];
  return { os: "Ayiti OS (GoV)", ministry: probe.name, query, portal: probe, knowledge, actions };
}

export function routeCitizenIntent(text) {
  const t = String(text || "").toLowerCase();
  const rules = [
    { model: "ayiti.dgi", keys: ["tax", "impôt", "impot", "nif", "patente", "dgi", "taks"] },
    { model: "ayiti.brh", keys: ["inflation", "change", "dollar", "brh", "monnaie"] },
    { model: "ayiti.mef", keys: ["budget", "mef", "finance", "dépense", "depense", "sysdep"] },
    { model: "ayiti.cnmp", keys: ["marché", "marche", "procurement", "cnmp", "appel"] },
    { model: "ayiti.omrh", keys: ["fonction publique", "sigrh", "omrh", "recrutement"] },
    { model: "ayiti.stats", keys: ["statistique", "indicateur", "population", "ihsi", "ayitistats", "données", "donnees"] },
    { model: "ayiti.alert", keys: ["alèt", "alerte", "emergency", "urgence", "seisme", "séisme", "siklon"] },
  ];
  for (const r of rules) {
    const hit = r.keys.find((k) => t.includes(k));
    if (hit) return { model: r.model, reason: `matched:${hit}` };
  }
  return { model: "ayiti.search", reason: "default_search" };
}

/** Lightweight HT/FR/EN assist (no external MT API required) */
export function translateAssist(text, lang = "ht") {
  const t = String(text || "");
  const gloss = {
    tax: { ht: "taks", fr: "impôt" },
    budget: { ht: "bidjè", fr: "budget" },
    inflation: { ht: "enflasyon", fr: "inflation" },
    citizen: { ht: "sitwayen", fr: "citoyen" },
    government: { ht: "gouvènman", fr: "gouvernement" },
  };
  const notes = [];
  for (const [en, map] of Object.entries(gloss)) {
    if (t.toLowerCase().includes(en) || t.toLowerCase().includes(map.ht) || t.toLowerCase().includes(map.fr)) {
      notes.push({ term: en, ht: map.ht, fr: map.fr, en });
    }
  }
  return {
    lang,
    original: t,
    glossaryHits: notes,
    summary: notes.length
      ? `Found ${notes.length} civic term(s). Target lang: ${lang}.`
      : `No glossary hits. Pass through (${lang}).`,
    passThrough: t,
  };
}
