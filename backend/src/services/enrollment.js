import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import plist from "plist";
import { config } from "../config.js";

function uuid() {
  return crypto.randomUUID();
}

function makeScepPayload(scepUuid) {
  const scepUrl = config.SCEP_URL ?? `https://${config.DOMAIN}/scep`;
  const payload = {
    PayloadType: "com.apple.security.scep",
    PayloadVersion: 1,
    PayloadIdentifier: "com.pmdm.enrollment.scep",
    PayloadUUID: scepUuid,
    PayloadDisplayName: "PMDM Identity Certificate",
    URL: scepUrl,
    Name: "PMDM Device Identity",
    "Key Type": "RSA",
    Keysize: 2048,
    "Key Usage": 5,
    Subject: [[["CN", "$UDID"]]]
  };

  if (config.SCEP_CHALLENGE) {
    payload.Challenge = config.SCEP_CHALLENGE;
  }

  return payload;
}

function makeMdmPayload(identityCertificateUuid) {
  return {
    PayloadType: "com.apple.mdm",
    PayloadVersion: 1,
    PayloadIdentifier: "com.pmdm.mdm.enrollment",
    PayloadUUID: uuid(),
    PayloadDisplayName: "PMDM MDM",
    CheckInURL: `https://${config.DOMAIN}/mdm/checkin`,
    ServerURL: `https://${config.DOMAIN}/mdm/server`,
    Topic: config.APNS_TOPIC,
    IdentityCertificateUUID: identityCertificateUuid,
    SignMessage: true,
    AccessRights: 8191
  };
}

export function buildEnrollmentProfile() {
  const scepUuid = uuid();
  const payload = {
    PayloadType: "Configuration",
    PayloadVersion: 1,
    PayloadIdentifier: "com.pmdm.enrollment",
    PayloadUUID: uuid(),
    PayloadDisplayName: "PMDM Enrollment",
    PayloadDescription: "Automatically generated PMDM enrollment profile",
    PayloadRemovalDisallowed: false,
    PayloadContent: [makeScepPayload(scepUuid), makeMdmPayload(scepUuid)]
  };
  return Buffer.from(plist.build(payload), "utf8");
}

export function writeEnrollmentProfile() {
  const profileBytes = buildEnrollmentProfile();
  const outPath = config.ENROLLMENT_PROFILE_PATH;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, profileBytes);
  return { outPath, profileBytes };
}

export function readEnrollmentProfile() {
  const outPath = config.ENROLLMENT_PROFILE_PATH;
  if (!fs.existsSync(outPath)) {
    return writeEnrollmentProfile().profileBytes;
  }
  return fs.readFileSync(outPath);
}
