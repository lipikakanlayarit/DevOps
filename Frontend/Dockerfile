# Frontend/Dockerfile.dev
# ใช้ Node บน Debian/Ubuntu (glibc) เพื่อให้ lightningcss ทำงานได้
ARG NODE_IMAGE=node:20-bookworm-slim
FROM ${NODE_IMAGE}

# ทำงานเป็น non-root เพื่อความปลอดภัย (ออปชัน แต่แนะนำ)
# หมายเหตุ: node official image มี user "node" มาให้แล้ว
USER node

WORKDIR /app

# คัดลอกเฉพาะ lockfile/manifest ก่อน เพื่อใช้ layer cache เวลา npm ci
COPY --chown=node:node package.json package-lock.json ./

# ติดตั้ง dependency (ไม่รัน audit/fund ให้เร็วขึ้น)
RUN npm ci --no-audit --no-fund

# เปิดพอร์ต dev server ของ Vite
EXPOSE 5173

# โค้ดจริงจะ bind-mount เข้ามาผ่าน docker-compose (จงใจไม่ COPY src ที่นี่)
# ถ้าต้องการตั้งค่า HOST/PUBLIC URL เพิ่มเติม เติมผ่าน env ตอน docker-compose ได้
CMD ["npm", "run", "dev", "--", "--host"]
