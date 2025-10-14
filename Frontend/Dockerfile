# Frontend/Dockerfile.dev
ARG NODE_IMAGE=node:20-bullseye-slim
FROM ${NODE_IMAGE}

WORKDIR /app

# ใช้ lockfile ตามที่มีจริง (npm)
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# เปิดพอร์ต dev server ของ Vite
EXPOSE 5173

# โค้ดจริงจะ bind-mount ผ่าน docker-compose
CMD ["npm", "run", "dev", "--", "--host"]
