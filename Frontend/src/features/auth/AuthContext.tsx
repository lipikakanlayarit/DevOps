// src/features/auth/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { AuthState, User } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

type AuthContextValue = {
    state: AuthState;
    loginViaBackend: (username: string, password: string) => Promise<{ token: string; role: string; username: string }>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({ status: "loading", user: null });

    const loginViaBackend = async (username: string, password: string) => {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || "Login failed");
        }

        const data = await response.json();
        const { token, user } = data;

        // เก็บ token
        localStorage.setItem("token", token);

        // ตั้งค่า user state
        setState({
            status: "authenticated",
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        });

        return { token, role: user.role, username: user.username };
    };

    const logout = () => {
        localStorage.removeItem("token");
        setState({ status: "unauthenticated", user: null });
    };

    // ตรวจสอบ token เมื่อ refresh
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setState({ status: "unauthenticated", user: null });
            return;
        }

        // ถ้ามี token ให้ verify กับ backend (optional)
        // สำหรับตอนนี้ให้ถือว่ามี token = authenticated
        // TODO: เพิ่ม /api/auth/me endpoint เพื่อ verify token
        setState({ status: "authenticated", user: null }); // จะต้องดึง user data จริง
    }, []);

    return (
        <AuthContext.Provider value={{ state, loginViaBackend, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}