#!/usr/bin/env node
import { spawn } from "node:child_process";
process.env.FRC_DEFAULT_REGION ||= "ht";
process.env.PORT ||= "3000";
const child = spawn(process.execPath, ["apps/gateway/src/server.js"], { stdio: "inherit", env: process.env });
process.on("SIGINT", () => child.kill("SIGTERM"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
