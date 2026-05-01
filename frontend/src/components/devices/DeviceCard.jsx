export default function DeviceCard({ device }) {
  return (
    <article className="card">
      <h3>{device.name || device.id}</h3>
      <p>{device.model || "-"}</p>
    </article>
  );
}
