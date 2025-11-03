import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedAdmin({ children }) {
  const { ready, user, accessToken } = useAuth();

  if (!ready) return null; // or a small spinner
  const isAdmin = user && String(user.designation).toUpperCase() === "ADMIN";

  if (!accessToken || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // If a child element is provided (e.g. <AdminLayout/>), render it; otherwise use <Outlet/>
  return children ?? <Outlet />;
}
