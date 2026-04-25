import express from "express";
import { executeModel } from "../worker/engine.js";

const app = express();
app.use(express.json());

// GET model
app.get("/models/:id", (req, res) => {
  res.json({
    id: req.params.id,
    status: "active",
    type: "ai-model"
  });
});

// RUN model
app.post("/run/:id", (req, res) => {
  const result = executeModel(req.body.input);

  res.json({
    model: req.params.id,
    output: result.output,
    node: "frc-local-node"
  });
});

app.listen(3000, () => {
  console.log("FRC running on http://localhost:3000");
});
