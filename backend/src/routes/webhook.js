import { Router } from "express";
import plist from "plist";
import { db } from "../db/index.js";
import { writeAudit } from "../services/audit.js";

const router = Router();

function decodeRawPayload(rawPayload) {
  if (!rawPayload) {
    return null;
  }
  const buffer = Buffer.from(rawPayload, "base64");
  return plist.parse(buffer);
}

function enrollmentIdFromEvent(event) {
  return (
    event?.checkin_event?.ids?.id ??
    event?.acknowledge_event?.ids?.id ??
    event?.checkin_event?.udid ??
    event?.acknowledge_event?.udid ??
    null
  );
}

function upsertDeviceFromPlist(udid, parsed) {
  if (!udid) {
    return;
  }

  db.prepare(
    `INSERT INTO devices (id, serial_number, model, os_version, enrolled_at, last_seen, name, status, platform_type)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, 'active', 'macos')
     ON CONFLICT(id) DO UPDATE SET
      serial_number = COALESCE(excluded.serial_number, devices.serial_number),
      model = COALESCE(excluded.model, devices.model),
      os_version = COALESCE(excluded.os_version, devices.os_version),
      name = COALESCE(excluded.name, devices.name),
      last_seen = CURRENT_TIMESTAMP,
      status = 'active',
      updated_at = CURRENT_TIMESTAMP`
  ).run(
    udid,
    parsed?.SerialNumber ?? null,
    parsed?.ProductName ?? parsed?.ModelName ?? null,
    parsed?.OSVersion ?? null,
    parsed?.DeviceName ?? null
  );
}

function handleCheckin(topic, event) {
  const udid = enrollmentIdFromEvent(event);
  const parsed = decodeRawPayload(event?.checkin_event?.raw_payload);
  if (parsed) {
    upsertDeviceFromPlist(udid ?? parsed?.UDID, parsed);
  }
  writeAudit({
    action: `webhook.${topic}`,
    deviceId: udid,
    performedBy: "nanomdm-webhook",
    detail: { topic }
  });
}

function handleAcknowledge(event) {
  const udid = enrollmentIdFromEvent(event);
  const commandUuid = event?.acknowledge_event?.command_uuid;
  const status = event?.acknowledge_event?.status ?? "Acknowledged";
  const parsed = decodeRawPayload(event?.acknowledge_event?.raw_payload);

  if (commandUuid) {
    const normalized =
      status === "Acknowledged" || status === "NotNow" ? status.toLowerCase() : "error";
    db.prepare(
      "UPDATE commands SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE uuid = ?"
    ).run(normalized, commandUuid);

    const command = db.prepare("SELECT * FROM commands WHERE uuid = ?").get(commandUuid);
    if (command?.type === "install_profile" && command.ref_profile_id && normalized === "acknowledged") {
      db.prepare(
        `UPDATE device_profiles
         SET status = 'installed', installed_at = CURRENT_TIMESTAMP
         WHERE device_id = ? AND profile_id = ?`
      ).run(command.device_id, command.ref_profile_id);
    }
    if (command?.type === "remove_profile" && normalized === "acknowledged" && command.ref_profile_id) {
      db.prepare("DELETE FROM device_profiles WHERE device_id = ? AND profile_id = ?").run(
        command.device_id,
        command.ref_profile_id
      );
    }
  }

  if (parsed?.QueryResponses && udid) {
    db.prepare(
      `INSERT INTO device_inventory (device_id, payload_json, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(device_id) DO UPDATE SET
         payload_json = excluded.payload_json,
         updated_at = CURRENT_TIMESTAMP`
    ).run(udid, JSON.stringify(parsed.QueryResponses));
  }

  writeAudit({
    action: "webhook.mdm.Connect",
    deviceId: udid,
    performedBy: "nanomdm-webhook",
    detail: { commandUuid, status }
  });
}

router.post("/", (req, res) => {
  const event = req.body ?? {};
  const topic = event.topic;

  if (event.checkin_event && topic?.startsWith("mdm.")) {
    handleCheckin(topic, event);
  }

  if (event.acknowledge_event || topic === "mdm.Connect") {
    handleAcknowledge(event);
  }

  // Legacy/simple webhook format from early PMDM builds.
  const { type, udid, command_uuid: commandUuid, status, serial_number: serialNumber, model, os_version: osVersion, name } =
    event;
  if (type === "checkin" && udid) {
    upsertDeviceFromPlist(udid, {
      SerialNumber: serialNumber,
      ProductName: model,
      OSVersion: osVersion,
      DeviceName: name
    });
  }
  if (type === "command_ack" && commandUuid) {
    db.prepare("UPDATE commands SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE uuid = ?").run(
      status ?? "acknowledged",
      commandUuid
    );
  }

  return res.json({ ok: true });
});

export default router;
