// src/lib/api.ts

const RAW_BASE = (import.meta.env.VITE_API_URL ?? "").trim();
/**
 * โหมดแนะนำ:
 * - Dev + Vite proxy: ไม่ต้องตั้ง VITE_API_URL => BASE จะเป็น "/api"
 * - Prod/Container: ตั้ง VITE_API_URL เช่น "http://spring-backend:8080" หรือ "https://api.example.com"
 */
const BASE = RAW_BASE ? stripTrailingSlash(RAW_BASE) : "/api";

const TOKEN_KEY = "auth.token";

function stripTrailingSlash(u: string) {
    return u.endsWith("/") ? u.slice(0, -1) : u;
}

function isAbsoluteUrl(u: string) {
    return /^https?:\/\//i.test(u);
}

function joinUrl(base: string, path: string) {
    if (isAbsoluteUrl(path)) return path; // ถ้า path เป็น absolute แล้ว ให้ใช้ตามนั้น
    if (!base) return path;
    if (path.startsWith("/")) return `${base}${path}`;
    return `${base}/${path}`;
}

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

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const token = getToken();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(init?.headers as Record<string, string> | undefined),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = joinUrl(BASE, path); // รองรับทั้ง "/api/..." และ URL ตรง
    const res = await fetch(url, {
        headers,
        credentials: "include", // ใช้คุกกี้ได้; ถ้าไม่มีคุกกี้ก็ไม่มีผล
        ...init,
    });

    // แปลง error ให้อ่านง่ายขึ้น
    if (!res.ok) {
        let detail = "";
        const ct = res.headers.get("content-type") || "";
        try {
            if (ct.includes("application/json")) {
                const j = await res.json();
                detail = typeof j === "string" ? j : JSON.stringify(j);
            } else {
                detail = await res.text();
            }
        } catch {
            // ignore parse error
        }
        throw new Error(`HTTP ${res.status} ${res.statusText}${detail ? `: ${detail}` : ""}`);
    }

    if (res.status === 204) return undefined as unknown as T;

    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
        return (await res.json()) as T;
    }
    // กรณี backend ไม่ส่ง JSON (เช่น text/empty)
    return undefined as unknown as T;
}
