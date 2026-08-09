/**
 * Legacy FRC v2 entry — delegates to FRC7 gateway app when available.
 * Prefer: npm run start:gateway
 */
import { pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { createApp } = await import(
  pathToFileURL(resolve(__dirname, "../../apps/gateway/src/app.js")).href
);

const PORT = Number(process.env.PORT || 3000);
createApp().listen(PORT, () => {
  console.log(`FRC7 gateway (via frc-v2 shim) on :${PORT}`);
});
