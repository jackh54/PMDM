import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Topbar />
        <main>{children}</main>
      </div>
    </div>
  );
}
