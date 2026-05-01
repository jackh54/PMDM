"use client";

import { useParams } from "next/navigation";
import AppShell from "@/components/app-shell";
import { api } from "@/lib/api";
import { getDevice, useApi } from "@/components/data-hooks";

export default function DeviceDetailPage() {
  const { id } = useParams();
  const { data: device, loading, error } = useApi(() => getDevice(id), [id]);
  const { data: settingsData } = useApi(
    async () => {
      const { data } = await api.get("/settings/status");
      return data;
    },
    []
  );
  const { data: historyData, setData: setHistory } = useApi(
    async () => {
      const { data } = await api.get(`/commands/${id}`);
      return data;
    },
    [id]
  );
  const history = Array.isArray(historyData) ? historyData : [];
  const allowWipe = Boolean(settingsData?.safety?.allow_device_wipe);

  async function runAction(kind) {
    await api.post(`/commands/${kind}`, { device_id: id });
    const { data } = await api.get(`/commands/${id}`);
    setHistory(data);
  }

  return (
    <AppShell title="Device Detail">
      {loading ? <div className="card">Loading...</div> : null}
      {error ? <div className="card">{error}</div> : null}
      {device ? (
        <div className="stack">
          <div className="card">
            <h3>{device.name || device.id}</h3>
            <div className="subtle">
              {device.model || "-"} · {device.os_version || "-"}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn" type="button" onClick={() => runAction("lock")}>
                Lock
              </button>
              <button className="btn" type="button" onClick={() => runAction("restart")}>
                Restart
              </button>
              {allowWipe ? (
                <button className="btn danger" type="button" onClick={() => runAction("wipe")}>
                  Wipe
                </button>
              ) : null}
            </div>
            {!allowWipe ? (
              <div className="subtle" style={{ marginTop: 10 }}>
                Wipe is disabled by safety policy. Set `ALLOW_DEVICE_WIPE=true` in environment to enable.
              </div>
            ) : null}
          </div>
          <div className="card">
            <h3>Installed Profiles</h3>
            <ul>
              {(device.profiles || []).map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3>Command History</h3>
            <ul>
              {history.map((h) => (
                <li key={h.uuid}>
                  {h.type} - {h.status}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
