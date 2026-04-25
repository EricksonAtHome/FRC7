import { createClient } from "redis";
import crypto from "crypto";

const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', err => console.log('Redis Client Error', err));

let isConnected = false;

async function ensureConnection() {
    if (!isConnected) {
        await client.connect();
        isConnected = true;
    }
}

export async function addJob(data) {
  await ensureConnection();
  const id = crypto.randomUUID();

  await client.lPush("frc_jobs", JSON.stringify({
    id,
    ...data
  }));

  return { id };
}

export async function getJob() {
  await ensureConnection();
  const job = await client.rPop("frc_jobs");
  return job ? JSON.parse(job) : null;
}
