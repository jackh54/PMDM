import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Devices from "./pages/Devices.jsx";
import DeviceDetail from "./pages/DeviceDetail.jsx";
import Profiles from "./pages/Profiles.jsx";
import Groups from "./pages/Groups.jsx";
import Settings from "./pages/Settings.jsx";
import { useAuthStore } from "./store/auth.js";

function Protected({ children }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <Protected>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/devices" element={<Devices />} />
                <Route path="/devices/:id" element={<DeviceDetail />} />
                <Route path="/profiles" element={<Profiles />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </Protected>
        }
      />
    </Routes>
  );
}
