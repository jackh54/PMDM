"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/app-shell";
import { api } from "@/lib/api";
import { getDevice, getProfiles, useApi } from "@/components/data-hooks";

export default function DeviceDetailPage() {
  const { id } = useParams();
  const { data: device, loading, error, setData: setDevice } = useApi(() => getDevice(id), [id]);
  const { data: profilesData } = useApi(getProfiles, []);
  const profiles = Array.isArray(profilesData) ? profilesData : [];
  const { data: settingsData } = useApi(async () => {
    const { data } = await api.get("/settings/status");
    return data;
  }, []);
  const { data: historyData, setData: setHistory } = useApi(async () => {
    const { data } = await api.get(`/commands/${id}`);
    return data;
  }, [id]);
  const history = Array.isArray(historyData) ? historyData : [];
  const allowWipe = Boolean(settingsData?.safety?.allow_device_wipe);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [customRequestType, setCustomRequestType] = useState("Settings");
  const [message, setMessage] = useState("");

  async function refresh() {
    const { data: deviceData } = await api.get(`/devices/${id}`);
    setDevice(deviceData);
    const { data: commandData } = await api.get(`/commands/${id}`);
    setHistory(commandData);
  }

  async function runAction(path, body = { device_id: id }) {
    setMessage("");
    await api.post(`/commands/${path}`, body);
    await refresh();
    setMessage(`Command ${path} queued.`);
  }

  async function assignProfile() {
    if (!selectedProfileId) {
      return;
    }
    setMessage("");
    await api.post(`/profiles/${selectedProfileId}/assign`, { device_id: id, push: true });
    await refresh();
    setMessage("Profile install queued on device.");
  }

  async function removeProfile(profileId) {
    setMessage("");
    await api.post(`/profiles/${profileId}/unassign`, { device_id: id, remove_from_device: true });
    await refresh();
    setMessage("Profile removal queued.");
  }

  async function runCustomCommand() {
    setMessage("");
    await api.post("/commands/custom", {
      device_id: id,
      request_type: customRequestType,
      command: {}
    });
    await refresh();
    setMessage(`Custom ${customRequestType} command queued.`);
  }

  return (
    <AppShell title="Device Control">
      {loading ? <div className="card">Loading...</div> : null}
      {error ? <div className="card">{error}</div> : null}
      {message ? <div className="card subtle">{message}</div> : null}
      {device ? (
        <div className="stack">
          <div className="card">
            <h3>{device.name || device.id}</h3>
            <div className="subtle">
              {device.model || "-"} · {device.os_version || "-"} · {device.serial_number || "-"}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <button className="btn" type="button" onClick={() => runAction("lock")}>
                Lock
              </button>
              <button className="btn" type="button" onClick={() => runAction("restart")}>
                Restart
              </button>
              <button className="btn" type="button" onClick={() => runAction("device-information")}>
                Sync inventory
              </button>
              <button className="btn" type="button" onClick={() => runAction("profile-list")}>
                List device profiles
              </button>
              <button className="btn" type="button" onClick={() => runAction("security-info")}>
                Security info
              </button>
              <button className="btn" type="button" onClick={() => runAction("installed-apps")}>
                Installed apps
              </button>
              {allowWipe ? (
                <button className="btn danger" type="button" onClick={() => runAction("wipe")}>
                  Wipe
                </button>
              ) : null}
            </div>
          </div>

          <div className="card form-grid">
            <h3>Assign configuration profile</h3>
            <div>
              <label>Profile</label>
              <select value={selectedProfileId} onChange={(e) => setSelectedProfileId(e.target.value)}>
                <option value="">Select profile...</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.profile_type || p.payload_type})
                  </option>
                ))}
              </select>
            </div>
            <button className="btn primary" type="button" onClick={assignProfile} disabled={!selectedProfileId}>
              Push profile to device
            </button>
          </div>

          <div className="card form-grid">
            <h3>Custom MDM command</h3>
            <p className="subtle">
              Send any Apple MDM RequestType (e.g. Settings, EnableRemoteDesktop, DisableRemoteDesktop).
            </p>
            <div>
              <label>Request type</label>
              <input value={customRequestType} onChange={(e) => setCustomRequestType(e.target.value)} />
            </div>
            <button className="btn" type="button" onClick={runCustomCommand}>
              Queue custom command
            </button>
          </div>

          {device.inventory ? (
            <div className="card">
              <h3>Inventory</h3>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
                {JSON.stringify(device.inventory, null, 2)}
              </pre>
            </div>
          ) : null}

          <div className="card">
            <h3>Assigned profiles</h3>
            <ul>
              {(device.profiles || []).map((p) => (
                <li key={p.id} style={{ marginBottom: 8 }}>
                  {p.name} — <span className="status-pill">{p.status || "unknown"}</span>
                  {p.installed_at ? ` · installed ${p.installed_at}` : null}
                  <button
                    className="btn danger"
                    type="button"
                    style={{ marginLeft: 8 }}
                    onClick={() => removeProfile(p.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3>Command history</h3>
            <ul>
              {history.map((h) => (
                <li key={h.uuid}>
                  {h.type} — {h.status}
                  {h.ref_profile_id ? ` (profile #${h.ref_profile_id})` : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
