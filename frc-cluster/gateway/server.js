import express from "express";
import fetch from "node-fetch";
import helmet from "helmet";

const app = express();
app.use(helmet());
app.use(express.json());

function getNode(country) {
  // Use docker service names instead of localhost for internal networking
  if (country === "US") return "http://us-node:4002/run";
  if (country === "ASIA") return "http://asia-node:4003/run";
  return "http://eu-node:4001/run";
}

app.post("/execute", async (req, res) => {
  const country = req.headers["x-country"] || "EU";
  const node = getNode(country);

  try {
    const response = await fetch(node, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: req.body.code })
    });

    const data = await response.json();

    res.json({
      routed_to: node,
      ...data
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to connect to regional node", details: err.message });
  }
});

app.listen(3000, () => {
  console.log("FRC Gateway running on 3000");
});
