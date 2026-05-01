import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState("");

  async function load() {
    const { data } = await api.get("/groups");
    setGroups(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event) {
    event.preventDefault();
    await api.post("/groups", { name });
    setName("");
    await load();
  }

  return (
    <section>
      <h1>Groups</h1>
      <form onSubmit={submit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" required />
        <button type="submit">Create Group</button>
      </form>
      <ul>
        {groups.map((group) => (
          <li key={group.id}>{group.name}</li>
        ))}
      </ul>
    </section>
  );
}
