// src/features/auth/AuthContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import * as AuthAPI from "./auth.api";
import type { AuthState, Role, User } from "./types";
import { clearToken, setToken } from "@/lib/api";

type AuthContextValue = {
  state: AuthState;
  // สำหรับเดโมเดิม ยังเก็บไว้ใช้ได้ถ้าต้องการ
  loginAs: (role: Role, username?: string) => void;
  loginViaBackend: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // เริ่มต้นเป็น loading เพื่อกันจอกระพริบก่อน restore เสร็จ
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
  });

  // === bootstrap: ลอง restore จาก token + /auth/me ===
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // ลองเรียก /auth/me ถ้ามี token (header ใส่อัตโนมัติจาก lib/api.ts)
        const user = await AuthAPI.me();
        if (!mounted) return;
        setState({ status: "authenticated", user });
      } catch {
        if (!mounted) return;
        setState({ status: "unauthenticated", user: null });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // === ฟังก์ชันสำหรับเดโม (ยังคงไว้) ===
  const loginAs = useCallback((role: Role, username = role) => {
    const user: User = { id: "1", username, role };
    setState({ status: "authenticated", user });
  }, []);

  const loginViaBackend = useCallback(async (username: string, password: string) => {
    const res = await AuthAPI.login({ username, password });
    // เก็บ token + user
    setToken(res.token);
    setState({ status: "authenticated", user: res.user });
  }, []);

  const logout = useCallback(() => {
    try {
      // แจ้ง backend (mock ตอนนี้ทำอะไรไม่มาก)
      AuthAPI.logout().catch(() => {});
    } finally {
      clearToken();
      setState({ status: "unauthenticated", user: null });
    }
  }, []);

  const value = useMemo(
    () => ({ state, loginAs, loginViaBackend, logout }),
    [state, loginAs, loginViaBackend, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
