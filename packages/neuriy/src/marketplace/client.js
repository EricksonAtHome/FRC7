/**
 * Neuriy Marketplace HTTP client (compatible with neuriy/Neuriy-Marketplace API).
 * Falls back to a local catalog of Neuriy assistants when remote is unavailable.
 */

const DEFAULT_BASE = process.env.NEURIY_MARKETPLACE_URL || "https://api.neuriy.ai";
// Local marketplace default when developing against the cloned repo:
const LOCAL_FALLBACK = process.env.NEURIY_MARKETPLACE_LOCAL || "http://127.0.0.1:8000";

const LOCAL_CATALOG = [
  {
    id: "neuriy-chat",
    name: "Neuriy Chat",
    category: "Assistants",
    description: "General conversational AI for everyday questions",
    featured: true,
    rating: 4.9,
  },
  {
    id: "neuriy-code",
    name: "Neuriy Code",
    category: "Developer",
    description: "Pair-programming assistant for software engineers",
    featured: true,
    rating: 4.8,
  },
  {
    id: "neuriy-tutor",
    name: "Neuriy Tutor",
    category: "Education",
    description: "Patient tutor for ML, transformers, and AI systems",
    featured: false,
    rating: 4.7,
  },
  {
    id: "neuriy-creative",
    name: "Neuriy Creative",
    category: "Creative",
    description: "Stories, poetry, and brainstorming partner",
    featured: false,
    rating: 4.6,
  },
  {
    id: "frc7-bridge",
    name: "FRC7 Bridge",
    category: "Productivity",
    description: "Run FRC7 / Ayiti OS models from Neuriy chat",
    featured: true,
    rating: 4.5,
  },
];

async function tryFetch(base, path, timeoutMs = 2500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}${path}`, { signal: ctrl.signal, headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function searchMarketplace({ q = "", category = "" } = {}) {
  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (category) query.set("category", category);
  const path = `/api/apps?${query.toString()}`;

  for (const base of [process.env.NEURIY_MARKETPLACE_URL, LOCAL_FALLBACK].filter(Boolean)) {
    try {
      const data = await tryFetch(base, path);
      const apps = data.apps || data.items || data || [];
      return { ok: true, source: base, apps: Array.isArray(apps) ? apps.slice(0, 12) : [] };
    } catch {
      /* try next */
    }
  }

  const ql = String(q || "").toLowerCase();
  const cl = String(category || "").toLowerCase();
  let apps = LOCAL_CATALOG.filter((a) => {
    const hay = `${a.name} ${a.description} ${a.category}`.toLowerCase();
    const okQ = !ql || hay.includes(ql);
    const okC = !cl || a.category.toLowerCase() === cl;
    return okQ && okC;
  });
  return { ok: true, source: "local-fallback", apps };
}

export async function marketplaceHealth() {
  for (const base of [process.env.NEURIY_MARKETPLACE_URL, LOCAL_FALLBACK, DEFAULT_BASE].filter(Boolean)) {
    try {
      const data = await tryFetch(base, "/health", 1500);
      return { ok: true, base, data };
    } catch {
      /* next */
    }
  }
  return { ok: false, source: "local-fallback", apps: LOCAL_CATALOG.length };
}

export function localCatalog() {
  return LOCAL_CATALOG;
}
