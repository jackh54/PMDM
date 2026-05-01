"use client";

import Link from "next/link";
import AppShell from "@/components/app-shell";
import { getDevices, useApi } from "@/components/data-hooks";

export default function DevicesPage() {
  const { data, loading, error } = useApi(getDevices, []);
  const devices = Array.isArray(data) ? data : [];

  return (
    <AppShell title="Devices">
      <div className="card">
        {error ? <div style={{ marginBottom: 10 }}>{error}</div> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Serial</th>
                <th>Model</th>
                <th>OS</th>
                <th>Status</th>
                <th>Group</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>Loading...</td>
                </tr>
              ) : null}
              {devices.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link href={`/devices/${d.id}`}>{d.name || d.id}</Link>
                  </td>
                  <td>{d.serial_number || "-"}</td>
                  <td>{d.model || "-"}</td>
                  <td>{d.os_version || "-"}</td>
                  <td>
                    <span className={`status-pill ${d.status === "active" ? "active" : "warn"}`}>{d.status}</span>
                  </td>
                  <td>{d.group_name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
