export const GOV_PORTALS = Object.freeze({
  mef: { id: "mef", name: "Ministère de l'Économie et des Finances", baseUrl: process.env.AYITI_MEF_URL || "https://www.mef.gouv.ht", related: ["https://www.budget.gouv.ht"] },
  dgi: { id: "dgi", name: "Direction Générale des Impôts", baseUrl: process.env.AYITI_DGI_URL || "https://www.dgi.gouv.ht", related: [] },
  brh: { id: "brh", name: "Banque de la République d'Haïti", baseUrl: process.env.AYITI_BRH_URL || "https://www.brh.ht", related: [] },
  omrh: { id: "omrh", name: "OMRH", baseUrl: process.env.AYITI_OMRH_URL || "https://omrh.gouv.ht", egov: "https://omrh.gouv.ht/egouvernance", related: [] },
  cnmp: { id: "cnmp", name: "CNMP", baseUrl: process.env.AYITI_CNMP_URL || "https://www.cnmp.gouv.ht", related: [] },
  ayitistats: { id: "ayitistats", name: "AyitiStats", baseUrl: process.env.AYITI_STATS_URL || "https://ayitistats.org", related: [] },
  haitidocs: {
    id: "haitidocs", name: "HaitiDocs",
    baseUrl: process.env.AYITI_HAITIDOCS_URL || "https://www.haitidocs.org",
    apiBase: process.env.AYITI_HAITIDOCS_API || "https://www.haitidocs.org/data/api",
    mcp: process.env.AYITI_HAITIDOCS_MCP || "https://mcp.haitidocs.org",
  },
});

export function portalForMinistry(key) {
  return GOV_PORTALS[String(key || "").toLowerCase()] || null;
}
