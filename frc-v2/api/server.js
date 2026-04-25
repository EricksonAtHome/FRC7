import express from "express";
import { authMiddleware } from "./auth.js";
import { addJob } from "../queue/queue.js";

const app = express();
app.use(express.json());

// AUTH PROTECTED
app.post("/run/:model", authMiddleware, async (req, res) => {
  try {
    const job = await addJob({
      model: req.params.model,
      input: req.body.input,
      apiKey: req.apiKey
    });

    res.json({
      status: "queued",
      jobId: job.id
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to queue job" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 FRC v2 API Gateway running on port ${PORT}`);
});
