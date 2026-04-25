#!/usr/bin/env node

import { runFRCL } from "./src/index.js";
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);

if (args.length === 0) {
    console.log("Usage: frc <script.frcl> or frc \"script content\"");
    process.exit(1);
}

let script = args[0];

// If it's a file path, read it
if (fs.existsSync(script)) {
    script = fs.readFileSync(path.resolve(script), 'utf8');
}

runFRCL(script).catch(err => {
    console.error("FRCL Error:", err);
    process.exit(1);
});
