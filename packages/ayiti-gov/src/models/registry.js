export const AYITI_OS = Object.freeze({
  id: "ayiti-os", name: "Ayiti OS", edition: "GoV", country: "HT", version: "7.1.0",
});

export const AYITI_MODELS = Object.freeze({
  "ayiti.search": { id: "ayiti.search", title: "Ayiti Knowledge Search", ministry: "HaitiDocs", liveApi: true },
  "ayiti.stats": { id: "ayiti.stats", title: "AyitiStats Indicators", ministry: "IHSI / AyitiStats", liveApi: true },
  "ayiti.docs": { id: "ayiti.docs", title: "Ayiti Documents", ministry: "Cross-government", liveApi: true },
  "ayiti.mef": { id: "ayiti.mef", title: "MEF Finance Desk", ministry: "MEF", liveApi: true },
  "ayiti.dgi": { id: "ayiti.dgi", title: "DGI Tax Services", ministry: "DGI", liveApi: true },
  "ayiti.brh": { id: "ayiti.brh", title: "BRH Monetary Desk", ministry: "BRH", liveApi: true },
  "ayiti.omrh": { id: "ayiti.omrh", title: "OMRH Public Admin", ministry: "OMRH", liveApi: true },
  "ayiti.cnmp": { id: "ayiti.cnmp", title: "CNMP Procurement", ministry: "CNMP", liveApi: true },
  "ayiti.citizen": { id: "ayiti.citizen", title: "Citizen Services Router", ministry: "Ayiti OS GoV", liveApi: true },
  "ayiti.uxp": { id: "ayiti.uxp", title: "UXP Inter-Agency Exchange", ministry: "UXP", liveApi: false },
  "ayiti.translate": { id: "ayiti.translate", title: "Kreyòl / Français / English assist", ministry: "Ayiti OS GoV", liveApi: false },
  "ayiti.alert": { id: "ayiti.alert", title: "Public alert summarizer", ministry: "Ayiti OS GoV", liveApi: true },
});

export function listModels() { return Object.values(AYITI_MODELS); }
export function getModel(id) {
  const key = String(id || "").trim().toLowerCase();
  const normalized = key.startsWith("ayiti.") ? key : `ayiti.${key}`;
  return AYITI_MODELS[normalized] || AYITI_MODELS[key] || null;
}
export function isAyitiModel(id) { return Boolean(getModel(id)); }
export function assertAyitiModel(id) {
  const m = getModel(id);
  if (!m) {
    const err = new Error(`Forbidden model '${id}'. Ayiti OS GoV allows: ${Object.keys(AYITI_MODELS).join(", ")}`);
    err.code = "AYITI_MODEL_FORBIDDEN";
    throw err;
  }
  return m;
}
