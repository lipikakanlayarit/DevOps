// src/lib/api.ts
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const api = axios.create({
    baseURL: API_BASE,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

// Request interceptor - แนบ token ทุก request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - จัดการ 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

// Helper functions
export const authApi = {
    login: (username: string, password: string) =>
        api.post("/api/auth/login", { username, password }),

    signup: (data: {
        email: string;
        username: string;
        password: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        idCard: string;
    }) => api.post("/api/auth/signup", data),

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
    }) => api.post("/api/auth/organizer/signup", data),

    me: () => api.get("/api/auth/me"),
};

export const adminApi = {
    // Users
    getAllUsers: () => api.get("/api/admin/users"),
    getUserById: (id: string) => api.get(`/api/admin/users/${id}`),
    changeUserRole: (id: string, role: string) =>
        api.patch(`/api/admin/users/${id}/role`, { role }),
    deleteUser: (id: string) => api.delete(`/api/admin/users/${id}`),

    // Organizers
    getAllOrganizers: () => api.get("/api/admin/organizers"),
    getOrganizerById: (id: string) => api.get(`/api/admin/organizers/${id}`),
    verifyOrganizer: (id: string) => api.patch(`/api/admin/organizers/${id}/verify`),
    rejectOrganizer: (id: string) => api.patch(`/api/admin/organizers/${id}/reject`),
    updateOrganizerStatus: (id: string, status: string) =>
        api.patch(`/api/admin/organizers/${id}/status`, { status }),
    deleteOrganizer: (id: string) => api.delete(`/api/admin/organizers/${id}`),

    // Stats
    getStatistics: () => api.get("/api/admin/stats"),
};