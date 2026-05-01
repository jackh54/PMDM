export default function ProfileCard({ profile }) {
  return (
    <article className="card">
      <h3>{profile.name}</h3>
      <p>{profile.description}</p>
    </article>
  );
}
