import React, { createContext, useContext, useEffect, useReducer } from "react";

type AuthState =
    | { status: "loading" }
    | { status: "unauthenticated" }
    | { status: "authenticated"; token: string; username: string; role: string };

type Action =
    | {
    type: "RESTORE";
    payload: { token?: string | null; username?: string | null; role?: string | null };
}
    | { type: "LOGIN_SUCCESS"; payload: { token: string; username: string; role: string } }
    | { type: "LOGOUT" };

type AuthContextType = {
    state: AuthState;
    loginViaBackend: (
        identifier: string,
        password: string
    ) => Promise<{ token: string; username: string; role: string }>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
    state: { status: "loading" },
    loginViaBackend: async () => ({ token: "", username: "", role: "" }),
    logout: () => {},
});

function reducer(state: AuthState, action: Action): AuthState {
    switch (action.type) {
        case "RESTORE": {
            const { token, username, role } = action.payload;
            if (token && username && role) {
                return { status: "authenticated", token, username, role };
            }
            return { status: "unauthenticated" };
        }
        case "LOGIN_SUCCESS":
            return { status: "authenticated", ...action.payload };
        case "LOGOUT":
            return { status: "unauthenticated" };
        default:
            return state;
    }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, { status: "loading" });

    useEffect(() => {
        const token = localStorage.getItem("auth.token");
        const username = localStorage.getItem("auth.username");
        const role = localStorage.getItem("auth.role");
        dispatch({ type: "RESTORE", payload: { token, username, role } });
    }, []);

    async function loginViaBackend(identifier: string, password: string) {
        // เรียกผ่าน proxy: /api/*
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // ไม่เป็นไรถ้า backend ใช้ JWT อย่างเดียว
            body: JSON.stringify({ identifier, password }),
        });

        if (!res.ok) {
            const msg = (await res.json().catch(() => null))?.error || "Login failed";
            throw new Error(msg);
        }

        const data = (await res.json()) as { token: string; username: string; role: string };

        dispatch({ type: "LOGIN_SUCCESS", payload: data });

        localStorage.setItem("auth.token", data.token);
        localStorage.setItem("auth.username", data.username);
        localStorage.setItem("auth.role", data.role);

        return data;
    }

    function logout() {
        localStorage.removeItem("auth.token");
        localStorage.removeItem("auth.username");
        localStorage.removeItem("auth.role");
        dispatch({ type: "LOGOUT" });
    }

    return <AuthContext.Provider value={{ state, loginViaBackend, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
