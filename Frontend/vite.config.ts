/// <reference types="vitest" />  // ✅ ให้ TypeScript รู้จัก field test จาก Vitest

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import path from 'path'

// ✅ ใช้ defineConfig เพื่อให้ Vite รู้ว่าเป็น config ของ TypeScript
export default defineConfig({
    plugins: [react(), tailwind()],

    resolve: {
        // ✅ ใช้ path.resolve แบบ cross-platform
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },

    server: {
        host: true, // ✅ ให้เข้าผ่าน LAN/Docker network ได้ (เช่น localhost, 0.0.0.0)
        port: 5173, // ✅ กำหนด port ชัดเจน
        proxy: {
            '/api': {
                target: process.env.VITE_BACKEND_URL || 'http://backend:8080',
                changeOrigin: true,
                secure: false,
            },
        },
    },

    // ✅ ให้ Vite โหลด environment variables ที่ขึ้นต้นด้วย VITE_
    envPrefix: 'VITE_',

    /* ==========================================================
       🧪 VITEST CONFIGURATION
    ========================================================== */
    esbuild: {
        target: 'esnext', // ✅ รองรับ syntax ใหม่สุดของ React + TS
    },

    test: {
        globals: true,                // ✅ ใช้ expect(), describe() ได้เลยโดยไม่ต้อง import
        environment: 'jsdom',         // ✅ จำลอง browser environment ให้ React ทำงานได้
        setupFiles: './setupTests.ts', // ✅ ไฟล์ setup ก่อนทุก test เช่น import jest-dom
        css: false,                   // ✅ ปิดโหลด CSS ระหว่าง test เพื่อความเร็ว
        include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'], // ✅ ระบุ pattern ของ test files

        deps: {
            inline: ['@testing-library/react', '@testing-library/jest-dom'], // ✅ ป้องกัน error dependency
        },

        // ✅ ตั้งค่า Coverage Report (เหมือน JaCoCo)
        coverage: {
            provider: 'v8',               // ✅ ใช้ engine v8 ในการวัด coverage
            reporter: ['text', 'html'],   // ✅ แสดงใน console และสร้าง HTML report
            all: true,                    // ✅ รวมทุกไฟล์ใน src แม้ไม่ได้ถูก test
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/main.tsx', 'src/vite-env.d.ts'],
            lines: 100,                   // ✅ ตั้งเป้าความครอบคลุม 100%
            functions: 100,
            branches: 100,
            statements: 100,
        },
    },
})
