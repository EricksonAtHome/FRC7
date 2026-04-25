import express from "express";
import { execute } from "../shared/engine.js";

const app = express();
app.use(express.json());

app.post("/run", (req, res) => {
  res.json({
    region: "US",
    ...execute(req.body.code)
  });
});

app.listen(4002, () => {
  console.log("US Node running on 4002");
});
