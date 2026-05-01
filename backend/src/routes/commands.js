import { Router } from "express";
import { nanoid } from "nanoid";
import { db } from "../db/index.js";
import { enqueueCommand } from "../services/nanomdm.js";
import { toAppleRequestType } from "../providers/macos/commands.js";
import { canRunCommand } from "../services/capabilities.js";
import { writeAudit } from "../services/audit.js";
import { triggerPushForDevice } from "../services/apns.js";

const router = Router();

async function dispatch(req, res, commandType) {
  const deviceId = req.body?.device_id;
  if (!deviceId) {
    return res.status(400).json({ error: "device_id is required" });
  }

  const device = db.prepare("SELECT * FROM devices WHERE id = ?").get(deviceId);
  if (!device) {
    return res.status(404).json({ error: "Device not found" });
  }

  if (!canRunCommand(device.platform_type, commandType)) {
    return res.status(422).json({
      error: `Command ${commandType} is unsupported for platform ${device.platform_type}`
    });
  }

  const commandUUID = nanoid();
  const requestType = toAppleRequestType(commandType);
  await enqueueCommand({ udid: deviceId, requestType, commandUUID });

  db.prepare(
    `INSERT INTO commands (uuid, device_id, type, status)
     VALUES (?, ?, ?, 'pending')`
  ).run(commandUUID, deviceId, commandType);

  await triggerPushForDevice(deviceId);

  writeAudit({
    action: "command.dispatch",
    deviceId,
    performedBy: req.user.sub,
    detail: { type: commandType, uuid: commandUUID }
  });

  return res.status(202).json({ uuid: commandUUID, status: "pending" });
}

router.post("/lock", (req, res) => dispatch(req, res, "lock"));
router.post("/wipe", (req, res) => dispatch(req, res, "wipe"));
router.post("/restart", (req, res) => dispatch(req, res, "restart"));

router.get("/:device_id", (req, res) => {
  const rows = db
    .prepare(
      `SELECT uuid, type, status, created_at, completed_at
       FROM commands
       WHERE device_id = ?
       ORDER BY created_at DESC`
    )
    .all(req.params.device_id);
  return res.json(rows);
});

export default router;
