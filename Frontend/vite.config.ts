import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import path from "path";

// ใช้ env เพื่อรองรับการรันทั้งนอก Docker และใน Docker
// .env.local (รันบนเครื่อง): VITE_PROXY_TARGET=http://localhost:8080
// .env (ใน compose):        VITE_PROXY_TARGET=http://backend:8080
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const target = env.VITE_PROXY_TARGET || "http://localhost:8080";

    return {
        plugins: [react(), tailwind()],
        resolve: {
            alias: { "@": path.resolve(__dirname, "./src") },
        },
        server: {
            proxy: {
                "/api": {
                    target,
                    changeOrigin: true,
                    // ไม่ rewrite prefix /api เพราะ backend ก็ใช้ /api เหมือนกัน
                },
            },
        },
    };
});
