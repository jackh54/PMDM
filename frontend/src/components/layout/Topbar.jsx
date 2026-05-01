import { useAuthStore } from "../../store/auth.js";

export default function Topbar() {
  const logout = useAuthStore((s) => s.logout);
  return (
    <header className="topbar">
      <strong>Custom MDM Platform</strong>
      <button type="button" onClick={logout}>
        Logout
      </button>
    </header>
  );
}
