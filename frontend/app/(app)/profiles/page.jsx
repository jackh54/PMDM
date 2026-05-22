"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";
import ProfileValueFields from "@/components/profile-value-fields";
import { api } from "@/lib/api";
import { getProfiles, useApi } from "@/components/data-hooks";

const profileTypeOptions = [
  { value: "restrictions", label: "Restrictions" },
  { value: "chrome", label: "Chrome Policy" },
  { value: "password_policy", label: "Password Policy" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "login_window", label: "Login Window" },
  { value: "custom", label: "Custom payload" }
];

export default function ProfilesPage() {
  const { data, loading, error, setData } = useApi(getProfiles, []);
  const profiles = Array.isArray(data) ? data : [];
  const [schemas, setSchemas] = useState({});
  const [form, setForm] = useState({
    name: "",
    description: "",
    profileType: "restrictions",
    minOsVersion: "10.13",
    values: {}
  });
  const [assignTarget, setAssignTarget] = useState({ profileId: "", deviceId: "", groupId: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/profiles/schemas").then(({ data }) => setSchemas(data ?? {}));
  }, []);

  const activeSchema = schemas[form.profileType];

  const defaultValues = useMemo(() => {
    if (!activeSchema?.fields) {
      return {};
    }
    const next = {};
    for (const field of activeSchema.fields) {
      if (field.default !== undefined) {
        next[field.key] = field.default;
      } else if (field.type === "boolean") {
        next[field.key] = false;
      }
    }
    return next;
  }, [activeSchema]);

  function setProfileType(profileType) {
    setForm((prev) => ({
      ...prev,
      profileType,
      values: {}
    }));
  }

  function setValue(key, value) {
    setForm((prev) => ({
      ...prev,
      values: { ...prev.values, [key]: value }
    }));
  }

  async function createProfile(event) {
    event.preventDefault();
    setMessage("");
    const values = { ...defaultValues, ...form.values };
    await api.post("/profiles", { ...form, values });
    const { data } = await api.get("/profiles");
    setData(data);
    setForm({
      name: "",
      description: "",
      profileType: form.profileType,
      minOsVersion: "10.13",
      values: {}
    });
    setMessage("Profile saved. Assign it to a device to push configuration.");
  }

  async function assignProfile(profileId) {
    setMessage("");
    const body = {};
    if (assignTarget.deviceId) {
      body.device_id = assignTarget.deviceId;
    }
    if (assignTarget.groupId) {
      body.group_id = Number(assignTarget.groupId);
    }
    if (!body.device_id && !body.group_id) {
      setMessage("Enter a device UDID or group ID to assign.");
      return;
    }
    const { data } = await api.post(`/profiles/${profileId}/assign`, body);
    setMessage(`Profile queued for delivery (${data.deliveries?.length ?? 0} command(s)).`);
  }

  async function deleteProfile(profileId) {
    await api.delete(`/profiles/${profileId}`);
    const { data } = await api.get("/profiles");
    setData(data);
  }

  return (
    <AppShell title="Profiles & Policies">
      <div className="grid">
        <div className="card" style={{ gridColumn: "span 2" }}>
          <h3>Configuration Profiles</h3>
          <p className="subtle">
            Profiles are pushed to devices as Apple InstallProfile MDM commands when you assign them.
          </p>
          {message ? <div className="subtle">{message}</div> : null}
          {error ? <div>{error}</div> : null}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Min OS</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4}>Loading...</td>
                  </tr>
                ) : null}
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.profile_type || p.payload_type}</td>
                    <td>{p.min_os_version || "10.13"}</td>
                    <td>
                      <button className="btn" type="button" onClick={() => assignProfile(p.id)}>
                        Push to target
                      </button>{" "}
                      <button className="btn danger" type="button" onClick={() => deleteProfile(p.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="form-grid" style={{ marginTop: 16 }}>
            <div>
              <label>Assign to device UDID</label>
              <input
                value={assignTarget.deviceId}
                onChange={(e) => setAssignTarget((t) => ({ ...t, deviceId: e.target.value }))}
                placeholder="Device UDID from Devices page"
              />
            </div>
            <div>
              <label>Or assign via group ID</label>
              <input
                value={assignTarget.groupId}
                onChange={(e) => setAssignTarget((t) => ({ ...t, groupId: e.target.value }))}
                placeholder="Numeric group id"
              />
            </div>
          </div>
        </div>
        <form className="card form-grid" onSubmit={createProfile}>
          <h3>Create Profile</h3>
          <div>
            <label>Name</label>
            <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div>
            <label>Profile Type</label>
            <select value={form.profileType} onChange={(e) => setProfileType(e.target.value)}>
              {profileTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <ProfileValueFields
            schema={activeSchema}
            values={{ ...defaultValues, ...form.values }}
            onChange={setValue}
          />
          <button className="btn primary" type="submit">
            Save Profile
          </button>
        </form>
      </div>
    </AppShell>
  );
}
