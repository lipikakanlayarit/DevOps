// src/lib/api.ts

// ทำ BASE ให้ลงท้ายด้วย /api เสมอ เพื่อกันกรณีตั้ง VITE_API_URL แบบไม่ใส่ /api
const RAW_BASE = (import.meta as any).env?.VITE_API_URL as string | undefined;
const BASE = (() => {
    if (!RAW_BASE) return "/api";
    const trimmed = RAW_BASE.replace(/\/+$/, "");
    return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
})();

const TOKEN_KEY = "auth.token";

export const getToken = () => {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
};

export const setToken = (token: string) => {
    try {
        localStorage.setItem(TOKEN_KEY, token);
    } catch {}
};

export const clearToken = () => {
    try {
        localStorage.removeItem(TOKEN_KEY);
    } catch {}
};

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const token = getToken();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(init?.headers as Record<string, string> | undefined),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;

    const res = await fetch(url, {
        headers,
        credentials: "include",
        ...init,
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("API Error", res.status, res.statusText, { url, body });
        throw new Error(`${res.status} ${res.statusText}: ${body}`);
    }
    if (res.status === 204) return undefined as unknown as T;
    return res.json() as Promise<T>;
}
