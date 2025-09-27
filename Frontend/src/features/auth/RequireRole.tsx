import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import type { ReactNode } from "react";

type Role = "USER" | "ADMIN" | "ORGANIZER";

export default function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
    const { state } = useAuth();
    const location = useLocation();

    if (state.status === "loading") {
        return (
            <div className="h-[60vh] grid place-items-center">
                <div className="animate-spin h-6 w-6 border-2 border-zinc-400 border-t-transparent rounded-full" />
            </div>
        );
    }
    if (state.status !== "authenticated") {
        const returnTo = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
    }

    const rawRole = state.role ?? "";
    const userRoles = rawRole
        .split(",")
        .map((r) => r.trim().toUpperCase())
        .filter(Boolean) as Role[];

    const allowed = userRoles.some((r) => roles.includes(r));
    if (!allowed) return <Navigate to="/forbidden" replace />;

    return <>{children}</>;
}
