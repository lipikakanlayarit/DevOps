# Frontend/Dockerfile

# ใช้ ECR mirror ของ official Node 20-bullseye-slim เพื่อเลี่ยง Docker Hub
ARG NODE_IMAGE=public.ecr.aws/docker/library/node:20-bullseye-slim
FROM ${NODE_IMAGE}

WORKDIR /app

# ติดตั้ง dependencies จาก lockfile (ถ้ามี) หรือ fallback เป็น npm install
COPY package*.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# คัดลอกซอร์ส (สำหรับกรณี build แบบเดี่ยว ๆ; ถ้ารันผ่าน docker-compose จะ bind-mount ทับ)
COPY . .

# เปิดพอร์ตของ Vite dev server
EXPOSE 5173

# คำสั่งรันถูกกำหนดใน docker-compose.yml:
# command: ["npm", "run", "dev", "--", "--host"]
# ถ้าต้องการรันเดี่ยว ๆ (ไม่ผ่าน compose) ให้ uncomment บรรทัดถัดไป
# CMD ["npm", "run", "dev", "--", "--host"]
