import express from "express";
import { execute } from "../shared/engine.js";

const app = express();
app.use(express.json());

app.post("/run", (req, res) => {
  res.json({
    region: "ASIA",
    ...execute(req.body.code)
  });
});

app.listen(4003, () => {
  console.log("ASIA Node running on 4003");
});
