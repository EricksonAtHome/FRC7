export function validateKey(key) {
  if (!key) return false;
  return key.startsWith("frc_live_");
}
