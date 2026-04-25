const validKeys = ["frc_test_key"];

export function authMiddleware(req, res, next) {
  const key = req.headers["x-api-key"];

  if (!key || !validKeys.includes(key)) {
    return res.status(401).json({ error: "Unauthorized: Invalid or missing API key." });
  }

  req.apiKey = key;
  next();
}
