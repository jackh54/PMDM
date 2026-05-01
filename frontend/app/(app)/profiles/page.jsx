"use client";

import { useState } from "react";
import AppShell from "@/components/app-shell";
import { api } from "@/lib/api";
import { getProfiles, useApi } from "@/components/data-hooks";

const profileTypeOptions = [
  { value: "chrome", label: "Chrome Policy" },
  { value: "restrictions", label: "Restrictions" },
  { value: "password_policy", label: "Password Policy" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "login_window", label: "Login Window" }
];

export default function ProfilesPage() {
  const { data, loading, error, setData } = useApi(getProfiles, []);
  const profiles = Array.isArray(data) ? data : [];
  const [form, setForm] = useState({
    name: "",
    description: "",
    profileType: "restrictions",
    minOsVersion: "10.13"
  });

  async function createProfile(event) {
    event.preventDefault();
    await api.post("/profiles", { ...form, values: {} });
    const { data } = await api.get("/profiles");
    setData(data);
    setForm({ name: "", description: "", profileType: "restrictions", minOsVersion: "10.13" });
  }

  return (
    <AppShell title="Profiles">
      <div className="grid">
        <div className="card" style={{ gridColumn: "span 2" }}>
          <h3>Existing Profiles</h3>
          {error ? <div>{error}</div> : null}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Min OS</th>
                  <th>Created</th>
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
                    <td>{p.payload_type}</td>
                    <td>{p.min_os_version || "10.13"}</td>
                    <td>{p.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <label>Profile Type</label>
            <select value={form.profileType} onChange={(e) => setForm((p) => ({ ...p, profileType: e.target.value }))}>
              {profileTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button className="btn primary" type="submit">
            Save Profile
          </button>
        </form>
      </div>
    </AppShell>
  );
}
