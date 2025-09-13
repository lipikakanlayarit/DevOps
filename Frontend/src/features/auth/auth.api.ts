// src/features/auth/auth.api.ts
import { api } from "@/lib/api";
import type { User } from "./types";

export type LoginReq = { username: string; password: string };
export type LoginRes = { user: User; token: string };

export const login = (body: LoginReq) =>
  api<LoginRes>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const me = () => api<User>("/auth/me", { method: "GET" });

export const logout = () => api<void>("/auth/logout", { method: "POST" });
