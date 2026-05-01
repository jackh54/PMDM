import { Router } from "express";
import { db } from "../db/index.js";
import { writeAudit } from "../services/audit.js";

const router = Router();

router.post("/", (req, res) => {
  const { type, udid, command_uuid: commandUuid, status, serial_number: serialNumber, model, os_version: osVersion, name } =
    req.body ?? {};

  if (type === "checkin" && udid) {
    db.prepare(
      `INSERT INTO devices (id, serial_number, model, os_version, enrolled_at, last_seen, name, status, platform_type)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, 'active', 'macos')
       ON CONFLICT(id) DO UPDATE SET
        serial_number = excluded.serial_number,
        model = excluded.model,
        os_version = excluded.os_version,
        name = excluded.name,
        last_seen = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP`
    ).run(udid, serialNumber ?? null, model ?? null, osVersion ?? null, name ?? null);
  }

  if (type === "command_ack" && commandUuid) {
    db.prepare("UPDATE commands SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE uuid = ?").run(
      status ?? "acknowledged",
      commandUuid
    );
  }

  writeAudit({
    action: `webhook.${type ?? "unknown"}`,
    deviceId: udid ?? null,
    performedBy: "nanomdm-webhook",
    detail: req.body ?? {}
  });

  return res.json({ ok: true });
});

export default router;
