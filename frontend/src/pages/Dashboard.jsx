import { useEffect } from "react";
import { useDevicesStore } from "../store/devices.js";

export default function Dashboard() {
  const { items, refresh } = useDevicesStore();
  useEffect(() => {
    refresh();
  }, [refresh]);

  const active = items.filter((d) => d.status === "active").length;
  const offline = items.filter((d) => d.status !== "active").length;

  return (
    <section>
      <h1>Dashboard</h1>
      <div className="grid">
        <article className="card">
          <h3>Total Devices</h3>
          <p>{items.length}</p>
        </article>
        <article className="card">
          <h3>Online</h3>
          <p>{active}</p>
        </article>
        <article className="card">
          <h3>Offline</h3>
          <p>{offline}</p>
        </article>
      </div>
    </section>
  );
}
