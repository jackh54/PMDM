import fs from "node:fs";
import { Router } from "express";
import { config } from "../config.js";
import { getPushCertForTopic } from "../services/nanomdm.js";

const router = Router();

function apnsFilesOnDisk() {
  try {
    fs.accessSync(config.APNS_CERT_PATH, fs.constants.R_OK);
    fs.accessSync(config.APNS_KEY_PATH, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

router.get("/status", async (_req, res) => {
  const filesPresent = apnsFilesOnDisk();
  let apns = {
    configured: filesPresent,
    files_present: filesPresent,
    nanomdm_loaded: false,
    topic: config.APNS_TOPIC,
    cert_path: config.APNS_CERT_PATH,
    expires_at: null
  };

  if (filesPresent) {
    try {
      const stat = fs.statSync(config.APNS_CERT_PATH);
      apns.expires_at = stat.mtime.toISOString();
    } catch {
      // ignore
    }
  }

  try {
    await getPushCertForTopic(config.APNS_TOPIC);
    apns.nanomdm_loaded = true;
    apns.configured = true;
  } catch {
    apns.nanomdm_loaded = false;
    apns.configured = filesPresent;
  }

  const scepUrl = config.SCEP_URL ?? `https://${config.DOMAIN}/scep`;
  const webhookUrl =
    config.NANOMDM_WEBHOOK_URL ?? `https://${config.DOMAIN}/api/webhook`;

  res.json({
    domain: config.DOMAIN,
    urls: {
      enrollment: `https://${config.DOMAIN}/enrollment.mobileconfig`,
      mdm: `https://${config.DOMAIN}/mdm`,
      scep: scepUrl,
      webhook: webhookUrl
    },
    apns,
    safety: { allow_device_wipe: config.ALLOW_DEVICE_WIPE }
  });
});

export default router;
