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
    // ⭐⭐ สำคัญสำหรับรันใน container / k8s
    host: true,
    allowedHosts: ['devops.local'], // 👈 เพิ่มบรรทัดนี้เพื่อให้เข้า devops.local ได้

    proxy: {
      '/api': {
        target: 'http://backend:8080', // เดิมของคุณ ใช้กับ docker-compose ได้ปกติ
        changeOrigin: true,
        // ❗️อย่าตัด prefix /api ออก เพราะ backend มี /api อยู่แล้ว
      },
    },
  },

  // ✅ ให้โหลด environment variables ที่ขึ้นต้นด้วย VITE_
  envPrefix: 'VITE_',

  /* ==========================================================
     🧪 VITEST CONFIGURATION (ส่วน test ที่เพิ่ม)
  ========================================================== */
  test: {
    globals: true,                // ✅ ใช้ expect(), describe() ได้เลย
    environment: 'jsdom',         // ✅ จำลอง browser สำหรับ React
    setupFiles: './src/setupTests.ts', // ✅ setup ก่อนทุก test เช่น import jest-dom
    css: false,                   // ✅ ปิดโหลด CSS ใน test เพื่อความเร็ว
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'], // ✅ ไฟล์ test pattern

    deps: {
      inline: [
        '@testing-library/react',
        '@testing-library/jest-dom'
      ], // ✅ ป้องกัน dependency error
    },

    // ✅ Coverage Report เหมือน JaCoCo
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'], // ✅ แสดงทั้ง console และ HTML
      all: true,                  // ✅ รวมทุกไฟล์ src แม้ไม่มี test
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts'],
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100,
    },
  },
})
