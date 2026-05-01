"use client";

import AppShell from "@/components/app-shell";
import { getSettings, useApi } from "@/components/data-hooks";

export default function EnrollmentPage() {
  const { data } = useApi(getSettings, []);
  const domain = process.env.NEXT_PUBLIC_MDM_DOMAIN || "mdm.example.com";

  return (
    <AppShell title="Enrollment Ops">
      <div className="stack">
        <div className="card">
          <h3>Readiness Checklist</h3>
          <ul>
            <li>Public DNS points {domain} to your VPS.</li>
            <li>Valid TLS is active and trusted by macOS clients.</li>
            <li>
              APNS certificate status:{" "}
              <span className={`status-pill ${data?.apns?.configured ? "active" : "warn"}`}>
                {data?.apns?.configured ? "Configured" : "Not configured"}
              </span>
            </li>
            <li>`/mdm/checkin` and `/mdm/server` routes proxy to NanoMDM.</li>
          </ul>
        </div>
        <div className="card">
          <h3>Enrollment URLs</h3>
          <div className="form-grid">
            <div>
              <label>Profile URL</label>
              <input readOnly value={`https://${domain}/enrollment.mobileconfig`} />
            </div>
            <div>
              <label>CheckIn URL</label>
              <input readOnly value={`https://${domain}/mdm/checkin`} />
            </div>
            <div>
              <label>Server URL</label>
              <input readOnly value={`https://${domain}/mdm/server`} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <a className="btn primary" href={`https://${domain}/enrollment.mobileconfig`}>
              Download Enrollment Profile
            </a>
          </div>
        </div>
        <div className="card">
          <h3>Manual Enrollment Steps (Mac)</h3>
          <ol>
            <li>Download `enrollment.mobileconfig` from the profile URL.</li>
            <li>Install profile on the target Mac with local admin approval.</li>
            <li>Approve MDM enrollment prompt and trust profile.</li>
            <li>Verify device appears in Devices list with status `active`.</li>
          </ol>
        </div>
      </div>
    </AppShell>
  );
}
