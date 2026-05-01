import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function Settings() {
  const [audit, setAudit] = useState([]);
  const [apnsStatus, setApnsStatus] = useState(null);

  useEffect(() => {
    async function load() {
      const [{ data: devicesData }, { data: settingsData }] = await Promise.all([
        api.get("/devices"),
        api.get("/settings/status")
      ]);
      setAudit(devicesData.slice(0, 5));
      setApnsStatus(settingsData.apns);
    }
    load();
  }, []);

  return (
    <section>
      <h1>Settings</h1>
      <p>
        APNS configured: {apnsStatus?.configured ? "yes" : "no"}{" "}
        {apnsStatus?.expires_at ? `· cert mtime ${apnsStatus.expires_at}` : ""}
      </p>
      <h2>Recent Devices</h2>
      <ul>
        {audit.map((d) => (
          <li key={d.id}>
            {d.name || d.id} · last seen {d.last_seen || "never"}
          </li>
        ))}
      </ul>
    </section>
  );
}
