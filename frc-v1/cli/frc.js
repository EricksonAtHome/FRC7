#!/usr/bin/env node

import fs from "fs";
import fetch from "node-fetch";

const file = process.argv[2];
const script = fs.readFileSync(file, "utf8");

// simple parser
let model = null;
let input = null;

script.split("\n").forEach(line => {
  if (line.includes("use model")) {
    model = line.split(" ")[2];
  }
  if (line.includes("input")) {
    input = line.match(/"(.+?)"/)?.[1];
  }
});

const run = async () => {
  const res = await fetch(`http://localhost:3000/run/${model}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input })
  });

  const data = await res.json();
  console.log("FRC RESULT:", data);
};

run();
