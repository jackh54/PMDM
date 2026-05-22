"use client";

import AppShell from "@/components/app-shell";
import { getEnrollmentStatus, useApi } from "@/components/data-hooks";

export default function EnrollmentPage() {
  const { data, loading, error } = useApi(getEnrollmentStatus, []);

  const domain = data?.domain ?? "…";
  const enrollmentUrl = data?.urls?.enrollment ?? `https://${domain}/enrollment.mobileconfig`;
  const mdmUrl = data?.urls?.mdm ?? `https://${domain}/mdm`;
  const webhookUrl = data?.urls?.webhook ?? `https://${domain}/api/webhook`;

  const apnsReady = Boolean(data?.apns?.nanomdm_loaded);
  const apnsFiles = Boolean(data?.apns?.files_present);

  return (
    <AppShell title="Enrollment Ops">
      <div className="stack">
        {error ? (
          <div className="card">
            Could not load server status: {error}. Rebuild backend:{" "}
            <code>docker compose up -d --build backend frontend</code>
          </div>
        ) : null}
        <div className="card">
          <h3>Readiness Checklist</h3>
          {loading ? <p className="subtle">Loading server config…</p> : null}
          {data?.apns?.hint ? <p className="subtle">{data.apns.hint}</p> : null}
          <ul>
            <li>
              Public DNS points <strong>{domain}</strong> to your VPS.
            </li>
            <li>Valid TLS is active and trusted by macOS clients.</li>
            <li>
              APNS cert files on disk:{" "}
              <span className={`status-pill ${apnsFiles ? "active" : "warn"}`}>
                {apnsFiles ? "Present" : "Missing"}
              </span>
            </li>
            <li>
              APNS loaded in NanoMDM:{" "}
              <span className={`status-pill ${apnsReady ? "active" : "warn"}`}>
                {apnsReady ? "Ready" : "Run ./scripts/nanomdm-bootstrap.sh"}
              </span>
              {data?.apns?.topic ? (
                <span className="subtle" style={{ display: "block", marginTop: 4 }}>
                  Topic: {data.apns.topic}
                </span>
              ) : null}
            </li>
            <li>
              Webhook URL: <code>{webhookUrl}</code>
            </li>
            <li>
              <code>/mdm</code> must proxy to NanoMDM at <code>{mdmUrl}</code>
            </li>
            <li>After enroll: assign profiles from Profiles or Device detail to push policies.</li>
          </ul>
        </div>
        <div className="card">
          <h3>Enrollment URLs</h3>
          <div className="form-grid">
            <div>
              <label>Profile URL</label>
              <input readOnly value={enrollmentUrl} />
            </div>
            <div>
              <label>MDM Server URL</label>
              <input readOnly value={mdmUrl} />
            </div>
            <div>
              <label>SCEP URL</label>
              <input readOnly value={data?.urls?.scep ?? ""} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <a className="btn primary" href={enrollmentUrl}>
              Download Enrollment Profile
            </a>
          </div>
        </div>
        <div className="card">
          <h3>Manual Enrollment Steps (Mac)</h3>
          <ol>
            <li>Download the enrollment profile from the link above.</li>
            <li>Install it on the Mac (System Settings → Profiles).</li>
            <li>Approve the MDM enrollment prompt.</li>
            <li>Confirm the device appears under Devices with status active.</li>
          </ol>
        </div>
      </div>
    </AppShell>
  );
}
