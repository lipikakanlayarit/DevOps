
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function PrivateRoute() {
  const loc = useLocation();
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt");

  if (!token) {
    return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  }
  return <Outlet />;
}
