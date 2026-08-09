import { dequeueJob, completeJob, failJob, useMemoryQueue } from "../../packages/core/src/index.js";
import { executeJob } from "../../packages/engine/src/index.js";

if (process.env.REDIS_URL == null) useMemoryQueue();

async function loop() {
  console.log("FRC7 worker — Ayiti OS GoV models");
  while (true) {
    try {
      const job = await dequeueJob({ timeoutSec: 1 });
      if (!job) { await new Promise((r) => setTimeout(r, 200)); continue; }
      console.log(`→ ${job.id} ${job.model}`);
      try {
        const result = await executeJob({ model: job.model, input: job.input, meta: job.meta });
        await completeJob(job.id, result);
        console.log(`✓ ${job.id}`);
      } catch (err) {
        await failJob(job.id, err);
        console.error(`✗ ${job.id}: ${err.message}`);
      }
    } catch (err) {
      console.error(err.message);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

loop();
