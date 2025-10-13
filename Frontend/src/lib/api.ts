import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// Debug logs (optional)
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt");
    if (token) {
      const bearer = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
      (config.headers as any).Authorization = bearer;
      console.log("🪪 Attaching Authorization:", bearer);
    }
    console.log("➡️ Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      if (!window.location.pathname.startsWith("/login")) {
        const backTo = window.location.pathname + window.location.search;
        window.location.replace(`/login?from=${encodeURIComponent(backTo)}`);
      }
    }
    return Promise.reject(err);
  }
);

// ===== Auth API =====
export const authApi = {
  login: (username: string, password: string) =>
    api.post("/api/auth/login", { username, password }),
  signup: (data: {
    email: string; username: string; password: string;
    firstName: string; lastName: string; phoneNumber: string; idCard: string;
  }) => api.post("/api/auth/signup", data),
  signupOrganizer: (data: {
    email: string; username: string; password: string;
    firstName: string; lastName: string; phoneNumber: string;
    address: string; companyName: string; taxId: string;
  }) => api.post("/api/auth/organizer/signup", data),
  me: () => api.get("/api/auth/me"),
};

// ===== Profile API =====
export const profileApi = {
  getProfile: () => api.get("/api/auth/me"),
  updateUser: (data: {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    idCard: string;
  }) => api.put("/api/auth/me", data),
  updateOrganizer: (data: {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    companyName: string;
    taxId: string;
    address: string;
  }) => api.put("/api/auth/me", data),
};
