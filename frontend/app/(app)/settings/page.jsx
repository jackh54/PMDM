"use client";

import AppShell from "@/components/app-shell";
import { getSettings, useApi } from "@/components/data-hooks";

export default function SettingsPage() {
  const { data, loading, error } = useApi(getSettings, []);

  return (
    <AppShell title="Settings">
      <div className="card">
        <h3>APNS Certificate Status</h3>
        {loading ? <div>Checking...</div> : null}
        {error ? <div>{error}</div> : null}
        {data?.apns ? (
          <div className="stack">
            <div>
              Configured:{" "}
              <span className={`status-pill ${data.apns.configured ? "active" : "warn"}`}>
                {data.apns.configured ? "Yes" : "No"}
              </span>
            </div>
            <div>Certificate file modified at: {data.apns.expires_at || "Unavailable"}</div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
