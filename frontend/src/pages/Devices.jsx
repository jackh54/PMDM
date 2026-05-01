import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDevicesStore } from "../store/devices.js";

export default function Devices() {
  const { items, refresh, loading } = useDevicesStore();

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <section>
      <h1>Devices</h1>
      {loading ? <p>Loading...</p> : null}
      <table className="table">
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
          {items.map((device) => (
            <tr key={device.id}>
              <td>
                <Link to={`/devices/${device.id}`}>{device.name || device.id}</Link>
              </td>
              <td>{device.serial_number || "-"}</td>
              <td>{device.model || "-"}</td>
              <td>{device.os_version || "-"}</td>
              <td>{device.status}</td>
              <td>{device.group_name || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
