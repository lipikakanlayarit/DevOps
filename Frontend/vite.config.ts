import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import path from 'path'

// ใช้ proxy ของ Vite → ส่ง /api/* ไป service "backend" ใน docker-compose
export default defineConfig({
    plugins: [react(), tailwind()],
    resolve: {
        alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://backend:8080', // ✅ ต้องใช้ชื่อ service = backend (ไม่ใช่ container_name)
                changeOrigin: true,
                // ห้าม rewrite prefix ออก เพราะ backend มี /api อยู่แล้ว
            },
        },
    },
})
