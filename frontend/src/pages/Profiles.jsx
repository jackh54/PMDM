import { useEffect, useState } from "react";
import { createProfile, fetchProfiles } from "../api/profiles.js";

const profileTypeOptions = [
  { value: "chrome", label: "Chrome Policy" },
  { value: "restrictions", label: "Restrictions" },
  { value: "password_policy", label: "Password Policy" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "login_window", label: "Login Window" }
];

export default function Profiles() {
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", profileType: "restrictions", minOsVersion: "10.13" });

  async function reload() {
    setProfiles(await fetchProfiles());
  }

  useEffect(() => {
    reload();
  }, []);

  async function submit(event) {
    event.preventDefault();
    await createProfile({ ...form, values: {} });
    setForm({ name: "", description: "", profileType: "restrictions", minOsVersion: "10.13" });
    await reload();
  }

  return (
    <section>
      <h1>Profiles</h1>
      <form onSubmit={submit} className="card">
        <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Profile name" required />
        <input
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Description"
        />
        <select value={form.profileType} onChange={(e) => setForm((p) => ({ ...p, profileType: e.target.value }))}>
          {profileTypeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button type="submit">Create Profile</button>
      </form>
      <ul>
        {profiles.map((profile) => (
          <li key={profile.id}>
            {profile.name} ({profile.min_os_version || "10.13+"})
          </li>
        ))}
      </ul>
    </section>
  );
}
