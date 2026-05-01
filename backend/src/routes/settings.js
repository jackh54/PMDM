import fs from "node:fs";
import { Router } from "express";
import { config } from "../config.js";

const router = Router();

router.get("/status", (_req, res) => {
  let apns = { configured: false, expires_at: null };
  try {
    const stat = fs.statSync(config.APNS_CERT_PATH);
    apns = { configured: true, expires_at: stat.mtime.toISOString() };
  } catch {
    apns = { configured: false, expires_at: null };
  }
  res.json({ apns, safety: { allow_device_wipe: config.ALLOW_DEVICE_WIPE } });
});

export default router;
