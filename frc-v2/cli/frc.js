#!/usr/bin/env node

import fs from "fs";
import fetch from "node-fetch";

const file = process.argv[2];
const script = fs.readFileSync(file, "utf8");

const model = script.match(/use model (.+)/)?.[1];
const input = script.match(/input "(.+?)"/)?.[1];

const run = async () => {
  const res = await fetch(`http://localhost:3000/run/${model}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "frc_test_key"
    },
    body: JSON.stringify({ input })
  });

  console.log("✅ API GATEWAY RESPONSE:");
  console.log(await res.json());
};

run();
