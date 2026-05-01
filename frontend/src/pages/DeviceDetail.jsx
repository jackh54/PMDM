import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchCommandHistory, lockDevice, restartDevice, wipeDevice } from "../api/commands.js";
import { fetchDevice } from "../api/devices.js";

export default function DeviceDetail() {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function load() {
      const [deviceData, commandData] = await Promise.all([fetchDevice(id), fetchCommandHistory(id)]);
      setDevice(deviceData);
      setHistory(commandData);
    }
    load();
  }, [id]);

  async function runAction(action) {
    if (action === "lock") await lockDevice(id);
    if (action === "restart") await restartDevice(id);
    if (action === "wipe") await wipeDevice(id);
    const commandData = await fetchCommandHistory(id);
    setHistory(commandData);
  }

  if (!device) return <p>Loading...</p>;

  return (
    <section>
      <h1>{device.name || id}</h1>
      <p>
        {device.model} · {device.os_version}
      </p>
      <div className="actions">
        <button type="button" onClick={() => runAction("lock")}>
          Lock
        </button>
        <button type="button" onClick={() => runAction("restart")}>
          Restart
        </button>
        <button type="button" onClick={() => runAction("wipe")}>
          Wipe
        </button>
      </div>
      <h2>Installed Profiles</h2>
      <ul>{(device.profiles || []).map((p) => <li key={p.id}>{p.name}</li>)}</ul>
      <h2>Command History</h2>
      <ul>{history.map((h) => <li key={h.uuid}>{h.type} · {h.status}</li>)}</ul>
    </section>
  );
}
