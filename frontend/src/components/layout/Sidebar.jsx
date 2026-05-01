import { Link } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/devices", label: "Devices" },
  { to: "/profiles", label: "Profiles" },
  { to: "/groups", label: "Groups" },
  { to: "/settings", label: "Settings" }
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h2>PMDM</h2>
      <nav>
        {links.map((link) => (
          <Link key={link.to} to={link.to}>
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
