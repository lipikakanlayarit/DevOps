import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import type { ReactNode } from "react";

type Role = "USER" | "ADMIN" | "ORGANIZER";

export default function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) {
  const { state } = useAuth();
  const location = useLocation();

  // ยังไม่ล็อกอิน → ส่งไป login
  if (state.status !== "authenticated") {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  // ล็อกอินแล้ว แต่ role ไม่ตรง → ส่งไป forbidden
  if (!roles.includes(state.user.role as Role)) {
    return <Navigate to="/forbidden" replace />;
  }

  // ผ่านทุกเงื่อนไข
  return <>{children}</>;
}
