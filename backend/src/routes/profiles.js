import { Router } from "express";
import { db } from "../db/index.js";
import {
  buildMobileConfig,
  validateProfileDefinition,
  PROFILE_TYPE_SCHEMAS
} from "../services/profiles.js";
import { parseMobileConfigIdentifier } from "../services/mdm-commands.js";
import {
  installProfileOnDevice,
  removeProfileFromDevice,
  pushGroupProfilesToMembers
} from "../services/profile-delivery.js";
import { writeAudit } from "../services/audit.js";

const router = Router();

router.get("/schemas", (_req, res) => {
  return res.json(PROFILE_TYPE_SCHEMAS);
});

router.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT id, name, description, profile_type, payload_type, payload_identifier,
              min_os_version, created_at
       FROM profiles
       ORDER BY id DESC`
    )
    .all();
  return res.json(rows);
});

router.get("/:id", (req, res) => {
  const row = db
    .prepare(
      `SELECT id, name, description, profile_type, payload_type, payload_identifier,
              min_os_version, values_json, created_at
       FROM profiles
       WHERE id = ?`
    )
    .get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: "Profile not found" });
  }
  return res.json({
    ...row,
    values: row.values_json ? JSON.parse(row.values_json) : {}
  });
});

router.post("/", (req, res) => {
  try {
    validateProfileDefinition(req.body);
    const payload = buildMobileConfig(req.body);
    const payloadIdentifier = parseMobileConfigIdentifier(payload);
    const insert = db.prepare(
      `INSERT INTO profiles (
         name, description, payload, payload_type, profile_type,
         payload_identifier, min_os_version, values_json
       ) VALUES (
         @name, @description, @payload, @payload_type, @profile_type,
         @payload_identifier, @min_os_version, @values_json
       )`
    );
    const result = insert.run({
      name: req.body.name,
      description: req.body.description ?? "",
      payload,
      payload_type: "macos",
      profile_type: req.body.profileType,
      payload_identifier: payloadIdentifier,
      min_os_version: req.body.minOsVersion ?? "10.13",
      values_json: JSON.stringify(req.body.values ?? {})
    });

    writeAudit({
      action: "profile.create",
      performedBy: req.user.sub,
      detail: { profileId: result.lastInsertRowid, name: req.body.name }
    });

    return res.status(201).json({ id: result.lastInsertRowid, payloadIdentifier });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM profiles WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Profile not found" });
  }

  writeAudit({
    action: "profile.delete",
    performedBy: req.user.sub,
    detail: { profileId: Number(req.params.id) }
  });

  return res.status(204).send();
});

router.post("/:id/assign", async (req, res) => {
  const profileId = Number(req.params.id);
  const { device_id: deviceId, group_id: groupId, push = true } = req.body ?? {};
  if (!deviceId && !groupId) {
    return res.status(400).json({ error: "device_id or group_id required" });
  }

  try {
    const deliveries = [];
    if (deviceId && push) {
      deliveries.push(await installProfileOnDevice(deviceId, profileId));
    } else if (deviceId) {
      db.prepare(
        `INSERT INTO device_profiles (device_id, profile_id, status)
         VALUES (?, ?, 'assigned')
         ON CONFLICT(device_id, profile_id) DO UPDATE SET status = 'assigned'`
      ).run(deviceId, profileId);
    }

    if (groupId) {
      db.prepare(
        `INSERT INTO group_profiles (group_id, profile_id, assigned_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(group_id, profile_id) DO UPDATE SET assigned_at = excluded.assigned_at`
      ).run(groupId, profileId);

      if (push) {
        deliveries.push(...(await pushGroupProfilesToMembers(groupId)));
      }
    }

    writeAudit({
      action: "profile.assign",
      deviceId: deviceId ?? null,
      performedBy: req.user.sub,
      detail: { profileId, groupId: groupId ?? null, deliveries }
    });

    return res.status(202).json({ ok: true, deliveries });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.post("/:id/unassign", async (req, res) => {
  const profileId = Number(req.params.id);
  const { device_id: deviceId, remove_from_device: removeFromDevice = true } = req.body ?? {};
  if (!deviceId) {
    return res.status(400).json({ error: "device_id is required" });
  }

  try {
    let delivery = null;
    if (removeFromDevice) {
      delivery = await removeProfileFromDevice(deviceId, profileId);
    } else {
      db.prepare("DELETE FROM device_profiles WHERE device_id = ? AND profile_id = ?").run(
        deviceId,
        profileId
      );
    }

    writeAudit({
      action: "profile.unassign",
      deviceId,
      performedBy: req.user.sub,
      detail: { profileId, delivery }
    });

    return res.status(202).json({ ok: true, delivery });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
