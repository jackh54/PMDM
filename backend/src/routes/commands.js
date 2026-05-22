import { Router } from "express";
import { db } from "../db/index.js";
import { enqueueAndPush } from "../services/nanomdm.js";
import { buildMacCommand, isSupportedMacCommand } from "../providers/macos/commands.js";
import { canRunCommand } from "../services/capabilities.js";
import { writeAudit } from "../services/audit.js";
import { config } from "../config.js";
import { newCommandUuid } from "../services/mdm-commands.js";

const router = Router();

async function dispatch(req, res, commandType, payload = {}) {
  if (commandType === "wipe" && !config.ALLOW_DEVICE_WIPE) {
    return res.status(403).json({
      error: "Device wipe is disabled. Set ALLOW_DEVICE_WIPE=true in environment to enable."
    });
  }

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

  let command;
  try {
    command = buildMacCommand(commandType, payload);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!command) {
    return res.status(422).json({ error: `Unsupported command: ${commandType}` });
  }

  const commandUUID = newCommandUuid();
  const result = await enqueueAndPush({ udid: deviceId, commandUUID, command });

  db.prepare(
    `INSERT INTO commands (uuid, device_id, type, status, ref_profile_id)
     VALUES (?, ?, ?, 'pending', ?)`
  ).run(commandUUID, deviceId, commandType, payload.refProfileId ?? null);

  writeAudit({
    action: "command.dispatch",
    deviceId,
    performedBy: req.user.sub,
    detail: { type: commandType, uuid: commandUUID }
  });

  return res.status(202).json({ uuid: commandUUID, status: "pending", nanomdm: result });
}

router.post("/lock", (req, res) => dispatch(req, res, "lock", { message: req.body?.message }));
router.post("/wipe", (req, res) => dispatch(req, res, "wipe"));
router.post("/restart", (req, res) => dispatch(req, res, "restart"));
router.post("/device-information", (req, res) =>
  dispatch(req, res, "device_information", { queries: req.body?.queries })
);
router.post("/profile-list", (req, res) => dispatch(req, res, "profile_list"));
router.post("/security-info", (req, res) => dispatch(req, res, "security_info"));
router.post("/installed-apps", (req, res) => dispatch(req, res, "installed_application_list"));
router.post("/clear-passcode", (req, res) =>
  dispatch(req, res, "clear_passcode", { unlockToken: req.body?.unlock_token })
);

router.post("/custom", (req, res) => {
  const { request_type: requestType, command } = req.body ?? {};
  if (!requestType) {
    return res.status(400).json({ error: "request_type is required" });
  }
  return dispatch(req, res, "custom", { requestType, command: command ?? {} });
});

router.get("/:device_id", (req, res) => {
  const rows = db
    .prepare(
      `SELECT uuid, type, status, created_at, completed_at, ref_profile_id
       FROM commands
       WHERE device_id = ?
       ORDER BY created_at DESC`
    )
    .all(req.params.device_id);
  return res.json(rows);
});

export default router;
