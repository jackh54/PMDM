"use client";

import AppShell from "@/components/app-shell";
import { getDevices, useApi } from "@/components/data-hooks";

export default function DashboardPage() {
  const { data, loading, error } = useApi(getDevices, []);
  const devices = Array.isArray(data) ? data : [];

  const online = devices.filter((d) => d.status === "active").length;
  const offline = devices.length - online;
  const enrolledRecently = devices.slice(0, 5);

  return (
    <AppShell title="Dashboard">
      {error ? <div className="card">{error}</div> : null}
      <div className="grid">
        <div className="card">
          <h3>Total Devices</h3>
          <div style={{ fontSize: 30, fontWeight: 700 }}>{loading ? "-" : devices.length}</div>
        </div>
        <div className="card">
          <h3>Online</h3>
          <div style={{ fontSize: 30, fontWeight: 700, color: "var(--success)" }}>{loading ? "-" : online}</div>
        </div>
        <div className="card">
          <h3>Offline</h3>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#ffcd7d" }}>{loading ? "-" : offline}</div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h3>Recently Seen Devices</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Model</th>
                <th>OS</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {enrolledRecently.map((device) => (
                <tr key={device.id}>
                  <td>{device.name || device.id}</td>
                  <td>{device.model || "-"}</td>
                  <td>{device.os_version || "-"}</td>
                  <td>{device.last_seen || "-"}</td>
                </tr>
              ))}
              {enrolledRecently.length === 0 ? (
                <tr>
                  <td colSpan={4}>No devices yet. Go to Enrollment for setup steps.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
