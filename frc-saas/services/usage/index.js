const usageDB = new Map();

export function track(apiKey) {
  const current = usageDB.get(apiKey) || 0;
  usageDB.set(apiKey, current + 1);
  console.log(`[Usage Tracker] API Key ${apiKey} has used ${current + 1} requests`);
}
