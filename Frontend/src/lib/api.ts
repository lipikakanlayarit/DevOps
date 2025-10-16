// src/lib/api.ts
import axios from "axios";

/**
 * ✅ BASE URL
 * - ถ้าไม่ได้ตั้งค่า VITE_API_URL -> ใช้ "/api" (ให้ Vite proxy ไป backend)
 * - ถ้าตั้งเป็น "http://localhost:8080" -> จะต่อท้าย "/api" ให้อัตโนมัติ
 * - ถ้าตั้งเป็น "http://localhost:8080/api" ก็ใช้ได้เลย
 */
const RAW_BASE = (import.meta as any).env?.VITE_API_URL as string | undefined;
const API_BASE = (() => {
    if (!RAW_BASE) return "/api";
    const t = RAW_BASE.replace(/\/+$/, ""); // ตัด / ท้าย
    return t.endsWith("/api") ? t : `${t}/api`;
})();

export const api = axios.create({
    baseURL: API_BASE,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

// ======================================================
// ✅ Request Interceptor – แนบ Token ทุก Request
// ======================================================
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log("🔑 Token attached to request");
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ======================================================
// ✅ Response Interceptor – จัดการ 401 Unauthorized
// ======================================================
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error("❌ 401 Unauthorized - Clearing token and redirecting");
            localStorage.removeItem("token");
            localStorage.removeItem("tokenTimestamp");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

// ======================================================
// ✅ Auth API
// ======================================================
export const authApi = {
    login: (username: string, password: string) =>
        api.post("/auth/login", { username, password }),

    signup: (data: {
        email: string;
        username: string;
        password: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        idCard: string;
    }) => api.post("/auth/signup", data),

    signupOrganizer: (data: {
        email: string;
        username: string;
        password: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        address: string;
        companyName: string;
        taxId: string;
    }) => api.post("/auth/organizer/signup", data),

    me: () => api.get("/auth/me"),
};

// ======================================================
// ✅ Profile API
// ======================================================
export const profileApi = {
    getProfile: () => api.get("/auth/me"),

    updateUser: (data: {
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        idCard?: string;
    }) => api.put("/profile/user", data),

    updateOrganizer: (data: {
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        companyName?: string;
        taxId?: string;
        address?: string;
    }) => api.put("/profile/organizer", data),
};

// ======================================================
// ✅ Event & Ticket API (เพิ่มส่วนนี้)
// ======================================================
export const eventApi = {
    // สร้างอีเวนต์ใหม่
    createEvent: (data: {
        eventName: string;
        description?: string;
        categoryId?: number;
        startDateTime: string;
        endDateTime: string;
        venueName: string;
        venueAddress?: string;
        maxCapacity?: number;
    }) => api.post("/events", data),

    // ตั้งค่า tickets สำหรับอีเวนต์นั้น
    setupTickets: (eventId: number, data: any) =>
        api.post(`/events/${eventId}/tickets/setup`, data),

    // ดึงรายละเอียดอีเวนต์
    getEventById: (id: number) => api.get(`/events/${id}`),

    // ดึงอีเวนต์ทั้งหมด
    getAllEvents: () => api.get("/events"),
};

// ======================================================
// ✅ Admin API
// ======================================================
export const adminApi = {
    getAllUsers: () => api.get("/admin/users"),
    getUserById: (id: string) => api.get(`/admin/users/${id}`),
    changeUserRole: (id: string, role: string) =>
        api.patch(`/admin/users/${id}/role`, { role }),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

    getAllOrganizers: () => api.get("/admin/organizers"),
    getOrganizerById: (id: string) => api.get(`/admin/organizers/${id}`),
    verifyOrganizer: (id: string) => api.patch(`/admin/organizers/${id}/verify`),
    rejectOrganizer: (id: string) => api.patch(`/admin/organizers/${id}/reject`),
    updateOrganizerStatus: (id: string, status: string) =>
        api.patch(`/admin/organizers/${id}/status`, { status }),
    deleteOrganizer: (id: string) => api.delete(`/admin/organizers/${id}`),

    getStatistics: () => api.get("/admin/stats"),
};
