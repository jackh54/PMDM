"use client";

import { useState } from "react";
import AppShell from "@/components/app-shell";
import { api } from "@/lib/api";
import { getGroups, useApi } from "@/components/data-hooks";

export default function GroupsPage() {
  const { data, loading, error, setData } = useApi(getGroups, []);
  const groups = Array.isArray(data) ? data : [];
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [message, setMessage] = useState("");

  async function createGroup(event) {
    event.preventDefault();
    await api.post("/groups", { name, description });
    const { data } = await api.get("/groups");
    setData(data);
    setName("");
    setDescription("");
  }

  async function addDeviceToGroup(event) {
    event.preventDefault();
    setMessage("");
    const { data } = await api.post(`/groups/${groupId}/devices`, { device_id: deviceId });
    setMessage(`Device added. Profiles pushed: ${data.profileDeliveries?.length ?? 0}`);
    setDeviceId("");
  }

  return (
    <AppShell title="Groups">
      <div className="grid">
        <div className="card" style={{ gridColumn: "span 2" }}>
          <h3>Fleet Groups</h3>
          {error ? <div>{error}</div> : null}
          <ul>
            {loading ? <li>Loading...</li> : null}
            {groups.map((group) => (
              <li key={group.id}>
                <strong>{group.name}</strong> (id {group.id}) — {group.description || "No description"}
              </li>
            ))}
          </ul>
          {message ? <p className="subtle">{message}</p> : null}
        </div>
        <form className="card form-grid" onSubmit={addDeviceToGroup}>
          <h3>Add device to group</h3>
          <div>
            <label>Group ID</label>
            <input value={groupId} required onChange={(e) => setGroupId(e.target.value)} />
          </div>
          <div>
            <label>Device UDID</label>
            <input value={deviceId} required onChange={(e) => setDeviceId(e.target.value)} />
          </div>
          <button className="btn primary" type="submit">
            Add device & push group profiles
          </button>
        </form>
        <form className="card form-grid" onSubmit={createGroup}>
          <h3>Create Group</h3>
          <div>
            <label>Name</label>
            <input value={name} required onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <button className="btn primary" type="submit">
            Create
          </button>
        </form>
      </div>
    </AppShell>
  );
}
