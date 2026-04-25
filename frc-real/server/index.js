import express from "express";

const app = express();
app.use(express.json());

// Get model
app.get("/models/:id", (req, res) => {
  res.json({
    id: req.params.id,
    status: "active",
    type: "ai-model"
  });
});

// Run model
app.post("/run/:id", (req, res) => {
  const input = req.body.input;

  res.json({
    model: req.params.id,
    output: `AI Processed: ${input}`,
    node: "local-dev-node",
    latency: "12ms"
  });
});

app.listen(3000, () => {
  console.log("🌐 FRC API Server running on port 3000");
});
