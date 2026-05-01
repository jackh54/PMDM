import { Router } from "express";
import { db } from "../db/index.js";
import { writeAudit } from "../services/audit.js";

const router = Router();

router.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM groups ORDER BY name ASC").all();
  return res.json(rows);
});

router.post("/", (req, res) => {
  const { name, description = "" } = req.body ?? {};
  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }
  const result = db.prepare("INSERT INTO groups (name, description) VALUES (?, ?)").run(name, description);
  writeAudit({
    action: "group.create",
    performedBy: req.user.sub,
    detail: { groupId: result.lastInsertRowid, name }
  });
  return res.status(201).json({ id: result.lastInsertRowid });
});

router.post("/:id/devices", (req, res) => {
  const deviceId = req.body?.device_id;
  if (!deviceId) {
    return res.status(400).json({ error: "device_id is required" });
  }
  const result = db.prepare("UPDATE devices SET group_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
    Number(req.params.id),
    deviceId
  );
  if (result.changes === 0) {
    return res.status(404).json({ error: "Device not found" });
  }
  writeAudit({
    action: "group.add_device",
    deviceId,
    performedBy: req.user.sub,
    detail: { groupId: Number(req.params.id) }
  });
  return res.status(200).json({ ok: true });
});

export default router;
