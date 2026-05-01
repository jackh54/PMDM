import { db } from "../db/index.js";

let insertAuditStmt = null;

function getInsertAuditStmt() {
  if (!insertAuditStmt) {
    insertAuditStmt = db.prepare(`
      INSERT INTO audit_log (action, device_id, performed_by, detail)
      VALUES (@action, @device_id, @performed_by, @detail)
    `);
  }
  return insertAuditStmt;
}

export function writeAudit({ action, deviceId = null, performedBy, detail = null }) {
  getInsertAuditStmt().run({
    action,
    device_id: deviceId,
    performed_by: performedBy,
    detail: detail ? JSON.stringify(detail) : null
  });
}
