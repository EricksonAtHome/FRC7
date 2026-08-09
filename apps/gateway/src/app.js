import express from "express";
import {
  createAuthMiddleware, resolveRegion, describeRoute, enqueueJob, getJob,
  waitForJob, queueBackend, getMetrics, deliverWebhook, completeJob, failJob, dequeueJob,
} from "@frc/core";
import { analyze, lint } from "@frc/frcl";
import { executeFrcl, executeJob, listModels } from "@frc/engine";
import { healthcheck as ayitiHealth, AYITI_OS } from "@ayiti/gov";

export function createApp(options = {}) {
  const app = express();
  const auth = options.authMiddleware || createAuthMiddleware();
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", async (_req, res) => {
    let ayiti = null;
    try { ayiti = await ayitiHealth(); } catch (e) { ayiti = { ok: false, error: e.message }; }
    res.json({
      ok: true, service: "frc7-gateway", version: "7.1.0",
      queue: queueBackend(), metrics: getMetrics(), ayiti,
    });
  });

  app.get("/v1/models", (_req, res) => {
    res.json({
      os: AYITI_OS,
      policy: "Ayiti OS (GoV) models by default. Set FRC_ALLOW_BUILTIN=1 for echo/summarizer/coder demos.",
      models: listModels(),
    });
  });

  app.get("/v1/metrics", auth, (_req, res) => {
    res.json(getMetrics());
  });

  app.get("/v1/regions", (_req, res) => {
    res.json({ regions: ["ht", "eu", "us", "asia"], default: "ht" });
  });

  app.post("/v1/route", (req, res) => {
    res.json(describeRoute({
      region: req.body?.region || req.headers["x-frc-region"],
      country: req.body?.country || req.headers["x-country"] || req.headers["x-nf-country"],
      ip: req.body?.ip || req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim(),
    }));
  });

  app.post("/v1/lint", auth, (req, res) => {
    const source = req.body?.source || req.body?.frcl;
    if (!source) return res.status(400).json({ error: "source is required" });
    res.json(lint(source));
  });

  app.post("/v1/parse", auth, (req, res) => {
    try {
      const source = req.body?.source || req.body?.frcl;
      if (!source) return res.status(400).json({ error: "source is required" });
      res.json(analyze(source));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  async function handleRun(req, res) {
    try {
      const input = req.body?.input;
      if (input == null || input === "") return res.status(400).json({ error: "input is required" });
      const region = resolveRegion({
        region: req.body?.region || req.headers["x-frc-region"] || "ht",
        country: req.headers["x-country"] || req.headers["x-nf-country"],
      });
      const sync = req.body?.sync !== false && req.query.sync !== "0";
      const webhook = req.body?.webhook;

      if (sync) {
        const result = await executeJob({
          model: req.params.model, input,
          meta: { region, env: req.body?.env || "prod", lang: req.body?.lang, webhook },
        });
        if (webhook) await deliverWebhook(webhook, { type: "frc.job.completed", result });
        return res.json({ status: "completed", region, result });
      }

      const job = await enqueueJob({
        model: req.params.model, input, region, apiKeyHash: req.apiKeyHash,
        meta: { env: req.body?.env || "prod", webhook, lang: req.body?.lang },
      });
      res.status(202).json({ status: "queued", jobId: job.id, region, poll: `/v1/jobs/${job.id}` });
    } catch (err) {
      const status = err.code === "FRC_MODEL_FORBIDDEN" || err.code === "AYITI_MODEL_FORBIDDEN" ? 403 : 500;
      res.status(status).json({ error: err.message, code: err.code });
    }
  }

  app.post("/v1/run/:model", auth, handleRun);
  app.post("/run/:model", auth, handleRun);

  app.post("/v1/batch", auth, async (req, res) => {
    try {
      const jobs = req.body?.jobs;
      if (!Array.isArray(jobs) || !jobs.length) return res.status(400).json({ error: "jobs[] required" });
      if (jobs.length > 20) return res.status(400).json({ error: "max 20 jobs per batch" });
      const sync = req.body?.sync !== false;
      const region = resolveRegion({ region: req.body?.region || "ht" });

      if (sync) {
        const results = [];
        for (const j of jobs) {
          results.push(await executeJob({ model: j.model, input: j.input, meta: { region, ...j.meta } }));
        }
        return res.json({ status: "completed", count: results.length, results });
      }

      const queued = [];
      for (const j of jobs) {
        queued.push(await enqueueJob({ model: j.model, input: j.input, region, meta: j.meta || {} }));
      }
      res.status(202).json({ status: "queued", jobs: queued });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/v1/execute", auth, async (req, res) => {
    try {
      const source = req.body?.source || req.body?.frcl;
      if (!source) return res.status(400).json({ error: "source is required" });
      const analyzed = analyze(source);
      if (!analyzed.validation.ok) {
        return res.status(400).json({ error: "invalid_frcl", details: analyzed.validation });
      }
      const region = resolveRegion({ region: req.body?.region || analyzed.plan.region || "ht" });
      if (req.body?.sync === false) {
        const jobs = [];
        for (const run of analyzed.plan.runs) {
          jobs.push(await enqueueJob({
            model: run.model, input: run.input, region,
            meta: { webhook: run.webhook, lang: run.lang || analyzed.plan.lang },
          }));
        }
        return res.status(202).json({ status: "queued", jobs, plan: analyzed.plan });
      }
      const out = await executeFrcl(source, { region, env: analyzed.plan.env });
      // deliver webhooks from plan runs
      for (let i = 0; i < analyzed.plan.runs.length; i++) {
        const wh = analyzed.plan.runs[i].webhook;
        if (wh) await deliverWebhook(wh, { type: "frc.run.completed", result: out.results[i] });
      }
      res.json({ status: "completed", region, plan: out.plan, results: out.results, output: out.output });
    } catch (err) {
      const status = err.code === "FRC_MODEL_FORBIDDEN" || err.code === "AYITI_MODEL_FORBIDDEN" ? 403 : 500;
      res.status(status).json({ error: err.message, code: err.code });
    }
  });

  app.get("/v1/jobs/:id", auth, async (req, res) => {
    const job = await getJob(req.params.id);
    if (!job) return res.status(404).json({ error: "job_not_found" });
    res.json(job);
  });

  app.get("/v1/jobs/:id/wait", auth, async (req, res) => {
    try {
      const job = await waitForJob(req.params.id, {
        timeoutMs: Math.min(Number(req.query.timeoutMs) || 30000, 120000),
      });
      res.json(job);
    } catch (err) {
      res.status(err.name === "FRCTimeoutError" ? 408 : 500).json({ error: err.message });
    }
  });

  /** Embedded worker tick for demos without a separate process */
  app.post("/v1/worker/tick", auth, async (req, res) => {
    const job = await dequeueJob({ timeoutSec: 0 });
    if (!job) return res.json({ processed: 0 });
    try {
      const result = await executeJob({ model: job.model, input: job.input, meta: { ...job.meta, region: job.region } });
      await completeJob(job.id, result);
      if (job.meta?.webhook) await deliverWebhook(job.meta.webhook, { type: "frc.job.completed", jobId: job.id, result });
      res.json({ processed: 1, jobId: job.id, status: "completed" });
    } catch (err) {
      await failJob(job.id, err);
      res.json({ processed: 1, jobId: job.id, status: "failed", error: err.message });
    }
  });

  return app;
}
