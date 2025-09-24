// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwind()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    proxy: {
      '/api': {
        target: 'http://spring-backend:8080', // ⬅️ ใช้ชื่อ service ใน docker-compose
        changeOrigin: true,
        // ถ้า backend ไม่ได้มี prefix /api ให้ปลด prefix ออก:
        // rewrite: (p) => p.replace(/^\/api/, '')
      }
    }
  }
})
