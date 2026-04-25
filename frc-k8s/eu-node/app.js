import express from "express";
import { execute } from "../shared/engine.js";

const app = express();
app.use(express.json());

app.post("/run", (req, res) => {
  res.json({
    region: "EU",
    ...execute(req.body.input)
  });
});

app.listen(4001, () => console.log("EU Node running on 4001"));
