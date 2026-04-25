#!/usr/bin/env node

import fs from "fs";
import { runFRCL } from "../worker/engine.js";

const command = process.argv[2];
const arg = process.argv[3];

if (command === "run" && arg) {
    console.log(`🚀 Executing FRCL Script: ${arg}`);
    const script = fs.readFileSync(arg, "utf8");
    
    runFRCL(script).then(res => {
      console.log("\n✅ FRC RESULT:");
      console.log(JSON.stringify(res, null, 2));
    }).catch(err => {
      console.error("❌ FRC ERROR:", err.message);
    });
} else {
    console.log("Usage: frc run <file.frcl>");
}
