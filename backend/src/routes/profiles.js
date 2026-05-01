import { Router } from "express";
import { db } from "../db/index.js";
import { buildMobileConfig, validateProfileDefinition } from "../services/profiles.js";
import { writeAudit } from "../services/audit.js";

const router = Router();

router.get("/", (_req, res) => {
  const rows = db.prepare("SELECT id, name, description, payload_type, min_os_version, created_at FROM profiles ORDER BY id DESC").all();
  return res.json(rows);
});

router.post("/", (req, res) => {
  try {
    validateProfileDefinition(req.body);
    const payload = buildMobileConfig(req.body);
    const insert = db.prepare(
      `INSERT INTO profiles (name, description, payload, payload_type, min_os_version)
       VALUES (@name, @description, @payload, @payload_type, @min_os_version)`
    );
    const result = insert.run({
      name: req.body.name,
      description: req.body.description ?? "",
      payload,
      payload_type: "macos",
      min_os_version: req.body.minOsVersion ?? "10.13"
    });

    writeAudit({
      action: "profile.create",
      performedBy: req.user.sub,
      detail: { profileId: result.lastInsertRowid, name: req.body.name }
    });

    return res.status(201).json({ id: result.lastInsertRowid });
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

router.post("/:id/assign", (req, res) => {
  const { device_id: deviceId, group_id: groupId } = req.body ?? {};
  if (!deviceId && !groupId) {
    return res.status(400).json({ error: "device_id or group_id required" });
  }

  if (deviceId) {
    db.prepare(
      `INSERT INTO device_profiles (device_id, profile_id, installed_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(device_id, profile_id) DO UPDATE SET installed_at = excluded.installed_at`
    ).run(deviceId, Number(req.params.id));
  }

  if (groupId) {
    db.prepare(
      `INSERT INTO group_profiles (group_id, profile_id, assigned_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(group_id, profile_id) DO UPDATE SET assigned_at = excluded.assigned_at`
    ).run(groupId, Number(req.params.id));
  }

  writeAudit({
    action: "profile.assign",
    deviceId: deviceId ?? null,
    performedBy: req.user.sub,
    detail: { profileId: Number(req.params.id), groupId: groupId ?? null }
  });

  return res.status(200).json({ ok: true });
});

export default router;
