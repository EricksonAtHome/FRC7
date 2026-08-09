export class FRCClient {
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || process.env.FRC_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
    this.apiKey = options.apiKey || process.env.FRC_API_KEY || process.env.AYITI_API_KEY || "ayiti_gov_test_key";
    this.fetch = options.fetch || globalThis.fetch;
  }

  async #req(path, { method = "GET", body, country, region } = {}) {
    const res = await this.fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        ...(country ? { "x-country": country } : {}),
        ...(region ? { "x-frc-region": region } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `HTTP ${res.status}`);
      err.status = res.status; err.data = data; throw err;
    }
    return data;
  }

  health() { return this.#req("/health"); }
  models() { return this.#req("/v1/models"); }
  metrics() { return this.#req("/v1/metrics"); }
  route(body = {}) { return this.#req("/v1/route", { method: "POST", body }); }
  run(model, input, opts = {}) {
    return this.#req(`/v1/run/${encodeURIComponent(model)}`, {
      method: "POST",
      body: { input, sync: opts.sync !== false, ...opts },
      country: opts.country, region: opts.region,
    });
  }
  batch(jobs, opts = {}) {
    return this.#req("/v1/batch", { method: "POST", body: { jobs, sync: opts.sync !== false } });
  }
  execute(source, opts = {}) {
    return this.#req("/v1/execute", { method: "POST", body: { source, sync: opts.sync !== false, ...opts } });
  }
  lint(source) { return this.#req("/v1/lint", { method: "POST", body: { source } }); }
  job(id) { return this.#req(`/v1/jobs/${encodeURIComponent(id)}`); }
  wait(id, { timeoutMs = 30000 } = {}) {
    return this.#req(`/v1/jobs/${encodeURIComponent(id)}/wait?timeoutMs=${timeoutMs}`);
  }
}

export default FRCClient;
