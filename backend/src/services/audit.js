import { db } from "../db/index.js";

const insertAuditStmt = db.prepare(`
  INSERT INTO audit_log (action, device_id, performed_by, detail)
  VALUES (@action, @device_id, @performed_by, @detail)
`);

export function writeAudit({ action, deviceId = null, performedBy, detail = null }) {
  insertAuditStmt.run({
    action,
    device_id: deviceId,
    performed_by: performedBy,
    detail: detail ? JSON.stringify(detail) : null
  });
}
