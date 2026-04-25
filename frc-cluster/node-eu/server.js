import express from "express";
import { execute } from "../shared/engine.js";

const app = express();
app.use(express.json());

app.post("/run", (req, res) => {
  const result = execute(req.body.code);

  res.json({
    region: "EU",
    ...result
  });
});

app.listen(4001, () => {
  console.log("EU Node running on 4001");
});
