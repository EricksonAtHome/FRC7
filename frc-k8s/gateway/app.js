import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

function route(region) {
  // In K8s, we route using the internal service names
  if (region === "US") return "http://us-service/run";
  if (region === "ASIA") return "http://asia-service/run";
  return "http://eu-service/run";
}

app.post("/execute", async (req, res) => {
  const region = req.headers["x-region"] || "EU";

  try {
    const response = await fetch(route(region), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: req.body.input })
    });

    const data = await response.json();

    res.json({
      routed_to: region,
      ...data
    });
  } catch (err) {
    res.status(500).json({ error: "K8s Service Discovery Failed", details: err.message });
  }
});

app.listen(3000, () => {
  console.log("FRC K8s Gateway running");
});
