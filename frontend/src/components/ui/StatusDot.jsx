export default function StatusDot({ status }) {
  const color = status === "active" ? "#52c41a" : "#faad14";
  return (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        display: "inline-block",
        background: color
      }}
      aria-label={status}
    />
  );
}
