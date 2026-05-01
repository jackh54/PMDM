"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Monitor, Shield, Settings, Users, LayoutDashboard, UserCog } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/devices", label: "Devices", icon: Monitor },
  { href: "/profiles", label: "Profiles", icon: Shield },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/enrollment", label: "Enrollment", icon: UserCog },
  { href: "/settings", label: "Settings", icon: Settings }
];

export default function AppShell({ title, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthed, ready, logout } = useAuth();

  useEffect(() => {
    if (ready && !isAuthed) {
      router.replace("/login");
    }
  }, [ready, isAuthed, router]);

  if (!ready || !isAuthed) return null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">PMDM</div>
        <div className="subtle">Production macOS device management</div>
        <nav className="nav">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={pathname === href ? "active" : ""}>
              <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <Icon size={15} />
                {label}
              </span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main">
        <div className="topbar">
          <div className="title">{title}</div>
          <button className="btn" onClick={logout} type="button">
            Log out
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
