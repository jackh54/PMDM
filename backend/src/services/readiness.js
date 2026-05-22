import fs from "node:fs";
import { config } from "../config.js";
import { getPushCertForTopic } from "./nanomdm.js";

function isReadable(path) {
  try {
    fs.accessSync(path, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export async function buildReadinessStatus() {
  const certReadable = isReadable(config.APNS_CERT_PATH);
  const keyReadable = isReadable(config.APNS_KEY_PATH);
  const filesPresent = certReadable && keyReadable;

  let apns = {
    configured: filesPresent,
    files_present: filesPresent,
    cert_readable: certReadable,
    key_readable: keyReadable,
    nanomdm_loaded: false,
    topic: config.APNS_TOPIC,
    cert_path: config.APNS_CERT_PATH,
    key_path: config.APNS_KEY_PATH,
    expires_at: null,
    hint: null
  };

  if (!keyReadable && fs.existsSync(config.APNS_KEY_PATH)) {
    apns.hint =
      "APNS key exists but is not readable by the backend container. Run: chmod 644 certs/apns/apns.key (or chown 1000:1000 certs/apns/*)";
  } else if (!certReadable) {
    apns.hint = `Place apns.pem and apns.key in certs/apns/ (expected ${config.APNS_CERT_PATH} in container).`;
  }

  if (certReadable) {
    try {
      const stat = fs.statSync(config.APNS_CERT_PATH);
      apns.expires_at = stat.mtime.toISOString();
    } catch {
      // ignore
    }
  }

  if (filesPresent) {
    try {
      await getPushCertForTopic(config.APNS_TOPIC);
      apns.nanomdm_loaded = true;
      apns.configured = true;
    } catch {
      apns.nanomdm_loaded = false;
      apns.configured = filesPresent;
      apns.hint =
        apns.hint ??
        "APNS files exist but NanoMDM has no matching push cert. Run ./scripts/nanomdm-bootstrap.sh and ensure APNS_TOPIC in .env matches the cert topic.";
    }
  }

  const scepUrl = config.SCEP_URL ?? `https://${config.DOMAIN}/scep`;
  const webhookUrl =
    config.NANOMDM_WEBHOOK_URL ?? `https://${config.DOMAIN}/api/webhook`;

  return {
    domain: config.DOMAIN,
    urls: {
      enrollment: `https://${config.DOMAIN}/enrollment.mobileconfig`,
      mdm: `https://${config.DOMAIN}/mdm`,
      scep: scepUrl,
      webhook: webhookUrl
    },
    apns,
    safety: { allow_device_wipe: config.ALLOW_DEVICE_WIPE }
  };
}
