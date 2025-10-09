// src/features/auth/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { AuthState, User } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

type AuthContextValue = {
    state: AuthState;
    loginViaBackend: (username: string, password: string) => Promise<{ token: string; role: string; username: string }>;
    logout: () => void;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({ status: "loading", user: null });

    const loginViaBackend = async (username: string, password: string) => {
        try {
            console.log("🔐 Attempting login for:", username);

            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username, password }),
            });

            console.log("📡 Login response status:", response.status);

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: "Login failed" }));
                console.error("❌ Login failed:", error);
                throw new Error(error.error || "Login failed");
            }

            const data = await response.json();
            const { token, user } = data;

            // เก็บ token พร้อม timestamp
            localStorage.setItem("token", token);
            localStorage.setItem("tokenTimestamp", Date.now().toString());

            console.log("✅ Login successful");
            console.log("👤 User:", user.username);
            console.log("🎭 Role:", user.role);
            console.log("🔑 Token saved (preview):", token.substring(0, 30) + "...");

            // ตั้งค่า user state พร้อม role
            setState({
                status: "authenticated",
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phoneNumber: user.phoneNumber,
                    idCard: user.idCard,
                    companyName: user.companyName,
                    taxId: user.taxId,
                    address: user.address,
                    verificationStatus: user.verificationStatus,
                },
            });

            return { token, role: user.role, username: user.username };
        } catch (error) {
            console.error("❌ Login error:", error);
            throw error;
        }
    };

    const logout = () => {
        console.log("🚪 Logging out...");
        localStorage.removeItem("token");
        localStorage.removeItem("tokenTimestamp");
        setState({ status: "unauthenticated", user: null });
        console.log("✅ Logged out successfully");
    };

    const refreshUser = async () => {
        const token = localStorage.getItem("token");
        const tokenTimestamp = localStorage.getItem("tokenTimestamp");

        if (!token) {
            console.log("⚠️ No token found in localStorage");
            setState({ status: "unauthenticated", user: null });
            return;
        }

        console.log("🔄 Refreshing user data...");
        console.log("🔑 Token exists:", !!token);

        // ตรวจสอบอายุ token (ถ้ามี timestamp)
        if (tokenTimestamp) {
            const tokenAge = Date.now() - parseInt(tokenTimestamp);
            const hoursOld = tokenAge / (1000 * 60 * 60);

            console.log(`⏰ Token age: ${hoursOld.toFixed(2)} hours`);

            // ถ้า token อายุมากกว่า 23 ชั่วโมง ให้ logout
            if (hoursOld > 23) {
                console.warn("⚠️ Token is about to expire, please login again");
                logout();
                return;
            }
        }

        try {
            const response = await fetch(`${API_BASE}/api/auth/me`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            console.log("📡 Profile fetch response status:", response.status);

            if (!response.ok) {
                if (response.status === 401) {
                    console.error("❌ Token is invalid or expired");
                    logout();
                    return;
                }
                throw new Error("Failed to fetch user");
            }

            const userData = await response.json();
            console.log("✅ User data refreshed successfully");
            console.log("👤 Username:", userData.username);
            console.log("🎭 Role:", userData.role);

            setState({
                status: "authenticated",
                user: {
                    id: userData.id,
                    username: userData.username,
                    email: userData.email,
                    role: userData.role,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    phoneNumber: userData.phoneNumber,
                    idCard: userData.idCard,
                    companyName: userData.companyName,
                    taxId: userData.taxId,
                    address: userData.address,
                    verificationStatus: userData.verificationStatus,
                },
            });
        } catch (error) {
            console.error("❌ Failed to refresh user:", error);
            logout();
        }
    };

    // ตรวจสอบ token เมื่อ mount
    useEffect(() => {
        console.log("🚀 AuthProvider mounted, checking authentication...");
        refreshUser();
    }, []);

    // Debug state changes
    useEffect(() => {
        console.log("📊 Auth state changed:", state.status);
        if (state.user) {
            console.log("👤 Current user:", state.user.username, `(${state.user.role})`);
        }
    }, [state]);

    return (
        <AuthContext.Provider value={{ state, loginViaBackend, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}