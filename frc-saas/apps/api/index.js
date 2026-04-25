import express from "express";
import fetch from "node-fetch";
import { validateKey } from "../../services/auth/index.js";
import { track } from "../../services/usage/index.js";
import { getRegion, getClusterUrl } from "../../services/router/index.js";

const app = express();
app.use(express.json());

app.post("/v1/run", async (req, res) => {
  const apiKey = req.headers["x-api-key"];

  if (!validateKey(apiKey)) {
    return res.status(401).json({ error: "Unauthorized: Valid API Key Required" });
  }

  // Track usage for billing
  track(apiKey);

  const region = getRegion(req.ip);
  const clusterUrl = getClusterUrl(region);

  try {
    // In a real environment, this fetches the internal K8s cluster
    /*
    const response = await fetch(clusterUrl, {
      method: "POST",
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ input: req.body.input })
    });
    const data = await response.json();
    */

    // Simulated Response for Gateway Demonstration
    const data = {
      output: `[FRC GLOBAL] processed: ${req.body.input}`,
      latency: "9ms",
      status: "success"
    };

    res.json({
      region,
      ...data
    });
  } catch (error) {
    res.status(500).json({ error: "Cluster unreachable" });
  }
});

app.listen(3000, () => {
  console.log("FRC Global SaaS API Gateway running on port 3000");
});
