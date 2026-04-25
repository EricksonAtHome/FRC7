export function getRegion(ip) {
  if (ip.startsWith("1.")) return "EU";
  if (ip.startsWith("2.")) return "US";
  return "ASIA";
}

export function getClusterUrl(region) {
  if (region === "US") return "http://us-cluster/run";
  if (region === "ASIA") return "http://asia-cluster/run";
  return "http://eu-cluster/run";
}
