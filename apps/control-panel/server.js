import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "@frc/gateway/app";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "public");
const PORT = Number(process.env.PORT || 8787);
const api = createApp();

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

function resolvePublic(urlPath) {
  const raw = decodeURIComponent((urlPath || "/").split("?")[0]);
  const relative = normalize(raw).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]+/, "");
  if (!relative || relative.includes("..")) return null;
  const file = join(publicDir, relative);
  if (!file.startsWith(publicDir + "/") && file !== publicDir) return null;
  return file;
}

createServer((req, res) => {
  if (req.url?.startsWith("/v1/") || req.url === "/health" || req.url?.startsWith("/run/")) {
    api(req, res); return;
  }
  const file = resolvePublic(req.url === "/" ? "index.html" : req.url);
  if (!file || !existsSync(file)) { res.writeHead(404).end("Not found"); return; }
  res.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(PORT, () => console.log(`FRC7 Control Panel → http://127.0.0.1:${PORT}`));
