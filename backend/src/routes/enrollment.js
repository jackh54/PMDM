import { Router } from "express";
import { readEnrollmentProfile, writeEnrollmentProfile } from "../services/enrollment.js";
import { writeAudit } from "../services/audit.js";

const router = Router();

router.get("/mobileconfig", (_req, res) => {
  const bytes = readEnrollmentProfile();
  res.setHeader("Content-Type", "application/x-apple-aspen-config");
  res.setHeader("Content-Disposition", 'attachment; filename="enrollment.mobileconfig"');
  res.send(bytes);
});

router.post("/regenerate", (req, res) => {
  const result = writeEnrollmentProfile();
  writeAudit({
    action: "enrollment.regenerate",
    performedBy: req.user?.sub ?? "system",
    detail: { path: result.outPath }
  });
  res.json({ ok: true, path: result.outPath });
});

export default router;
