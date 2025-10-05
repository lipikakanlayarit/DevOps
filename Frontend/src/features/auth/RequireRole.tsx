// src/features/auth/RequireRole.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import type { ReactNode } from "react";

type Role = "USER" | "ADMIN" | "ORGANIZER" | "MODERATOR";

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

    if (state.status !== "authenticated" || !state.user) {
        const returnTo = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
    }

    // อ่าน role จาก state.user.role
    const userRole = state.user.role?.toUpperCase() as Role;

    if (!roles.includes(userRole)) {
        return <Navigate to="/forbidden" replace />;
    }

    return <>{children}</>;
}