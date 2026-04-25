import { getJob } from "../queue/queue.js";

function executeModel(model, input) {
  return {
    output: `[FRC v2] ${model} processed: ${input}`,
    latency: "8ms"
  };
}

async function loop() {
  console.log("⚙️ Worker node started. Waiting for jobs...");
  while (true) {
    try {
        const job = await getJob();

        if (job) {
          console.log(`\n📦 Processing job: ${job.id}`);
          const result = executeModel(job.model, job.input);
          console.log(`✅ Result:`, result);
        } else {
            // Wait before checking again if queue is empty
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (error) {
        console.error("Worker error:", error.message);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

loop();
