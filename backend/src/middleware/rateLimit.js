import { config } from "../config.js";

const hits = new Map();

export function basicRateLimit(req, res, next) {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const windowStart = now - config.RATE_LIMIT_WINDOW_MS;
  const timestamps = (hits.get(key) ?? []).filter((ts) => ts >= windowStart);
  timestamps.push(now);
  hits.set(key, timestamps);

  if (timestamps.length > config.RATE_LIMIT_MAX) {
    return res.status(429).json({ error: "Too many requests" });
  }

  return next();
}
