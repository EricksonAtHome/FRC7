import { createApp } from "./app.js";

const PORT = Number(process.env.PORT || 3000);
createApp().listen(PORT, () => {
  console.log(`FRC7 Gateway v7.1 on :${PORT}`);
  console.log("  GET  /health  /v1/models  /v1/metrics");
  console.log("  POST /v1/run/:model  /v1/execute  /v1/batch  /v1/lint");
});
