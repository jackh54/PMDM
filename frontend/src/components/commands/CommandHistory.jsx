export default function CommandHistory({ history }) {
  return (
    <ul>
      {history.map((entry) => (
        <li key={entry.uuid}>
          {entry.type} - {entry.status}
        </li>
      ))}
    </ul>
  );
}
