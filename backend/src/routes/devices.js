import { Router } from "express";
import { db } from "../db/index.js";
import { writeAudit } from "../services/audit.js";

const router = Router();

router.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT d.*, g.name AS group_name
       FROM devices d
       LEFT JOIN groups g ON d.group_id = g.id
       ORDER BY d.last_seen DESC NULLS LAST, d.created_at DESC`
    )
    .all();
  return res.json(rows);
});

router.get("/:id", (req, res) => {
  const device = db.prepare("SELECT * FROM devices WHERE id = ?").get(req.params.id);
  if (!device) {
    return res.status(404).json({ error: "Device not found" });
  }

  const profiles = db
    .prepare(
      `SELECT p.id, p.name, p.description, p.created_at, dp.installed_at
       FROM device_profiles dp
       JOIN profiles p ON p.id = dp.profile_id
       WHERE dp.device_id = ?`
    )
    .all(req.params.id);

  return res.json({ ...device, profiles });
});

router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM devices WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Device not found" });
  }

  writeAudit({
    action: "device.unenroll",
    deviceId: req.params.id,
    performedBy: req.user.sub
  });
  return res.status(204).send();
});

export default router;
