/// <reference types="vitest" />  // ✅ ให้ TypeScript รู้จัก Vitest

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import path from 'path'

// ✅ ใช้ defineConfig เพื่อให้ Vite เข้าใจ config TypeScript
export default defineConfig({
    plugins: [react(), tailwind()],

    resolve: {
        alias: { '@': path.resolve(__dirname, './src') },
    },

    server: {
        proxy: {
            '/api': {
                target: 'http://backend:8080', // ✅ ใช้ชื่อ service backend ใน docker-compose
                changeOrigin: true,
                // ❗️อย่าตัด prefix /api ออก เพราะ backend มี /api อยู่แล้ว
            },
        },
    },

    // ✅ ให้โหลด environment variables ที่ขึ้นต้นด้วย VITE_
    envPrefix: 'VITE_',

    /* ==========================================================
       🧪 VITEST CONFIGURATION  (▼▼ เพิ่มมาใหม่ ห้ามตัดของเก่าออก)
    ========================================================== */
    test: {
        globals: true,                // ใช้ describe(), it(), expect() ได้เลย
        environment: 'jsdom',         // จำลอง Browser environment
        setupFiles: './src/setupTests.ts',
        css: false,
        include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],

        deps: {
            inline: [
                '@testing-library/react',
                '@testing-library/jest-dom'
            ],
        },

        // ==================================================
        // 📊 Coverage Report (HTML แบบ JaCoCo)
        // (แก้เฉพาะจุดสำคัญที่จำเป็นเท่านั้น)
        // ==================================================
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],      // สร้าง HTML report
            reportsDirectory: './coverage',   // ← เพิ่มอันนี้สำคัญมาก!

            all: true,
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/main.tsx',
                'src/vite-env.d.ts',
                'src/setupTests.ts',
            ],

            // ❗ ต้องตั้ง 0 เพื่อไม่ให้ block การสร้าง HTML report
            lines: 0,
            functions: 0,
            branches: 0,
            statements: 0,
        },
    },
})
